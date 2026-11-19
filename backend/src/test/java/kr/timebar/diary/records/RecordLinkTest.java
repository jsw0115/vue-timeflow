// 할 일·일정·실제 기록 연결의 소유자 검사, 삭제 시 연결만 끊기, 중복 집계 없음을 검증한다(PR-08 1단계, TS-13).
package kr.timebar.diary.records;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.planner.PlannerAggregationService;
import kr.timebar.diary.planner.PlannerService;
import kr.timebar.diary.planner.PlannerViewResponse;
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

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class RecordLinkTest {
    @Autowired RecordLinks links;
    @Autowired ActualRecordingService recordings;
    @Autowired RecordService records;
    @Autowired ScheduleService schedules;
    @Autowired FeatureStore store;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper mapper;
    String user, other;
    MockMvc mvc;

    @BeforeEach void setup() {
        user = UUID.randomUUID().toString(); other = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO users(id) VALUES (?)", user); jdbc.update("INSERT INTO users(id) VALUES (?)", other);
        mvc = MockMvcBuilders.standaloneSetup(new RecordLinkController(links), new ActualRecordingController(recordings), new ScheduleController(records, schedules, links))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    /** UT-140·UT-141: 할 일을 11-19 14:00~15:00 일정으로 배치하면 양쪽에 연결이 보이고, 그 뒤 할 일 제목을 바꿔도 일정 제목은 그대로다. */
    @Test void placingTaskCreatesLinkedScheduleThatKeepsItsOwnTitle() {
        String task = task(user, "보고서 작성");
        var schedule = links.placeTask(user, task, slot("2026-11-19", "14:00", "15:00"), null);
        assertEquals("보고서 작성", schedule.get("title"));
        String scheduleId = schedule.get("id").toString();
        assertEquals(List.of(Map.of("kind", "schedule", "id", scheduleId, "title", "보고서 작성", "direction", "target")), links.of(user, "task", task));
        assertEquals(List.of(Map.of("kind", "task", "id", task, "title", "보고서 작성", "direction", "source")), links.of(user, "schedule", scheduleId));

        jdbc.update("UPDATE task SET title=? WHERE id=?", "보고서 최종본 작성", task);
        assertEquals("보고서 작성", store.get(user, FeatureType.SCHEDULE, scheduleId).get("title"));
    }

    /** 같은 멱등 키로 다시 배치하면 처음 만든 일정을 돌려주고, 다른 계정의 할 일은 404이며 일정을 만들지 않는다. */
    @Test void placingIsIdempotentAndOwnerScoped() {
        String task = task(user, "장보기");
        var first = links.placeTask(user, task, slot("2026-11-20", "18:00", "18:30"), "retry-1");
        assertEquals(first, links.placeTask(user, task, slot("2026-11-20", "18:00", "18:30"), "retry-1"));
        assertEquals(1, store.all(user, FeatureType.SCHEDULE).size());
        String foreign = task(other, "남의 할 일");
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> links.placeTask(user, foreign, slot("2026-11-20", "09:00", "10:00"), null)).errorCode());
        jdbc.update("UPDATE task SET d_at=CURRENT_TIMESTAMP WHERE id=?", task);
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> links.placeTask(user, task, slot("2026-11-21", "09:00", "10:00"), null)).errorCode());
        assertEquals(1, store.all(user, FeatureType.SCHEDULE).size());
    }

    /** UT-142·UT-144: 일정에서 시작한 기록에 원본이 남고, 일정을 지우면 기록은 남은 채 연결만 끊긴다. */
    @Test void recordingStartedFromScheduleKeepsSourceAndSurvivesScheduleDeletion() throws Exception {
        authenticate(user);
        String scheduleId = schedule(user, "집중 작업");
        String id = UUID.randomUUID().toString();
        mvc.perform(post("/api/planner/recordings/start").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("requestId", id, "title", "집중 작업", "timeZone", "Asia/Seoul", "sourceKind", "schedule", "sourceId", scheduleId))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.sourceKind").value("schedule")).andExpect(jsonPath("$.data.sourceId").value(scheduleId));
        recordings.finish(user, id, Map.of("requestId", UUID.randomUUID().toString(), "version", 1, "endedAt", Instant.now().toString()));
        mvc.perform(get("/api/record-links").param("kind", "actual").param("id", id))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].kind").value("schedule")).andExpect(jsonPath("$.data[0].id").value(scheduleId));

        mvc.perform(delete("/api/schedules/" + scheduleId).param("version", "1")).andExpect(status().isNoContent());
        var kept = recordings.get(user, id);
        assertEquals("COMPLETED", kept.get("state"));
        assertEquals("schedule", kept.get("sourceKind"));
        assertEquals(scheduleId, kept.get("sourceId"), "원본 ID가 남아 화면이 \"삭제된 일정\"으로 보일 수 있다.");
        assertTrue(links.of(user, "actual", id).isEmpty());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM record_link WHERE owner_id=?", Integer.class, user));
    }

    /** UT-145: B 계정 일정 ID로 A가 기록을 시작하면 404이고 기록이 생기지 않는다. 연결 조회도 같은 404다. */
    @Test void otherAccountsSourceIsNotFoundAndCreatesNothing() throws Exception {
        String foreign = schedule(other, "B의 일정");
        authenticate(user);
        mvc.perform(post("/api/planner/recordings/start").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("requestId", UUID.randomUUID().toString(), "title", "남의 일정", "timeZone", "Asia/Seoul", "sourceKind", "schedule", "sourceId", foreign))))
                .andExpect(status().isNotFound());
        assertTrue(recordings.list(user).isEmpty());
        mvc.perform(get("/api/record-links").param("kind", "schedule").param("id", foreign)).andExpect(status().isNotFound());
        mvc.perform(post("/api/tasks/" + task(other, "B의 할 일") + "/schedules").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(slot("2026-11-19", "10:00", "11:00")))).andExpect(status().isNotFound());
        assertTrue(store.all(user, FeatureType.SCHEDULE).isEmpty());
    }

    /** 원본 종류·ID는 함께 보내야 하고, 허용한 종류만 받는다. 같은 요청 ID로 원본만 바꿔 다시 보내면 409다. */
    @Test void sourceFieldsAreValidatedAndPartOfTheIdempotentStart() throws Exception {
        authenticate(user);
        String scheduleId = schedule(user, "회의");
        for (var body : List.of(Map.of("sourceKind", "schedule"), Map.of("sourceKind", "diary", "sourceId", scheduleId), Map.of("sourceId", scheduleId))) {
            var request = new LinkedHashMap<String,Object>(Map.of("requestId", UUID.randomUUID().toString(), "title", "기록", "timeZone", "Asia/Seoul")); request.putAll(body);
            mvc.perform(post("/api/planner/recordings/start").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/record-links").param("kind", "diary").param("id", scheduleId)).andExpect(status().isBadRequest());
        String id = UUID.randomUUID().toString();
        recordings.start(user, Map.of("requestId", id, "title", "회의", "timeZone", "Asia/Seoul", "sourceKind", "schedule", "sourceId", scheduleId));
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class, () -> recordings.start(user, Map.of("requestId", id, "title", "회의", "timeZone", "Asia/Seoul"))).errorCode());
        assertEquals(1, links.of(user, "schedule", scheduleId).size());
    }

    /** 할 일을 지우면 그 할 일의 연결만 지워지고 일정은 남는다(UF-93). */
    @Test void forgettingTaskRemovesOnlyItsLinks() {
        String task = task(user, "운동");
        String scheduleId = links.placeTask(user, task, slot("2026-11-19", "07:00", "08:00"), null).get("id").toString();
        jdbc.update("UPDATE task SET d_at=CURRENT_TIMESTAMP WHERE id=?", task);
        links.forget(user, "task", task);
        assertTrue(links.of(user, "schedule", scheduleId).isEmpty());
        assertEquals("운동", store.get(user, FeatureType.SCHEDULE, scheduleId).get("title"));
    }

    /** UT-150: 일정 60분과 연결된 실제 기록 45분이 있는 날은 계획 60분, 실제 45분이다. */
    @Test void linkedScheduleAndActualAreCountedOnceEach() {
        String scheduleId = schedule(user, "집필");
        var actual = store.create(user, FeatureType.ACTUAL_SESSION, Map.of("title", "집필", "state", "COMPLETED", "timeZone", "Asia/Seoul",
                "startedAt", "2026-11-19T01:00:00Z", "endedAt", "2026-11-19T01:45:00Z", "elapsedSeconds", 2700, "sourceKind", "schedule", "sourceId", scheduleId));
        links.link(user, "schedule", scheduleId, "actual", actual.get("id").toString());
        var aggregation = mock(PlannerAggregationService.class);
        when(aggregation.range(eq(user), any(), any())).thenReturn(new PlannerViewResponse(List.of(), List.of(), List.of()));
        var stats = new InsightService(store, aggregation, mock(PlannerService.class), schedules).stats(user, "2026-11-19", "2026-11-19");
        assertEquals(60L, stats.get("plannedMinutes"));
        assertEquals(45L, stats.get("actualMinutes"));
    }

    private String task(String owner, String title) {
        String id = UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        jdbc.update("INSERT INTO task(id,user_id,title) VALUES (?,?,?)", id, owner, title);
        return id;
    }
    private String schedule(String owner, String title) {
        return records.create(owner, FeatureType.SCHEDULE, new LinkedHashMap<>(Map.of("title", title, "startDate", "2026-11-19", "endDate", "2026-11-19", "startTime", "10:00", "endTime", "11:00"))).get("id").toString();
    }
    private static Map<String,Object> slot(String date, String start, String end) {
        return new LinkedHashMap<>(Map.of("startDate", date, "endDate", date, "startTime", start, "endTime", end));
    }
    private void authenticate(String owner) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                new kr.timebar.diary.security.AuthUserPrincipal(owner, "test@example.test", "USER"), null, List.of()));
    }
}
