// 일정 회차 하나만 바꾸는 override 예외의 검증과 회차 응답 적용을 검증한다(PR-22 2단계, UT-250~UT-253).
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringJUnitConfig(FeatureTestConfig.class)
class OccurrenceOverrideTest {
    private static final List<Integer> MON_WED = List.of(1, 3);

    @Autowired RecordService records;
    @Autowired ScheduleService schedules;
    private String user;

    @BeforeEach
    void setup() { user = UUID.randomUUID().toString(); }

    /** UT-251: 회차 하나만 제목·시간을 바꾸면 그 회차에만 적용되고, 다른 회차와 원본은 그대로다. */
    @Test
    void overrideChangesOnlyThatOccurrence() {
        schedule("2026-11-23", "2026-11-23", "10:00", "11:00",
                weekly(override("2026-11-25", Map.of("title", "장소 바뀐 회의", "startTime", "14:00", "endTime", "15:30"))));

        var rows = schedules.occurrences(user, "2026-11-23", "2026-11-30");

        assertEquals(List.of("2026-11-23", "2026-11-25", "2026-11-30"), rows.stream().map(row -> row.get("startDate")).toList());
        var changed = row(rows, "2026-11-25");
        assertEquals("장소 바뀐 회의", changed.get("title"));
        assertEquals("14:00", changed.get("startTime"));
        assertEquals("15:30", changed.get("endTime"));
        assertEquals(true, changed.get("overridden"));
        var other = row(rows, "2026-11-30");
        assertEquals("주간 회의", other.get("title"));
        assertEquals("10:00", other.get("startTime"));
        assertFalse(other.containsKey("overridden"));
    }

    /** UT-251: 바꾸지 않은 필드는 원본을 따른다. 여러 날 일정의 종료 시각은 회차 종료일에 적용된다. */
    @Test
    void overrideKeepsUnchangedFieldsAndAppliesEndTimeToTheLastDayOfAMultiDayOccurrence() {
        schedule("2026-11-23", "2026-11-24", "22:00", "06:00", weekly(override("2026-11-25", Map.of("endTime", "08:00"))));

        var changed = row(schedules.occurrences(user, "2026-11-25", "2026-11-26"), "2026-11-25");

        assertEquals("주간 회의", changed.get("title"));
        assertEquals("22:00", changed.get("startTime"));
        assertEquals("08:00", changed.get("endTime"));
        assertEquals("2026-11-26", changed.get("endDate"));
    }

    /** UT-250: 건너뛴 회차는 빠지고, 같은 날짜에 건너뛰기와 변경을 함께 둘 수 없다. */
    @Test
    void skippedOccurrenceDisappearsAndSkipAndOverrideCannotShareADate() {
        schedule("2026-11-23", "2026-11-23", "10:00", "11:00", weekly(Map.of("date", "2026-11-25", "action", "skip")));
        assertEquals(List.of("2026-11-23", "2026-11-30"),
                schedules.occurrences(user, "2026-11-23", "2026-11-30").stream().map(row -> row.get("startDate")).toList());

        assertInvalid(weekly(Map.of("date", "2026-11-25", "action", "skip"), override("2026-11-25", Map.of("title", "x"))));
    }

    /** UT-253: 바꿀 필드가 없거나, 허용하지 않은 필드·잘못된 시각·빈 제목·201자 제목·종료가 시작보다 이르면 거부한다. */
    @Test
    void invalidOverridesAreRejected() {
        assertInvalid(weekly(Map.of("date", "2026-11-25", "action", "override")));
        assertInvalid(weekly(override("2026-11-25", Map.of("category", "개인"))));
        assertInvalid(weekly(override("2026-11-25", Map.of("startTime", "25:00"))));
        assertInvalid(weekly(override("2026-11-25", Map.of("startTime", "9:00"))));
        assertInvalid(weekly(override("2026-11-25", Map.of("title", "   "))));
        assertInvalid(weekly(override("2026-11-25", Map.of("title", "가".repeat(201)))));
        assertInvalid(weekly(override("2026-11-25", Map.of("title", 3))));
        // 원본 10:00~11:00에서 시작만 11:30으로 바꾸면 종료(11:00)가 시작보다 이르다
        assertInvalid(weekly(override("2026-11-25", Map.of("startTime", "11:30"))));
        assertInvalid(weekly(override("2026-11-25", Map.of("startTime", "12:00", "endTime", "12:00"))));
        // 경계: 200자 제목, 시작·종료를 함께 옮기는 변경은 허용한다
        schedule("2026-11-23", "2026-11-23", "10:00", "11:00", weekly(override("2026-11-25", Map.of("title", "가".repeat(200), "startTime", "11:30", "endTime", "12:00"))));
    }

    /** UT-253: 루틴은 회차 변경 대상이 아니다. 기존처럼 쉬는 날만 받는다. */
    @Test
    void routinesStillAcceptOnlySkipExceptions() {
        var body = new HashMap<String, Object>(Map.of("title", "루틴", "startDate", "2026-11-23", "time", "07:00", "duration", 30,
                "days", MON_WED, "goal", Map.of("count", 1, "unit", "회")));
        body.put("recurrence", weekly(override("2026-11-25", Map.of("title", "x"))));
        var error = assertThrows(ApiException.class, () -> records.create(user, FeatureType.ROUTINE_RECORD, body));
        assertEquals(ErrorCode.VALIDATION_FAILED, error.errorCode());
    }

    /** UT-253: 반복 일정을 수정할 때도 같은 검증을 한다. 원본 시간을 바꿔 기존 변경이 성립하지 않으면 거부한다. */
    @Test
    void updatingTheSeriesRevalidatesExistingOverrides() {
        String id = schedule("2026-11-23", "2026-11-23", "10:00", "11:00", weekly(override("2026-11-25", Map.of("startTime", "10:30"))));
        var body = new HashMap<String, Object>(Map.of("title", "주간 회의", "startDate", "2026-11-23", "endDate", "2026-11-23",
                "startTime", "10:00", "endTime", "10:15", "version", 1));
        body.put("recurrence", weekly(override("2026-11-25", Map.of("startTime", "10:30"))));
        var error = assertThrows(ApiException.class, () -> records.update(user, FeatureType.SCHEDULE, id, body));
        assertEquals(ErrorCode.VALIDATION_FAILED, error.errorCode());
        body.put("endTime", "10:45");
        assertTrue(((Number) records.update(user, FeatureType.SCHEDULE, id, body).get("version")).longValue() > 1);
    }

    private void assertInvalid(Map<String, Object> recurrence) {
        var error = assertThrows(ApiException.class, () -> schedule("2026-11-23", "2026-11-23", "10:00", "11:00", recurrence));
        assertEquals(ErrorCode.VALIDATION_FAILED, error.errorCode());
    }

    private String schedule(String startDate, String endDate, String startTime, String endTime, Map<String, Object> recurrence) {
        var body = new HashMap<String, Object>(Map.of("title", "주간 회의", "startDate", startDate, "endDate", endDate,
                "startTime", startTime, "endTime", endTime));
        body.put("recurrence", recurrence);
        return records.create(user, FeatureType.SCHEDULE, body).get("id").toString();
    }

    @SafeVarargs
    private static Map<String, Object> weekly(Map<String, Object>... exceptions) {
        var rule = new LinkedHashMap<String, Object>(Map.of("frequency", "weekly", "interval", 1, "endMode", "never", "weekdays", MON_WED));
        if (exceptions.length > 0) rule.put("exceptions", List.of(exceptions));
        return rule;
    }

    private static Map<String, Object> override(String date, Map<String, Object> fields) {
        var item = new LinkedHashMap<String, Object>(Map.of("date", date, "action", "override"));
        item.putAll(fields);
        return item;
    }

    private static Map<String, Object> row(List<Map<String, Object>> rows, String startDate) {
        return rows.stream().filter(row -> startDate.equals(row.get("startDate"))).findFirst().orElseThrow();
    }
}
