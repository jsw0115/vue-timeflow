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
    public InsightService(FeatureStore store, PlannerAggregationService aggregation, PlannerService planner, ScheduleService schedules) { this.store = store; this.aggregation = aggregation; this.planner = planner; this.schedules = schedules; }
    public Map<String,Object> summary(String user, String date) {
        LocalDate day = date == null ? LocalDate.now(ZoneId.of("Asia/Seoul")) : FeatureInput.date(date);
        return Map.of("date", day.toString(), "planner", aggregation.daily(user, day), "items", planner.find(user, day, null, null, null), "stats", stats(user, day.toString(), day.toString()),
                "unreadNotifications", store.all(user, FeatureType.NOTIFICATION).stream().filter(row -> !Boolean.TRUE.equals(row.get("read"))).count(), "schedules", schedules.occurrences(user, day.toString(), day.toString()), "routineRecords", store.all(user, FeatureType.ROUTINE_RECORD));
    }
    public Map<String,Object> stats(String user, String from, String to) {
        LocalDate start = from == null ? LocalDate.now(ZoneId.of("Asia/Seoul")).withDayOfMonth(1) : FeatureInput.date(from);
        LocalDate end = to == null ? start.plusMonths(1).minusDays(1) : FeatureInput.date(to);
        if (end.isBefore(start) || java.time.temporal.ChronoUnit.DAYS.between(start, end) > 366) FeatureInput.fail("통계 기간은 최대 367일입니다.");
        var view = aggregation.range(user, start, end);
        long planned = 0, actual = 0, focused = 0;
        Map<String,long[]> categories = new TreeMap<>();
        for (var event : view.events()) {
            long minutes = minutes(event.startTime(), event.endTime()); planned += minutes;
            categories.computeIfAbsent(Objects.toString(event.category(), "미분류"), key -> new long[2])[0] += minutes;
        }
        for (var event : schedules.occurrences(user, start.toString(), end.toString())) {
            LocalDateTime eventStart = FeatureInput.date(event.get("startDate").toString()).atTime(FeatureInput.time(event.get("startTime").toString()));
            LocalDateTime eventEnd = FeatureInput.date(event.get("endDate").toString()).atTime(FeatureInput.time(event.get("endTime").toString()));
            if (eventStart.isBefore(start.atStartOfDay())) eventStart = start.atStartOfDay();
            if (eventEnd.isAfter(end.plusDays(1).atStartOfDay())) eventEnd = end.plusDays(1).atStartOfDay();
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
        for (var row : focus) if (row.get("endedAt") != null) focused += Math.max(0, Duration.between(FeatureInput.instant(row.get("startedAt").toString()), FeatureInput.instant(row.get("endedAt").toString())).toMinutes());
        List<Map<String,Object>> categoryRows = categories.entrySet().stream().map(e -> Map.<String,Object>of("category", e.getKey(), "plannedMinutes", e.getValue()[0], "actualMinutes", e.getValue()[1])).toList();
        long done = view.tasks().stream().filter(task -> task.status() == TaskStatus.DONE).count();
        return Map.of("from", start.toString(), "to", end.toString(), "plannedMinutes", planned, "actualMinutes", actual, "focusMinutes", focused, "completedTasks", done,
                "totalTasks", view.tasks().size(), "categories", categoryRows, "timeBlocks", blocks, "focusSessions", focus);
    }
    public List<Map<String,Object>> timeBlocks(String user, String date, String category) {
        LocalDate day = FeatureInput.date(date);
        return planner.find(user, day, null, category, null).stream().map(item -> Map.<String,Object>of("id", item.id(), "title", item.title(), "date", day.toString(), "minutes", minutes(item.startTime(), item.endTime()), "type", item.type().name())).toList();
    }
    private long minutes(LocalTime from, LocalTime to) { return from == null || to == null ? 0 : Math.max(0, Duration.between(from, to).toMinutes()); }
}
