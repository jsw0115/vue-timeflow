// 반복 규칙의 쉬는 날 예외가 루틴 달성률·연속 기록과 일정 회차에서 빠지는지 검증한다(UF-134, IM-14).
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.feature.RecurrenceRule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringJUnitConfig(FeatureTestConfig.class)
class RecurrenceExceptionTest {
    private static final List<Integer> WEEKDAYS = List.of(1, 2, 3, 4, 5);
    private static final List<Integer> EVERY_DAY = List.of(0, 1, 2, 3, 4, 5, 6);

    @Autowired RecordService records;
    @Autowired ScheduleService schedules;
    @Autowired FeatureStore store;
    private String user;

    @BeforeEach
    void setup() { user = UUID.randomUUID().toString(); }

    /** UT-236: 월~금 루틴에서 수요일을 쉬고 나머지 4일을 완료하면 달성 4/4이고 연속 기록이 끊기지 않는다. */
    @Test
    void skippedWeekdayIsLeftOutOfRateAndDoesNotBreakTheStreak() {
        String id = routine("2026-11-09", weekly(WEEKDAYS, skip("2026-11-11")), WEEKDAYS);
        for (String day : List.of("2026-11-09", "2026-11-10", "2026-11-12", "2026-11-13")) schedules.complete(user, id, day, Map.of("completed", true));

        var history = schedules.history(user, id, "2026-11-09", "2026-11-13", LocalDate.parse("2026-11-18"));

        assertEquals(4, history.get("done"));
        assertEquals(4, history.get("total"));
        assertEquals(100L, history.get("rate"));
        assertEquals(4, history.get("streak"));
        assertEquals(4, history.get("best"));
        assertEquals(1, history.get("skipped"));
        assertEquals("skipped", status(history, "2026-11-11"));
    }

    /** UT-237: 11-20~11-22를 쉬는 기간으로 정하면 그 기간은 예정 회차가 아니고 앞뒤 회차는 그대로다. */
    @Test
    void vacationRangeRemovesOnlyThoseDays() {
        String id = routine("2026-11-16", weekly(EVERY_DAY, skip("2026-11-20"), skip("2026-11-21"), skip("2026-11-22")), EVERY_DAY);

        var history = schedules.history(user, id, "2026-11-19", "2026-11-23", LocalDate.parse("2026-11-19"));

        assertEquals(List.of("pending", "skipped", "skipped", "skipped", "pending"),
                items(history).stream().map(item -> item.get("status")).toList());
        assertEquals(0, history.get("total"));
        assertEquals(3, history.get("skipped"));
    }

    /** UF-134: 쉬는 날은 회차가 아니므로 완료를 기록할 수 없다. 반복 규칙이 없고 요일만 있는 루틴도 같다. */
    @Test
    void completingASkippedDayIsRejectedForRuleAndWeekdayRoutines() {
        String weekly = routine("2026-11-09", weekly(WEEKDAYS, skip("2026-11-11")), WEEKDAYS);
        String weekdaysOnly = routine("2026-11-09", Map.of("frequency", "none", "exceptions", List.of(skip("2026-11-11"))), WEEKDAYS);

        for (String id : List.of(weekly, weekdaysOnly)) {
            var error = assertThrows(ApiException.class, () -> schedules.complete(user, id, "2026-11-11", Map.of("completed", true)));
            assertEquals(ErrorCode.VALIDATION_FAILED, error.errorCode());
            schedules.complete(user, id, "2026-11-10", Map.of("completed", true));
        }
        assertEquals("skipped", status(schedules.history(user, weekdaysOnly, "2026-11-09", "2026-11-13", LocalDate.parse("2026-11-18")), "2026-11-11"));
    }

    /** UT-238: 미래 날짜 완료는 거부하고, 미래 날짜를 쉬는 날로 정하는 것은 허용한다. */
    @Test
    void futureCompletionIsRejectedButFutureSkipIsAllowed() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        String id = routine(today.toString(), weekly(EVERY_DAY), EVERY_DAY);
        String tomorrow = today.plusDays(1).toString();

        assertThrows(ApiException.class, () -> schedules.complete(user, id, tomorrow, Map.of("completed", true)));

        var body = FeatureStore.payload(records.get(user, FeatureType.ROUTINE_RECORD, id));
        body.put("version", 1);
        body.put("recurrence", weekly(EVERY_DAY, skip(tomorrow)));
        var updated = records.update(user, FeatureType.ROUTINE_RECORD, id, body);
        assertEquals(2L, ((Number) updated.get("version")).longValue());
    }

    /** Q-05: 오늘 아직 하지 않은 회차와 미래 회차는 놓친 날이 아니므로 분모에 넣지 않고 연속 기록을 끊지 않는다. */
    @Test
    void todayAndFutureOccurrencesStayPendingAndOnlyPastMissesBreakTheStreak() {
        String id = routine("2026-11-09", weekly(EVERY_DAY), EVERY_DAY);
        for (String day : List.of("2026-11-09", "2026-11-11", "2026-11-12")) schedules.complete(user, id, day, Map.of("completed", true));

        var history = schedules.history(user, id, "2026-11-09", "2026-11-15", LocalDate.parse("2026-11-13"));

        assertEquals("missed", status(history, "2026-11-10"));
        assertEquals("pending", status(history, "2026-11-13"));
        assertEquals("pending", status(history, "2026-11-15"));
        assertEquals(3, history.get("done"));
        assertEquals(4, history.get("total"));
        assertEquals(75L, history.get("rate"));
        assertEquals(2, history.get("streak"));
        assertEquals(2, history.get("best"));
    }

    @Test
    void exceptionListAcceptsUpTo366UniqueSkipDates() {
        // 지난 날짜 쉬는 날은 연 5회 한도(Q-19)가 있어, 개수 한도만 보려고 미래 연도를 쓴다
        LocalDate first = LocalDate.parse("2030-01-01");
        List<Map<String, Object>> full = new ArrayList<>();
        for (int i = 0; i < 366; i++) full.add(skip(first.plusDays(i).toString()));
        routine("2030-01-01", weekly(EVERY_DAY, full.toArray(Map[]::new)), EVERY_DAY);

        var tooMany = new ArrayList<>(full); tooMany.add(skip("2031-01-02"));
        assertInvalid(weekly(EVERY_DAY, tooMany.toArray(Map[]::new)));
        assertInvalid(weekly(EVERY_DAY, skip("2026-11-11"), skip("2026-11-11")));
        assertInvalid(weekly(EVERY_DAY, Map.of("date", "2026-11-11", "action", "override")));
        assertInvalid(weekly(EVERY_DAY, Map.of("date", "2026-11-31", "action", "skip")));
        assertInvalid(weekly(EVERY_DAY, Map.of("date", "2026-11-11", "action", "skip", "title", "x")));
        assertInvalid(Map.of("frequency", "weekly", "interval", 1, "endMode", "never", "weekdays", EVERY_DAY, "exceptions", "2026-11-11"));
    }

    /** 일정도 같은 예외 구조를 쓴다. 건너뛴 회차는 횟수 종료 조건의 회차 수에는 포함된다. */
    @Test
    void scheduleOccurrencesLeaveOutSkippedDatesWithoutExtendingACountedSeries() {
        var rule = new LinkedHashMap<String, Object>(Map.of("frequency", "daily", "interval", 1, "endMode", "count", "count", 3));
        rule.put("exceptions", List.of(skip("2026-11-02")));
        records.create(user, FeatureType.SCHEDULE, Map.of("title", "아침 회의", "startDate", "2026-11-01", "endDate", "2026-11-01",
                "startTime", "09:00", "endTime", "09:30", "recurrence", rule));

        assertEquals(List.of("2026-11-01", "2026-11-03"),
                schedules.occurrences(user, "2026-11-01", "2026-11-10").stream().map(row -> row.get("startDate")).toList());
        assertEquals(List.of(LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-03")),
                RecurrenceRule.dates("2026-11-01", rule, LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-10")));
    }

    private void assertInvalid(Map<String, Object> recurrence) {
        var error = assertThrows(ApiException.class, () -> routine("2026-01-01", recurrence, EVERY_DAY));
        assertEquals(ErrorCode.VALIDATION_FAILED, error.errorCode());
    }

    private String routine(String startDate, Map<String, Object> recurrence, List<Integer> days) {
        var body = new HashMap<String, Object>(Map.of("title", "루틴", "startDate", startDate, "time", "07:00", "duration", 30,
                "days", days, "goal", Map.of("count", 1, "unit", "회")));
        body.put("recurrence", recurrence);
        return records.create(user, FeatureType.ROUTINE_RECORD, body).get("id").toString();
    }

    @SafeVarargs
    private static Map<String, Object> weekly(List<Integer> weekdays, Map<String, Object>... exceptions) {
        var rule = new LinkedHashMap<String, Object>(Map.of("frequency", "weekly", "interval", 1, "endMode", "never", "weekdays", weekdays));
        if (exceptions.length > 0) rule.put("exceptions", List.of(exceptions));
        return rule;
    }

    private static Map<String, Object> skip(String date) { return Map.of("date", date, "action", "skip"); }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> items(Map<String, Object> history) { return (List<Map<String, Object>>) history.get("items"); }

    private static Object status(Map<String, Object> history, String date) {
        return items(history).stream().filter(item -> date.equals(item.get("date"))).findFirst().orElseThrow().get("status");
    }
}
