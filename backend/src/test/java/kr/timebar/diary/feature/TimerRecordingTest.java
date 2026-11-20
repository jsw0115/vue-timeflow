// 집중 타이머 세 가지와 일시정지·취소가 실제 기록 시간을 서버 시각 기준으로 지키는지 검증한다(PR-09 1단계, UF-120~UF-122).
package kr.timebar.diary.feature;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.common.*;
import kr.timebar.diary.records.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class TimerRecordingTest {
    /** 시간이 흐른 것처럼 시각을 고정할 기준. 서울 2026-11-18 10:00이다. */
    static final Instant T = Instant.parse("2026-11-18T01:00:00Z");
    @Autowired ActualRecordingService service;
    @Autowired FeatureStore store;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper mapper;
    @Autowired RecordLinks links;
    @Autowired RecordService records;
    @Autowired DayPolicy days;
    String user;

    @BeforeEach void setup() { user = UUID.randomUUID().toString(); jdbc.update("INSERT INTO users(id) VALUES (?)", user); }
    @AfterEach void clear() { org.springframework.security.core.context.SecurityContextHolder.clearContext(); }

    Map<String,Object> body(String key, String mode, Object target) {
        var body = new LinkedHashMap<String,Object>(Map.of("requestId", key, "title", "기획안 초안", "timeZone", "Asia/Seoul"));
        if (mode != null) body.put("mode", mode);
        if (target != null) body.put("targetMinutes", target);
        return body;
    }
    Map<String,Object> body(String mode, Object target) { return body(UUID.randomUUID().toString(), mode, target); }
    static long version(Map<String,Object> row) { return ((Number)row.get("version")).longValue(); }
    static long elapsed(Map<String,Object> row) { return ((Number)row.get("elapsedSeconds")).longValue(); }
    ErrorCode error(Runnable action) { return assertThrows(ApiException.class, action::run).errorCode(); }
    void cancel(Map<String,Object> row) { service.cancel(user, row.get("id").toString(), Map.of("version", version(row))); }
    Map<String,Object> finish(Map<String,Object> row, Instant end) {
        return service.finish(user, row.get("id").toString(), Map.of("requestId", UUID.randomUUID().toString(), "version", version(row), "endedAt", end.toString()));
    }
    /** 서버가 찍은 시작·일시정지 시각을 고정 시각으로 바꿔 그만큼 시간이 흐른 것처럼 만든다. */
    Map<String,Object> rewrite(Map<String,Object> row, Map<String,Object> changes) {
        var data = FeatureStore.payload(store.get(user, FeatureType.ACTUAL_SESSION, row.get("id").toString()));
        data.putAll(changes);
        return store.replace(user, FeatureType.ACTUAL_SESSION, row.get("id").toString(), version(store.get(user, FeatureType.ACTUAL_SESSION, row.get("id").toString())), data);
    }
    static Map<String,Object> pause(Instant from, Instant to) {
        var pause = new LinkedHashMap<String,Object>(); pause.put("from", from.toString()); if (to != null) pause.put("to", to.toString()); return pause;
    }
    InsightService insight() {
        var aggregation = org.mockito.Mockito.mock(kr.timebar.diary.planner.PlannerAggregationService.class);
        org.mockito.Mockito.when(aggregation.range(org.mockito.ArgumentMatchers.eq(user), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(new kr.timebar.diary.planner.PlannerViewResponse(List.of(), List.of(), List.of()));
        return new InsightService(store, aggregation, org.mockito.Mockito.mock(kr.timebar.diary.planner.PlannerService.class), org.mockito.Mockito.mock(ScheduleService.class), days);
    }

    /** UT-210: 스톱워치는 목표 시간 없이 시작한다. 스톱워치·모드 없는 기록에 목표 시간을 보내면 거부한다. */
    @Test void stopwatchHasNoTarget() {
        var row = service.start(user, body("stopwatch", null));
        assertEquals("stopwatch", row.get("mode"));
        assertFalse(row.containsKey("targetMinutes"));
        var done = finish(row, Instant.now());
        assertFalse(done.containsKey("targetMinutes"), "끝낸 기록에도 임의 목표 시간을 채우지 않는다.");
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> service.start(user, body("stopwatch", 25))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> service.start(user, body(null, 25))));
    }

    /** UT-211: 카운트다운은 1~1,440분만 시작한다. 포모도로·카운트다운은 목표 시간이 있어야 하고, 정한 모드만 받는다. */
    @Test void countdownTargetBounds() {
        for (Object minutes : List.of(0, 1441, 1.5, "25")) assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> service.start(user, body("countdown", minutes))), "목표 " + minutes);
        for (int minutes : List.of(1, 1440)) {
            var row = service.start(user, body("countdown", minutes));
            assertEquals(minutes, ((Number)row.get("targetMinutes")).intValue());
            cancel(row);
        }
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> service.start(user, body("countdown", null))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> service.start(user, body("pomodoro", null))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> service.start(user, body("free", 25))));
        assertTrue(service.list(user).isEmpty());
    }

    /** UT-212: 포모도로 50분을 13분에 끝내면 실제 기록·통계 모두 13분이다(08 UT-49). 목표 시간이 아니라 서버 시작·종료 시각으로 센다. */
    @Test void pomodoroFinishedEarlyKeepsActualMinutes() {
        var row = service.start(user, body("pomodoro", 50));
        var done = finish(rewrite(row, Map.of("startedAt", T.toString())), T.plusSeconds(13 * 60));
        assertEquals("COMPLETED", done.get("state"));
        assertEquals(780L, elapsed(done));
        assertEquals(50, ((Number)done.get("targetMinutes")).intValue());
        var stats = insight().stats(user, "2026-11-18", "2026-11-18");
        assertEquals(13L, stats.get("actualMinutes"));
        assertEquals(13L, stats.get("focusMinutes"), "타이머 기록은 집중 시간에도 들어간다(2026-11-20 사용자 결정).");
        assertTrue(store.all(user, FeatureType.FOCUS).isEmpty(), "집중 세션(FOCUS)을 따로 만들지 않는다.");
    }

    /** 집중 시간에는 타이머 기록만 더한다. 모드 없는 플래너 기록은 실제 시간에만 들어간다. 원본 행 합계는 수치와 같다(UF-118). */
    @Test void focusMinutesCountTimerRecordsButNotPlannerRecords() {
        store.create(user, FeatureType.ACTUAL_SESSION, Map.of("title", "플래너 기록", "state", "COMPLETED", "timeZone", "Asia/Seoul",
                "startedAt", T.toString(), "endedAt", T.plusSeconds(20 * 60).toString(), "elapsedSeconds", 1200));
        // 서울 11-18 23:50 시작, 00:05~00:10 일시정지, 00:20 종료. 집중은 11-18에 10분, 11-19에 15분
        Instant late = Instant.parse("2026-11-18T14:50:00Z");
        String timer = store.create(user, FeatureType.ACTUAL_SESSION, Map.of("title", "야간 집중", "state", "COMPLETED", "timeZone", "Asia/Seoul", "mode", "stopwatch",
                "startedAt", late.toString(), "endedAt", late.plusSeconds(30 * 60).toString(), "elapsedSeconds", 1500,
                "pauses", List.of(pause(late.plusSeconds(15 * 60), late.plusSeconds(20 * 60))))).get("id").toString();
        var day = insight().stats(user, "2026-11-18", "2026-11-18");
        assertEquals(30L, day.get("actualMinutes"));
        assertEquals(10L, day.get("focusMinutes"));
        var rows = (List<?>)((Map<?,?>)day.get("sources")).get("focus");
        assertEquals(1, rows.size());
        var row = (Map<?,?>)rows.get(0);
        assertEquals("recording", row.get("kind"));
        assertEquals(timer, row.get("recordId"));
        assertEquals(10L, row.get("minutes"));
        var both = insight().stats(user, "2026-11-18", "2026-11-19");
        assertEquals(25L, both.get("focusMinutes"));
        assertEquals(25L, ((List<?>)((Map<?,?>)both.get("sources")).get("focus")).stream().mapToLong(item -> ((Number)((Map<?,?>)item).get("minutes")).longValue()).sum());
    }

    /** UT-214: 20분 진행, 5분 일시정지, 10분 진행 후 끝내면 실제 30분이다. 일시정지·재개 시각은 서버가 찍는다. */
    @Test void pausedTimeIsExcludedFromActualMinutes() {
        Instant before = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MILLIS);
        var row = service.start(user, body("countdown", 60));
        String id = row.get("id").toString();
        var paused = service.pause(user, id, Map.of("version", version(row)));
        assertEquals("PAUSED", paused.get("state"));
        var pauses = (List<?>)paused.get("pauses");
        assertEquals(1, pauses.size());
        Instant from = Instant.parse(((Map<?,?>)pauses.get(0)).get("from").toString());
        assertFalse(from.isBefore(before) || from.isAfter(Instant.now()), "일시정지 시각은 서버 현재 시각이다.");
        assertFalse(((Map<?,?>)pauses.get(0)).containsKey("to"));
        assertEquals(paused, service.current(user).get("active"), "일시정지한 기록도 진행 중 기록으로 복구한다.");
        assertEquals(ErrorCode.CONFLICT, error(() -> service.start(user, body("stopwatch", null))));
        assertEquals(ErrorCode.CONFLICT, error(() -> service.pause(user, id, Map.of("version", version(paused)))));
        var resumed = service.resume(user, id, Map.of("version", version(paused)));
        assertEquals("RUNNING", resumed.get("state"));
        assertTrue(((Map<?,?>)((List<?>)resumed.get("pauses")).get(0)).containsKey("to"));
        assertEquals(ErrorCode.CONFLICT, error(() -> service.resume(user, id, Map.of("version", version(resumed)))));
        assertEquals(ErrorCode.CONFLICT, error(() -> service.pause(user, id, Map.of("version", version(row)))), "오래된 version은 거부한다.");

        var timed = rewrite(resumed, Map.of("startedAt", T.toString(), "pauses", List.of(pause(T.plusSeconds(20 * 60), T.plusSeconds(25 * 60)))));
        var done = finish(timed, T.plusSeconds(35 * 60));
        assertEquals(1800L, elapsed(done));
        var stats = insight().stats(user, "2026-11-18", "2026-11-18");
        assertEquals(30L, stats.get("actualMinutes"));
        assertEquals(30L, ((Map<?,?>)((List<?>)((Map<?,?>)stats.get("sources")).get("actual")).get(0)).get("minutes"));
    }

    /** 일시정지한 채 끝내면 일시정지를 종료 시각에서 닫는다. 마지막 일시정지·재개보다 이른 종료는 거부해 음수 시간을 만들지 않는다(UF-122). */
    @Test void finishingWhilePausedClosesThePause() {
        var row = service.start(user, body("stopwatch", null));
        var paused = service.pause(user, row.get("id").toString(), Map.of("version", version(row)));
        var timed = rewrite(paused, Map.of("startedAt", T.toString(), "pauses", List.of(pause(T.plusSeconds(10 * 60), null))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> finish(timed, T.plusSeconds(5 * 60))));
        var done = finish(timed, T.plusSeconds(30 * 60));
        assertEquals(600L, elapsed(done));
        assertEquals(T.plusSeconds(30 * 60).toString(), ((Map<?,?>)((List<?>)done.get("pauses")).get(0)).get("to"));

        var resumed = service.start(user, body("stopwatch", null));
        var closed = rewrite(resumed, Map.of("startedAt", T.toString(), "pauses", List.of(pause(T.plusSeconds(60), T.plusSeconds(20 * 60)))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> finish(closed, T.plusSeconds(10 * 60))), "재개보다 이른 종료");
        assertEquals(60L, elapsed(finish(closed, T.plusSeconds(20 * 60))));
    }

    /** 일시정지가 자정을 넘으면 날짜마다 그날 실제로 기록한 시간만 센다. */
    @Test void pauseAcrossMidnightIsCountedPerDay() {
        // 서울 11-17 23:50 시작, 23:55~00:10 일시정지, 00:20 종료
        Instant start = Instant.parse("2026-11-17T14:50:00Z");
        store.create(user, FeatureType.ACTUAL_SESSION, Map.of("title", "자정 집중", "state", "COMPLETED", "timeZone", "Asia/Seoul", "mode", "stopwatch",
                "startedAt", start.toString(), "endedAt", start.plusSeconds(30 * 60).toString(), "elapsedSeconds", 900,
                "pauses", List.of(pause(start.plusSeconds(5 * 60), start.plusSeconds(20 * 60)))));
        assertEquals(5L, insight().stats(user, "2026-11-17", "2026-11-17").get("actualMinutes"));
        assertEquals(10L, insight().stats(user, "2026-11-18", "2026-11-18").get("actualMinutes"));
        assertEquals(15L, insight().stats(user, "2026-11-17", "2026-11-18").get("actualMinutes"));
    }

    /** UT-215: 시작 직후 0초에 취소하면 기록이 남지 않고 원본 연결도 지운다. 끝낸 기록·다른 계정 기록·오래된 version은 취소하지 않는다. */
    @Test void cancellingRightAfterStartLeavesNoRecord() {
        String schedule = records.create(user, FeatureType.SCHEDULE, new LinkedHashMap<>(Map.of("title", "보고서", "startDate", "2026-11-18", "endDate", "2026-11-18", "startTime", "10:00", "endTime", "11:00"))).get("id").toString();
        var withSource = body("pomodoro", 25); withSource.put("sourceKind", "schedule"); withSource.put("sourceId", schedule);
        var row = service.start(user, withSource);
        assertEquals(1, links.of(user, RecordLinks.SCHEDULE, schedule).size());
        assertEquals(ErrorCode.NOT_FOUND, error(() -> service.cancel("other", row.get("id").toString(), Map.of("version", 1))));
        assertEquals(ErrorCode.CONFLICT, error(() -> service.cancel(user, row.get("id").toString(), Map.of("version", 2))));
        cancel(row);
        assertTrue(service.list(user).isEmpty());
        assertNull(service.current(user).get("active"));
        assertTrue(links.of(user, RecordLinks.SCHEDULE, schedule).isEmpty());

        var done = finish(service.start(user, body("stopwatch", null)), Instant.now());
        assertEquals(ErrorCode.CONFLICT, error(() -> cancel(done)));
        assertEquals(1, service.list(user).size());
    }

    /**
     * 서버가 찍는 시작·일시정지·재개 시각은 밀리초까지다. 화면(JavaScript)은 밀리초까지만 계산하므로,
     * 화면이 계산한 목표 도달 시각(시작 + 목표 + 일시정지)으로 끝내면 목표 시간과 정확히 같아야 한다(PR-09 2단계 브라우저 점검에서 59초로 저장된 결함).
     */
    @Test void serverInstantsAreMillisecondsSoTargetEndIsExact() {
        var row = service.start(user, body("countdown", 1));
        var paused = service.pause(user, row.get("id").toString(), Map.of("version", version(row)));
        var resumed = service.resume(user, row.get("id").toString(), Map.of("version", version(paused)));
        var pause = (Map<?,?>)((List<?>)resumed.get("pauses")).get(0);
        for (Object value : List.of(resumed.get("startedAt"), pause.get("from"), pause.get("to")))
            assertEquals(0, Instant.parse(value.toString()).getNano() % 1_000_000, "밀리초 아래 자리가 없어야 한다: " + value);
        // 화면처럼 밀리초 수로 목표 도달 시각을 만든다
        long startMs = Instant.parse(resumed.get("startedAt").toString()).toEpochMilli();
        long pausedMs = Instant.parse(pause.get("to").toString()).toEpochMilli() - Instant.parse(pause.get("from").toString()).toEpochMilli();
        var timed = rewrite(resumed, Map.of("startedAt", Instant.ofEpochMilli(startMs - 120_000).toString(),
                "pauses", List.of(pause(Instant.ofEpochMilli(startMs - 90_000), Instant.ofEpochMilli(startMs - 90_000 + pausedMs)))));
        long end = Instant.parse(timed.get("startedAt").toString()).toEpochMilli() + 60_000 + pausedMs;
        assertEquals(60L, elapsed(finish(timed, Instant.ofEpochMilli(end))));
    }

    /** 일시정지는 한 기록에 100번까지다. 기록 하나의 저장 크기를 묶는다. */
    @Test void pauseCountIsBounded() {
        var row = service.start(user, body("stopwatch", null));
        var hundred = new ArrayList<Map<String,Object>>();
        for (int i = 0; i < 100; i++) hundred.add(pause(T.plusSeconds(i * 120L), T.plusSeconds(i * 120L + 60)));
        var full = rewrite(row, Map.of("startedAt", T.toString(), "pauses", hundred));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> service.pause(user, full.get("id").toString(), Map.of("version", version(full)))));
        assertEquals("RUNNING", service.get(user, full.get("id").toString()).get("state"));
    }

    /** 같은 요청 식별자로 모드나 목표 시간만 바꿔 다시 보내면 409다. 같은 내용이면 같은 기록을 돌려준다. */
    @Test void replayWithDifferentTimerConflicts() {
        String key = UUID.randomUUID().toString();
        var first = service.start(user, body(key, "pomodoro", 25));
        assertEquals(first, service.start(user, body(key, "pomodoro", 25)));
        assertEquals(ErrorCode.CONFLICT, error(() -> service.start(user, body(key, "pomodoro", 50))));
        assertEquals(ErrorCode.CONFLICT, error(() -> service.start(user, body(key, "countdown", 25))));
        assertEquals(ErrorCode.CONFLICT, error(() -> service.start(user, body(key, null, null))));
    }

    /** HTTP: 로그인 없이는 401, 허용하지 않은 필드는 400, 일시정지·재개는 기록을, 취소는 본문 없는 204를 돌려준다. */
    @Test void httpPauseResumeAndCancel() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new ActualRecordingController(service)).setControllerAdvice(new ApiExceptionHandler()).build();
        mvc.perform(post("/api/planner/recordings/x/pause").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}")).andExpect(status().isUnauthorized());
        authenticate(user);
        String id = UUID.randomUUID().toString();
        mvc.perform(post("/api/planner/recordings/start").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body(id, "stopwatch", null))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.mode").value("stopwatch")).andExpect(jsonPath("$.data.targetMinutes").doesNotExist());
        mvc.perform(post("/api/planner/recordings/" + id + "/pause").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1,\"ownerId\":\"other\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/planner/recordings/" + id + "/pause").contentType(MediaType.APPLICATION_JSON).content("{\"version\":1}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.state").value("PAUSED"));
        mvc.perform(post("/api/planner/recordings/" + id + "/resume").contentType(MediaType.APPLICATION_JSON).content("{\"version\":2}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.state").value("RUNNING"));
        authenticate("other");
        mvc.perform(post("/api/planner/recordings/" + id + "/cancel").contentType(MediaType.APPLICATION_JSON).content("{\"version\":3}")).andExpect(status().isNotFound());
        authenticate(user);
        mvc.perform(post("/api/planner/recordings/" + id + "/cancel").contentType(MediaType.APPLICATION_JSON).content("{\"version\":3}")).andExpect(status().isNoContent());
        mvc.perform(get("/api/planner/recordings/" + id)).andExpect(status().isNotFound());
    }

    private void authenticate(String owner) {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated(
                        new kr.timebar.diary.security.AuthUserPrincipal(owner, "test@example.test", "USER"), null, List.of()));
    }
}
