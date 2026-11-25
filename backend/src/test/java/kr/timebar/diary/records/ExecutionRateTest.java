// 계획 실행률(PR-19 UF-136, Q-40): 계획(일정·계획 블록)과 겹친 실제 기록 분 ÷ 계획 분. 계획 밖 기록은 실제 활동 총량에만, 계획 없는 날은 실행률 없음.
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.planner.PlannerItem;
import kr.timebar.diary.planner.PlannerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class ExecutionRateTest {
    @Autowired FeatureStore store;
    @Autowired ScheduleService schedules;
    @Autowired DayPolicy days;

    private String actual(String owner, String start, String end, List<Map<String, Object>> pauses) {
        var body = new HashMap<String, Object>(Map.of("title", "기록", "startedAt", start, "endedAt", end, "timeZone", "Asia/Seoul", "state", "COMPLETED"));
        if (pauses != null) body.put("pauses", pauses);
        return store.create(owner, FeatureType.ACTUAL_SESSION, body).get("id").toString();
    }
    @SuppressWarnings("unchecked") private static Map<String, Object> day(Map<String, Object> result, int index) { return ((List<Map<String, Object>>) result.get("days")).get(index); }

    /** 서울 11/25: 일정 10~11시와 계획 블록 10:30~12:00(합치면 10~12시, 120분). 실제 10:30~11:30(중간 10분 일시정지)·13~14시. 실행 50분, 실제 총량 110분, 실행률 42%. 다음 날은 계획이 없어 실행률 없음. */
    @Test void overlapOfActualWithPlannedTime() {
        String me = UUID.randomUUID().toString();
        store.create(me, FeatureType.SCHEDULE, Map.of("title", "회의", "startDate", "2026-11-25", "endDate", "2026-11-25", "startTime", "10:00", "endTime", "11:00"));
        var planner = mock(PlannerService.class);
        when(planner.find(eq(me), isNull(), isNull(), isNull(), isNull())).thenReturn(List.of(
                new PlannerItem(1L, PlannerItem.ItemType.EVENT, "보고서", "개인", LocalDate.of(2026, 11, 25), LocalTime.of(10, 30), LocalTime.of(12, 0), PlannerItem.ItemStatus.SCHEDULED, false, "", 1L),
                new PlannerItem(2L, PlannerItem.ItemType.EVENT, "취소한 블록", "개인", LocalDate.of(2026, 11, 25), LocalTime.of(15, 0), LocalTime.of(16, 0), PlannerItem.ItemStatus.CANCELLED, false, "", 1L)));
        actual(me, "2026-11-25T01:30:00Z", "2026-11-25T02:30:00Z", List.of(Map.of("from", "2026-11-25T01:50:00Z", "to", "2026-11-25T02:00:00Z")));
        actual(me, "2026-11-25T04:00:00Z", "2026-11-25T05:00:00Z", null);
        var result = new ExecutionRate(schedules, planner, store, days).range(me, "2026-11-25", "2026-11-26");
        assertEquals(Map.of("date", "2026-11-25", "plannedMinutes", 120L, "executedMinutes", 50L, "actualMinutes", 110L, "rate", 42), day(result, 0));
        assertNull(day(result, 1).get("rate"));
        assertTrue(day(result, 1).containsKey("rate"));
        @SuppressWarnings("unchecked") var totals = (Map<String, Object>) result.get("totals");
        assertEquals(42, totals.get("rate"));
    }

    @Test void rejectsBadRanges() {
        var rates = new ExecutionRate(schedules, mock(PlannerService.class), store, days);
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> rates.range("u", "2026-11-26", "2026-11-25")).errorCode());
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> rates.range("u", "2025-01-01", "2026-11-25")).errorCode());
    }
}
