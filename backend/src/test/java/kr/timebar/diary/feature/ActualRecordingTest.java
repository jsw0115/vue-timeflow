// 실제 SQL과 HTTP를 통해 기록 복구·멱등성·경쟁 요청·계정 격리를 검증한다.
package kr.timebar.diary.feature;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.common.*;
import kr.timebar.diary.records.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class ActualRecordingTest {
    @Autowired ActualRecordingService service;
    @Autowired FeatureStore store;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper mapper;
    String user;
    @BeforeEach void setup() { user = UUID.randomUUID().toString(); jdbc.update("INSERT INTO users(id) VALUES (?)", user); }
    @AfterEach void clear() { org.springframework.security.core.context.SecurityContextHolder.clearContext(); }
    Map<String,Object> startBody(String key) { return Map.of("requestId", key, "title", "실제 활동", "timeZone", "Asia/Seoul"); }

    @Test void recreatingServiceRecoversTheSameSessionAndBothCommandsAreIdempotent() {
        String key = UUID.randomUUID().toString();
        var first = service.start(user, startBody(key));
        assertEquals(first, service.start(user, startBody(key)));
        assertEquals(first, new ActualRecordingService(store, jdbc).current(user).get("active"));
        var finish = Map.<String,Object>of("requestId", UUID.randomUUID().toString(), "version", 1, "endedAt", Instant.now().toString());
        var completed = service.finish(user, key, finish);
        assertEquals(completed, service.finish(user, key, finish));
        assertEquals(2L, completed.get("version"));
        assertEquals("COMPLETED", completed.get("state"));
        assertNotNull(completed.get("elapsedSeconds"));
        assertNull(service.current(user).get("active"));
        assertEquals(1, service.list(user).size());
        assertTrue(store.all(user, FeatureType.FOCUS).isEmpty(), "실제 기록을 집중 세션으로 중복 생성하지 않는다.");
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> service.get("other", key)).errorCode());
    }
    @Test void invalidCommandsAndStaleVersionsDoNotChangeTheActiveRecord() {
        String key = UUID.randomUUID().toString(); service.start(user, startBody(key));
        assertThrows(ApiException.class, () -> service.start(user, Map.of("requestId", key, "title", "변조", "timeZone", "Asia/Seoul")));
        assertThrows(ApiException.class, () -> service.start(user, startBody(UUID.randomUUID().toString())));
        assertThrows(ApiException.class, () -> service.finish(user, key, Map.of("requestId", key, "version", 1, "endedAt", "2020-01-01T00:00:00Z")));
        assertThrows(ApiException.class, () -> service.finish(user, key, Map.of("requestId", key, "version", 1, "endedAt", Instant.now().plusSeconds(60).toString())));
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class, () -> service.finish(user, key, Map.of("requestId", key, "version", 2, "endedAt", Instant.now().toString()))).errorCode());
        assertEquals("RUNNING", service.get(user, key).get("state"));
        assertEquals(1L, service.get(user, key).get("version"));
    }
    @Test void concurrentStartsAndFinishesProduceOneRecord() throws Exception {
        var executor = Executors.newFixedThreadPool(2);
        try {
            var gate = new CountDownLatch(1); String id = UUID.randomUUID().toString();
            var one = executor.submit(() -> { gate.await(); return service.start(user, startBody(id)); });
            var two = executor.submit(() -> { gate.await(); return service.start(user, startBody(id)); });
            gate.countDown(); assertEquals(one.get(10, TimeUnit.SECONDS), two.get(10, TimeUnit.SECONDS));
            var body = Map.<String,Object>of("requestId", UUID.randomUUID().toString(), "version", 1, "endedAt", Instant.now().toString());
            var finishOne = executor.submit(() -> service.finish(user, id, body));
            var finishTwo = executor.submit(() -> service.finish(user, id, body));
            assertEquals(finishOne.get(10, TimeUnit.SECONDS), finishTwo.get(10, TimeUnit.SECONDS));
            assertEquals(1, service.list(user).size());
        } finally { executor.shutdownNow(); }
    }
    @Test void httpRejectsAnonymousAndOwnerInjectionAndReturnsStoredData() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new ActualRecordingController(service)).setControllerAdvice(new ApiExceptionHandler()).build();
        mvc.perform(get("/api/planner/recordings/current")).andExpect(status().isUnauthorized());
        authenticate(user);
        String id = UUID.randomUUID().toString();
        mvc.perform(post("/api/planner/recordings/start").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(startBody(id))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id));
        var injected = new LinkedHashMap<>(startBody(id)); injected.put("ownerId", "other");
        mvc.perform(post("/api/planner/recordings/start").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(injected))).andExpect(status().isBadRequest());
        authenticate("other");
        mvc.perform(get("/api/planner/recordings/" + id)).andExpect(status().isNotFound());
    }
    @Test void midnightActualsAreCountedOnceWithoutAddingFocusMinutes() {
        var aggregation = org.mockito.Mockito.mock(kr.timebar.diary.planner.PlannerAggregationService.class);
        var planner = org.mockito.Mockito.mock(kr.timebar.diary.planner.PlannerService.class);
        var schedules = org.mockito.Mockito.mock(ScheduleService.class);
        org.mockito.Mockito.when(aggregation.range(org.mockito.ArgumentMatchers.eq(user), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(new kr.timebar.diary.planner.PlannerViewResponse(List.of(), List.of(), List.of()));
        store.create(user, FeatureType.ACTUAL_SESSION, Map.of("title", "자정 기록", "state", "COMPLETED", "timeZone", "Asia/Seoul", "startedAt", "2026-11-14T14:55:00Z", "endedAt", "2026-11-14T15:08:00Z", "elapsedSeconds", 780));
        var insight = new InsightService(store, aggregation, planner, schedules);
        assertEquals(5L, insight.stats(user, "2026-11-14", "2026-11-14").get("actualMinutes"));
        assertEquals(8L, insight.stats(user, "2026-11-15", "2026-11-15").get("actualMinutes"));
        assertEquals(13L, insight.stats(user, "2026-11-14", "2026-11-15").get("actualMinutes"));
        assertEquals(0L, insight.stats(user, "2026-11-14", "2026-11-15").get("focusMinutes"));
        assertEquals(1, insight.timeBlocks(user, "2026-11-15", null).size());
    }
    private void authenticate(String owner) {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated(
                        new kr.timebar.diary.security.AuthUserPrincipal(owner, "test@example.test", "USER"), null, List.of()));
    }
}
