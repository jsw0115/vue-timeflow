// 생성 요청의 멱등 키가 같은 기록을 두 번 만들지 않고, 다른 내용·다른 계정·삭제·정리를 올바르게 다루는지 검증한다(PR-07 3단계, Q-13, UT-129 서버 부분).
package kr.timebar.diary.feature;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.common.IdempotencyKeys;
import kr.timebar.diary.records.RecordService;
import kr.timebar.diary.records.RecordsController;
import kr.timebar.diary.records.ScheduleController;
import kr.timebar.diary.records.ScheduleService;
import kr.timebar.diary.security.AuthUserPrincipal;
import kr.timebar.diary.work.WorkController;
import kr.timebar.diary.work.WorkService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(FeatureTestConfig.class)
class IdempotencyHttpTest {
    @Autowired RecordService records;
    @Autowired WorkService work;
    @Autowired ScheduleService schedules;
    @Autowired IdempotencyKeys idempotency;
    @Autowired FeatureStore store;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    MockMvc mvc;
    String owner;

    @BeforeEach void setup() {
        owner = UUID.randomUUID().toString();
        authenticate(owner);
        mvc = MockMvcBuilders.standaloneSetup(new RecordsController(records), new ScheduleController(records, schedules), new WorkController(records, work))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    private void authenticate(String user) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                new AuthUserPrincipal(user, "idem@example.test", "USER"), null, List.of()));
    }
    private String send(String path, String key, Map<String, Object> body, int expected) throws Exception {
        var request = post("/api/" + path).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body));
        if (key != null) request.header(IdempotencyKeys.HEADER, key);
        var result = mvc.perform(request).andExpect(status().is(expected)).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString()).path("data").path("id").asText(null);
    }

    @Test void sameKeyAndBodyReturnsTheFirstRecordWithoutCreatingAnother() throws Exception {
        var body = new LinkedHashMap<String, Object>();
        body.put("title", "로컬 메모"); body.put("body", "내용");
        String first = send("memos", "local:memo:3", body, 201);
        // 필드 순서가 달라도 같은 내용이면 같은 요청이다
        var reordered = new LinkedHashMap<String, Object>();
        reordered.put("body", "내용"); reordered.put("title", "로컬 메모");
        assertEquals(first, send("memos", "local:memo:3", reordered, 201));
        assertEquals(1, store.all(owner, FeatureType.MEMO).size());
        send("memos", null, body, 201);
        assertEquals(2, store.all(owner, FeatureType.MEMO).size(), "키가 없으면 지금처럼 매번 만든다");
    }

    @Test void sameKeyWithDifferentBodyIsRejectedAndInvalidKeysAreBadRequests() throws Exception {
        send("diaries", "local:diary:1", Map.of("title", "일기", "date", "2026-11-19"), 201);
        send("diaries", "local:diary:1", Map.of("title", "다른 일기", "date", "2026-11-19"), 409);
        send("diaries", "공백 있는 키", Map.of("title", "일기", "date", "2026-11-19"), 400);
        send("diaries", "x".repeat(101), Map.of("title", "일기", "date", "2026-11-19"), 400);
        assertEquals(1, store.all(owner, FeatureType.DIARY).size());
    }

    @Test void keysAreScopedPerAccountAndReplayOfDeletedRecordIsNotFound() throws Exception {
        var body = Map.<String, Object>of("title", "시험", "date", "2026-12-01");
        String mine = send("ddays", "local:dday:1", body, 201);
        authenticate(UUID.randomUUID().toString());
        String theirs = send("ddays", "local:dday:1", body, 201);
        assertNotEquals(mine, theirs, "다른 계정의 같은 키는 다른 기록이다");
        authenticate(owner);
        store.delete(owner, FeatureType.DDAY, mine, 1);
        send("ddays", "local:dday:1", body, 404);
        assertEquals(0, store.all(owner, FeatureType.DDAY).size(), "지운 기록을 다시 만들지 않는다");
    }

    @Test void schedulesRoutinesMoneyAndCareerAcceptTheKey() throws Exception {
        var schedule = Map.<String, Object>of("title", "회의", "startDate", "2026-11-20", "endDate", "2026-11-20", "startTime", "10:00", "endTime", "11:00");
        assertEquals(send("schedules", "local:event:4", schedule, 201), send("schedules", "local:event:4", schedule, 201));
        var routine = Map.<String, Object>of("title", "물", "startDate", "2026-11-20", "time", "08:00", "duration", 10, "days", List.of(1, 2), "goal", Map.of("count", 8, "unit", "잔"));
        assertEquals(send("routine-records", "local:routine:4", routine, 201), send("routine-records", "local:routine:4", routine, 201));
        var money = Map.<String, Object>of("title", "점심", "date", "2026-11-20", "type", "out", "amount", -9000);
        assertEquals(send("money/entries", "local:money:9", money, 201), send("money/entries", "local:money:9", money, 201));
        var career = Map.<String, Object>of("title", "프로젝트", "role", "개발");
        assertEquals(send("work/career/projects", "local:career:2", career, 201), send("work/career/projects", "local:career:2", career, 201));
        assertEquals(1, store.all(owner, FeatureType.SCHEDULE).size());
        assertEquals(1, store.all(owner, FeatureType.ROUTINE_RECORD).size());
        assertEquals(1, store.all(owner, FeatureType.MONEY).size());
        assertEquals(1, store.all(owner, FeatureType.CAREER).size());
    }

    @Test void concurrentRequestsWithTheSameKeyCreateOnlyOneRecord() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Object>> results = new ArrayList<>();
            for (int i = 0; i < 2; i++) results.add(executor.submit(() -> {
                start.await();
                try { return records.create(owner, FeatureType.MEMO, Map.of("title", "동시"), "local:memo:77").get("id"); }
                catch (ApiException e) { return e.errorCode(); }
            }));
            start.countDown();
            List<Object> values = new ArrayList<>();
            for (var result : results) values.add(result.get(10, TimeUnit.SECONDS));
            assertEquals(1, store.all(owner, FeatureType.MEMO).size(), "기록은 하나만 생긴다: " + values);
        } finally { executor.shutdownNow(); }
    }

    @Test void expiredKeysArePurgedAfterSevenDays() throws Exception {
        send("memos", "local:memo:old", Map.of("title", "오래된"), 201);
        send("memos", "local:memo:new", Map.of("title", "새"), 201);
        jdbc.update("UPDATE idempotency_key SET created_at=? WHERE owner_id=? AND idem_key=?", Timestamp.from(Instant.now().minus(8, ChronoUnit.DAYS)), owner, "local:memo:old");
        assertTrue(idempotency.purgeExpired() >= 1);
        assertEquals(List.of("local:memo:new"), jdbc.queryForList("SELECT idem_key FROM idempotency_key WHERE owner_id=?", String.class, owner));
    }
}
