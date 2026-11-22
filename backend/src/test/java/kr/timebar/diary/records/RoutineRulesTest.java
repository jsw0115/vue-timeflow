// 지난 날짜 쉬는 날 연 5회 한도(Q-19)와 중지한 날부터 적용하는 중지(Q-20)를 검사한다.
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class RoutineRulesTest {
    private static final LocalDate TODAY = LocalDate.parse("2026-11-22");
    @Autowired RecordService records;
    @Autowired ScheduleService schedules;
    @Autowired JdbcTemplate jdbc;
    private String user;

    @BeforeEach void setup() { user = UUID.randomUUID().toString(); jdbc.update("INSERT INTO users(id) VALUES (?)", user); }

    /** 처음 생긴 지난 날짜 쉬는 날에만 retro를 붙이고, 한 해에 5번까지 받는다. 해가 다르면 따로 센다. */
    @Test void pastSkipsAreMarkedAndLimitedToFivePerCalendarYear() {
        var five = routine(List.of("2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"), List.of(), null);
        var prepared = RoutineRules.prepare(null, five, TODAY);
        assertEquals(List.of(true, true, true, true, true), exceptions(prepared).stream().map(e -> e.get("retro")).toList());
        var six = routine(List.of("2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"), List.of(), null);
        var error = assertThrows(ApiException.class, () -> RoutineRules.prepare(null, six, TODAY));
        assertEquals(ErrorCode.VALIDATION_FAILED, error.errorCode());
        var twoYears = routine(List.of("2025-12-27", "2025-12-28", "2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"), List.of(), null);
        assertEquals(10, exceptions(RoutineRules.prepare(null, twoYears, TODAY)).stream().filter(e -> Boolean.TRUE.equals(e.get("retro"))).count());
    }

    /** 미리 지정했다가 날짜가 지난 쉬는 날은 한도에 세지 않는다. 클라이언트가 보낸 retro 값은 믿지 않는다. */
    @Test void skipsSetInAdvanceDoNotCountAndClientRetroIsIgnored() {
        var previous = routine(List.of("2026-11-20", "2026-11-21"), List.of(), null); // 11-19에 미리 지정했던 날
        var data = routine(List.of("2026-11-20", "2026-11-21", "2026-11-25"), List.of("2026-11-25"), null); // 미래 날에 retro를 보내도
        var prepared = RoutineRules.prepare(previous, data, TODAY);
        assertEquals(Arrays.asList(null, null, null), exceptions(prepared).stream().map(e -> e.get("retro")).toList());
        var forged = routine(List.of("2026-11-10"), List.of(), null);
        exceptions(forged).get(0).put("retro", false);
        assertEquals(true, exceptions(RoutineRules.prepare(null, forged, TODAY)).get(0).get("retro"));
    }

    /** 중지하면 그날부터 회차가 빠지고 그 전 회차는 남는다. 재개하면 중지했던 기간만 빠진다. 예전 중지(시작일 없음)는 모든 날을 뺀다. */
    @Test void pauseAppliesFromThePauseDayAndResumeKeepsOnlyThatRange() {
        var running = routine(List.of(), List.of(), false);
        var paused = RoutineRules.prepare(running, routine(List.of(), List.of(), true), LocalDate.parse("2026-11-18"));
        assertEquals("2026-11-18", paused.get("pausedFrom"));
        assertFalse(RoutineRules.paused(paused, LocalDate.parse("2026-11-17")));
        assertTrue(RoutineRules.paused(paused, LocalDate.parse("2026-11-18")));
        var forged = routine(List.of(), List.of(), true); forged.put("pausedFrom", "2020-01-01");
        assertEquals("2026-11-18", RoutineRules.prepare(paused, forged, TODAY).get("pausedFrom"));
        var resumed = RoutineRules.prepare(paused, routine(List.of(), List.of(), false), TODAY);
        assertNull(resumed.get("pausedFrom"));
        assertEquals(List.of(Map.of("from", "2026-11-18", "to", "2026-11-21")), resumed.get("pausedRanges"));
        assertTrue(RoutineRules.paused(resumed, LocalDate.parse("2026-11-20")));
        assertFalse(RoutineRules.paused(resumed, TODAY));
        assertFalse(RoutineRules.paused(resumed, LocalDate.parse("2026-11-17")));
        var legacy = new HashMap<String, Object>(Map.of("paused", true));
        assertTrue(RoutineRules.paused(legacy, LocalDate.parse("2026-01-01")));
    }

    /** 저장 경로(RecordService)를 거치면 서버가 pausedFrom을 오늘로 채우고, history는 그 전 회차를 그대로 셈한다. */
    @Test void savingThroughTheServiceAppliesTheRules() {
        var body = routine(List.of(), List.of(), false);
        body.put("title", "아침 스트레칭"); body.put("startDate", "2026-11-01");
        var created = records.create(user, FeatureType.ROUTINE_RECORD, body);
        var update = new HashMap<String, Object>(body); update.put("paused", true); update.put("version", created.get("version"));
        var saved = records.update(user, FeatureType.ROUTINE_RECORD, created.get("id").toString(), update);
        LocalDate pausedFrom = LocalDate.parse(saved.get("pausedFrom").toString());
        var history = schedules.history(user, created.get("id").toString(), pausedFrom.minusDays(3).toString(), pausedFrom.minusDays(1).toString(), pausedFrom);
        assertEquals(3, ((List<?>) history.get("items")).size(), "중지 전 사흘은 회차로 남는다");
        var tooMany = routine(List.of("2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10"), List.of(), false);
        tooMany.put("title", "루틴"); tooMany.put("startDate", "2026-01-01");
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> records.create(user, FeatureType.ROUTINE_RECORD, tooMany)).errorCode());
    }

    private static HashMap<String, Object> routine(List<String> skips, List<String> retroSent, Boolean paused) {
        var rule = new LinkedHashMap<String, Object>(Map.of("frequency", "daily", "interval", 1, "endMode", "never"));
        var list = new ArrayList<Map<String, Object>>();
        for (String date : skips) { var e = new LinkedHashMap<String, Object>(Map.of("date", date, "action", "skip")); if (retroSent.contains(date)) e.put("retro", true); list.add(e); }
        rule.put("exceptions", list);
        var body = new HashMap<String, Object>(Map.of("time", "07:00", "duration", 30, "days", List.of(0, 1, 2, 3, 4, 5, 6), "goal", Map.of("count", 1, "unit", "회")));
        body.put("recurrence", rule);
        if (paused != null) body.put("paused", paused);
        return body;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> exceptions(Map<String, Object> routine) {
        return (List<Map<String, Object>>) ((Map<String, Object>) routine.get("recurrence")).get("exceptions");
    }
}
