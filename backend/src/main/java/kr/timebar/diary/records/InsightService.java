// 실제 일정·플래너·집중·할 일 데이터를 바탕으로 대시보드와 통계를 집계한다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.planner.*;
import kr.timebar.diary.task.TaskStatus;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;

@Service
public class InsightService {
    private final FeatureStore store;
    private final PlannerAggregationService aggregation;
    private final PlannerService planner;
    private final ScheduleService schedules;
    private final DayPolicy days;
    public InsightService(FeatureStore store, PlannerAggregationService aggregation, PlannerService planner, ScheduleService schedules, DayPolicy days) { this.store = store; this.aggregation = aggregation; this.planner = planner; this.schedules = schedules; this.days = days; }
    /** 사용자 시간대와 하루 경계로 정한 오늘(Q-06·Q-12). */
    public LocalDate today(String user) { return days.of(user).today(); }
    public Map<String,Object> summary(String user, String date) {
        LocalDate day = date == null ? today(user) : FeatureInput.date(date);
        // 일정·루틴의 기준은 신형(schedules·routineRecords)이다. 구형 일정·루틴은 중복이므로 빼고 할 일만 남긴다(IM-03).
        var planned = new PlannerViewResponse(List.of(), aggregation.daily(user, day).tasks(), List.of());
        return Map.of("date", day.toString(), "planner", planned, "items", planner.find(user, day, null, null, null), "stats", stats(user, day.toString(), day.toString()),
                "unreadNotifications", store.all(user, FeatureType.NOTIFICATION).stream().filter(row -> !Boolean.TRUE.equals(row.get("read"))).count(), "schedules", schedules.occurrences(user, day.toString(), day.toString()), "routineRecords", store.all(user, FeatureType.ROUTINE_RECORD));
    }
    public Map<String,Object> stats(String user, String from, String to) {
        var clock = days.of(user);
        LocalDate start = from == null ? clock.today().withDayOfMonth(1) : FeatureInput.date(from);
        LocalDate end = to == null ? start.plusMonths(1).minusDays(1) : FeatureInput.date(to);
        if (end.isBefore(start) || java.time.temporal.ChronoUnit.DAYS.between(start, end) > 366) FeatureInput.fail("통계 기간은 최대 367일입니다.");
        // 구형 일정(view.events())은 신형 일정 회차와 중복되므로 계획 시간에 더하지 않는다(IM-03). view는 할 일 집계에만 쓴다.
        var view = aggregation.range(user, start, end);
        long planned = 0, actual = 0, focused = 0;
        Map<String,long[]> categories = new TreeMap<>();
        // 일정 시각은 사용자 시간대의 벽시계 시각이다. 기간은 첫날 경계부터 마지막 날 다음 경계까지이고, 경계가 0시가 아니면 다음 날 새벽 회차도 들어온다
        Instant rangeStart = clock.start(start), rangeEnd = clock.end(end);
        for (var event : schedules.occurrences(user, start.toString(), end.plusDays(1).toString())) {
            Instant eventStart = FeatureInput.date(event.get("startDate").toString()).atTime(FeatureInput.time(event.get("startTime").toString())).atZone(clock.zone()).toInstant();
            Instant eventEnd = FeatureInput.date(event.get("endDate").toString()).atTime(FeatureInput.time(event.get("endTime").toString())).atZone(clock.zone()).toInstant();
            if (eventStart.isBefore(rangeStart)) eventStart = rangeStart;
            if (eventEnd.isAfter(rangeEnd)) eventEnd = rangeEnd;
            long minutes = Math.max(0, Duration.between(eventStart, eventEnd).toMinutes()); planned += minutes;
            categories.computeIfAbsent(FeatureInput.text(event, "category"), key -> new long[2])[0] += minutes;
        }
        List<Map<String,Object>> blocks = new ArrayList<>();
        for (PlannerItem item : planner.find(user, null, null, null, null)) {
            if (item.date() == null || item.date().isBefore(start) || item.date().isAfter(end)) continue;
            long minutes = minutes(item.startTime(), item.endTime());
            boolean isActual = item.type() == PlannerItem.ItemType.ACTUAL;
            if (isActual) actual += minutes; else planned += minutes;
            categories.computeIfAbsent(Objects.toString(item.category(), "미분류"), key -> new long[2])[isActual ? 1 : 0] += minutes;
            blocks.add(Map.of("id", item.id(), "title", item.title(), "date", item.date().toString(), "minutes", minutes, "type", item.type().name()));
        }
        List<Map<String,Object>> focus = store.all(user, FeatureType.FOCUS).stream().filter(row -> {
            LocalDate date = FeatureInput.date(row.get("date").toString()); return !date.isBefore(start) && !date.isAfter(end);
        }).toList();
        for (var block : actualBlocks(user, clock, start, end)) {
            long minutes = ((Number)block.get("minutes")).longValue();
            actual += minutes;
            categories.computeIfAbsent("미분류", key -> new long[2])[1] += minutes;
            blocks.add(block);
        }
        for (var row : focus) if (row.get("endedAt") != null) focused += Math.max(0, Duration.between(FeatureInput.instant(row.get("startedAt").toString()), FeatureInput.instant(row.get("endedAt").toString())).toMinutes());
        List<Map<String,Object>> categoryRows = categories.entrySet().stream().map(e -> Map.<String,Object>of("category", e.getKey(), "plannedMinutes", e.getValue()[0], "actualMinutes", e.getValue()[1])).toList();
        long done = view.tasks().stream().filter(task -> task.status() == TaskStatus.DONE).count();
        return Map.of("from", start.toString(), "to", end.toString(), "plannedMinutes", planned, "actualMinutes", actual, "focusMinutes", focused, "completedTasks", done,
                "totalTasks", view.tasks().size(), "categories", categoryRows, "timeBlocks", blocks, "focusSessions", focus);
    }
    public List<Map<String,Object>> timeBlocks(String user, String date, String category) {
        LocalDate day = FeatureInput.date(date);
        var result = new ArrayList<>(planner.find(user, day, null, category, null).stream().map(item -> Map.<String,Object>of("id", item.id(), "title", item.title(), "date", day.toString(), "minutes", minutes(item.startTime(), item.endTime()), "type", item.type().name())).toList());
        if (category == null || category.equals("미분류")) result.addAll(actualBlocks(user, days.of(user), day, day));
        return result;
    }
    /** 실제 기록을 날짜별로 나눈다. 기록에 저장한 시간대가 아니라 사용자 시간대와 하루 경계를 쓴다(Q-06). 저장된 시작·종료 시각은 바꾸지 않는다. */
    private List<Map<String,Object>> actualBlocks(String user, DayPolicy.Day clock, LocalDate from, LocalDate to) {
        var result = new ArrayList<Map<String,Object>>();
        for (var row : store.all(user, FeatureType.ACTUAL_SESSION)) {
            if (!"COMPLETED".equals(row.get("state"))) continue;
            Instant start = Instant.parse(row.get("startedAt").toString()), end = Instant.parse(row.get("endedAt").toString());
            for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
                Instant dayStart = clock.start(day), dayEnd = clock.end(day);
                if (start.isBefore(dayEnd) && end.isAfter(dayStart)) {
                    Instant clippedStart = start.isBefore(dayStart) ? dayStart : start, clippedEnd = end.isAfter(dayEnd) ? dayEnd : end;
                    result.add(Map.of("id", row.get("id"), "title", row.get("title"), "date", day.toString(), "minutes", Duration.between(clippedStart, clippedEnd).toMinutes(), "type", "ACTUAL"));
                }
            }
        }
        return result;
    }
    private long minutes(LocalTime from, LocalTime to) { return from == null || to == null ? 0 : Math.max(0, Duration.between(from, to).toMinutes()); }
}
