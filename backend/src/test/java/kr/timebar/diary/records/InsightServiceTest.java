// 통계·홈 요약이 신형 일정·루틴만 집계하고 구형 모델을 중복으로 더하지 않는지 검증한다(IM-03, TS-07).
package kr.timebar.diary.records;

import kr.timebar.diary.event.EventVisibility;
import kr.timebar.diary.event.dto.EventResponse;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.planner.PlannerAggregationService;
import kr.timebar.diary.planner.PlannerItem;
import kr.timebar.diary.planner.PlannerService;
import kr.timebar.diary.planner.PlannerViewResponse;
import kr.timebar.diary.routine.dto.RoutineResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(FeatureTestConfig.class)
class InsightServiceTest {
    private static final LocalDate DAY = LocalDate.of(2026, 11, 18);

    @Autowired RecordService records;
    @Autowired ScheduleService schedules;
    @Autowired kr.timebar.diary.feature.FeatureStore store;
    @Autowired JdbcTemplate jdbc;

    private final PlannerAggregationService aggregation = mock(PlannerAggregationService.class);
    private final PlannerService planner = mock(PlannerService.class);
    private String user;
    private InsightService insight;

    @BeforeEach
    void setup() {
        user = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO users(id) VALUES (?)", user);
        insight = new InsightService(store, aggregation, planner, schedules);
    }

    /** UT-100: 같은 시간대의 구형 일정 60분·신형 일정 60분·계획 블록 30분이면 계획 시간은 90분이다. */
    @Test
    void plannedMinutesCountNewSchedulesAndPlanBlocksButNotLegacyEvents() {
        var legacy = new EventResponse(1L, "구형 회의", "업무", DAY, LocalTime.of(10, 0), LocalTime.of(11, 0),
                null, EventVisibility.PRIVATE, null, null, false);
        when(aggregation.range(eq(user), any(), any())).thenReturn(new PlannerViewResponse(List.of(legacy), List.of(), List.of()));
        createSchedule("신형 회의", "2026-11-18", null);
        var block = new PlannerItem(1L, PlannerItem.ItemType.EVENT, "회의 준비", "업무", DAY, LocalTime.of(10, 0), LocalTime.of(10, 30),
                PlannerItem.ItemStatus.SCHEDULED, false, null, 1L);
        when(planner.find(eq(user), isNull(), isNull(), isNull(), isNull())).thenReturn(List.of(block));

        var stats = insight.stats(user, "2026-11-18", "2026-11-18");

        assertEquals(90L, stats.get("plannedMinutes"));
        var categories = (List<?>) stats.get("categories");
        assertEquals(List.of(Map.of("category", "업무", "plannedMinutes", 90L, "actualMinutes", 0L)), categories);
    }

    /** UT-101: 신형 반복 일정은 회차마다 한 번씩만 더한다. */
    @Test
    void recurringScheduleCountsEachOccurrenceOnce() {
        when(aggregation.range(eq(user), any(), any())).thenReturn(new PlannerViewResponse(List.of(), List.of(), List.of()));
        // 2026-11-16(월) 시작, 월·수·금(0=일요일) 매주 반복 → 11-16~11-22 주간에 3회.
        createSchedule("주간 운동", "2026-11-16", Map.of("frequency", "weekly", "interval", 1, "weekdays", List.of(1, 3, 5), "endMode", "never"));

        var stats = insight.stats(user, "2026-11-16", "2026-11-22");

        assertEquals(180L, stats.get("plannedMinutes"));
    }

    /** UT-252: 회차 하나만 시간을 바꾸면 계획 시간은 바뀐 시간으로, 건너뛴 회차는 빼고 센다(PR-22 2단계). */
    @Test
    void plannedMinutesFollowOccurrenceOverridesAndSkips() {
        when(aggregation.range(eq(user), any(), any())).thenReturn(new PlannerViewResponse(List.of(), List.of(), List.of()));
        // 월·수·금 10:00~11:00. 수요일(11-18)은 10:00~12:30으로, 금요일(11-20)은 건너뛴다 → 60 + 150 = 210분.
        createSchedule("주간 운동", "2026-11-16", Map.of("frequency", "weekly", "interval", 1, "weekdays", List.of(1, 3, 5), "endMode", "never",
                "exceptions", List.of(Map.of("date", "2026-11-18", "action", "override", "endTime", "12:30"),
                        Map.of("date", "2026-11-20", "action", "skip"))));

        var stats = insight.stats(user, "2026-11-16", "2026-11-22");

        assertEquals(210L, stats.get("plannedMinutes"));
    }

    /** UT-102: 홈 요약의 루틴은 신형 한 출처만 나오고, 구형 일정·루틴은 빠진다. */
    @Test
    void homeSummaryListsRoutinesFromTheNewModelOnly() {
        var legacyEvent = new EventResponse(2L, "구형 일정", "업무", DAY, LocalTime.of(9, 0), LocalTime.of(10, 0),
                null, EventVisibility.PRIVATE, null, null, false);
        var legacyRoutine = new RoutineResponse("r-legacy", "구형 스트레칭", "07:00", "", null, null, null, null, null, true, false, null);
        var legacyView = new PlannerViewResponse(List.of(legacyEvent), List.of(), List.of(legacyRoutine));
        when(aggregation.daily(eq(user), eq(DAY))).thenReturn(legacyView);
        when(aggregation.range(eq(user), any(), any())).thenReturn(legacyView);
        var routine = new LinkedHashMap<String, Object>(Map.of("title", "신형 스트레칭", "startDate", "2026-11-01", "time", "07:00",
                "duration", 10, "days", List.of(0, 1, 2, 3, 4, 5, 6), "goal", Map.of("count", 1, "unit", "회")));
        records.create(user, FeatureType.ROUTINE_RECORD, routine);

        var summary = insight.summary(user, "2026-11-18");

        var view = (PlannerViewResponse) summary.get("planner");
        assertTrue(view.routines().isEmpty(), "구형 루틴은 홈 요약에 나오지 않는다.");
        assertTrue(view.events().isEmpty(), "구형 일정은 홈 요약에 나오지 않는다.");
        var routines = (List<?>) summary.get("routineRecords");
        assertEquals(1, routines.size());
        assertEquals("신형 스트레칭", ((Map<?, ?>) routines.get(0)).get("title"));
    }

    private void createSchedule(String title, String date, Map<String, Object> recurrence) {
        var body = new LinkedHashMap<String, Object>(Map.of("title", title, "category", title.contains("운동") ? "건강" : "업무",
                "startDate", date, "endDate", date, "startTime", "10:00", "endTime", "11:00"));
        if (recurrence != null) body.put("recurrence", recurrence);
        records.create(user, FeatureType.SCHEDULE, body);
    }
}
