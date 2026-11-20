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
        // 통계 수치마다 그 수치를 만든 원본 행을 함께 준다. 각 목록의 분 합계는 수치와 같다(PR-10 6단계, UF-118)
        List<Map<String,Object>> plannedSources = new ArrayList<>(), actualSources = new ArrayList<>(), focusSources = new ArrayList<>(), taskSources = new ArrayList<>();
        // 일정 시각은 사용자 시간대의 벽시계 시각이다. 기간은 첫날 경계부터 마지막 날 다음 경계까지이고, 경계가 0시가 아니면 다음 날 새벽 회차도 들어온다
        Instant rangeStart = clock.start(start), rangeEnd = clock.end(end);
        for (var event : schedules.occurrences(user, start.toString(), end.plusDays(1).toString())) {
            Instant eventStart = FeatureInput.date(event.get("startDate").toString()).atTime(FeatureInput.time(event.get("startTime").toString())).atZone(clock.zone()).toInstant();
            Instant eventEnd = FeatureInput.date(event.get("endDate").toString()).atTime(FeatureInput.time(event.get("endTime").toString())).atZone(clock.zone()).toInstant();
            if (eventStart.isBefore(rangeStart)) eventStart = rangeStart;
            if (eventEnd.isAfter(rangeEnd)) eventEnd = rangeEnd;
            long minutes = Math.max(0, Duration.between(eventStart, eventEnd).toMinutes()); planned += minutes;
            categories.computeIfAbsent(FeatureInput.text(event, "category"), key -> new long[2])[0] += minutes;
            if (minutes > 0) plannedSources.add(source("schedule", event.get("occurrenceKey"), event.get("sourceId"), FeatureInput.text(event, "title"), clock.dateOf(eventStart), minutes, FeatureInput.text(event, "category")));
        }
        List<Map<String,Object>> blocks = new ArrayList<>();
        for (PlannerItem item : planner.find(user, null, null, null, null)) {
            if (item.date() == null || item.date().isBefore(start) || item.date().isAfter(end)) continue;
            long minutes = minutes(item.startTime(), item.endTime());
            boolean isActual = item.type() == PlannerItem.ItemType.ACTUAL;
            if (isActual) actual += minutes; else planned += minutes;
            categories.computeIfAbsent(Objects.toString(item.category(), "미분류"), key -> new long[2])[isActual ? 1 : 0] += minutes;
            if (minutes > 0) (isActual ? actualSources : plannedSources).add(source("planner", item.id(), item.id(), item.title(), item.date(), minutes, Objects.toString(item.category(), "미분류")));
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
            if (minutes > 0) actualSources.add(source("recording", block.get("id") + "@" + block.get("date"), block.get("id"), block.get("title").toString(), FeatureInput.date(block.get("date").toString()), minutes, "미분류"));
        }
        for (var row : focus) if (row.get("endedAt") != null) {
            long minutes = Math.max(0, Duration.between(FeatureInput.instant(row.get("startedAt").toString()), FeatureInput.instant(row.get("endedAt").toString())).toMinutes());
            focused += minutes;
            if (minutes > 0) focusSources.add(source("focus", row.get("id"), row.get("id"), FeatureInput.text(row, "title"), FeatureInput.date(row.get("date").toString()), minutes, FeatureInput.text(row, "category")));
        }
        List<Map<String,Object>> categoryRows = categories.entrySet().stream().map(e -> Map.<String,Object>of("category", e.getKey(), "plannedMinutes", e.getValue()[0], "actualMinutes", e.getValue()[1])).toList();
        long done = view.tasks().stream().filter(task -> task.status() == TaskStatus.DONE).count();
        for (var task : view.tasks()) {
            var row = new LinkedHashMap<String,Object>(); row.put("kind", "task"); row.put("id", task.id()); row.put("recordId", task.id()); row.put("title", task.title());
            row.put("date", task.due() == null ? null : task.due().toString()); row.put("done", task.status() == TaskStatus.DONE); taskSources.add(row);
        }
        var result = new LinkedHashMap<String,Object>();
        result.put("from", start.toString()); result.put("to", end.toString());
        // 화면이 집계 기간과 함께 시간대·하루 시작 시각을 보이도록 준다(UF-118)
        result.put("timeZone", clock.zone().getId()); result.put("dayStartHour", clock.startHour());
        result.put("plannedMinutes", planned); result.put("actualMinutes", actual); result.put("focusMinutes", focused); result.put("completedTasks", done); result.put("totalTasks", view.tasks().size());
        result.put("categories", categoryRows); result.put("timeBlocks", blocks); result.put("focusSessions", focus);
        result.put("sources", Map.of("planned", plannedSources, "actual", actualSources, "focus", focusSources, "tasks", taskSources));
        return result;
    }
    public List<Map<String,Object>> timeBlocks(String user, String date, String category) {
        LocalDate day = FeatureInput.date(date);
        var result = new ArrayList<>(planner.find(user, day, null, category, null).stream().map(item -> Map.<String,Object>of("id", item.id(), "title", item.title(), "date", day.toString(), "minutes", minutes(item.startTime(), item.endTime()), "type", item.type().name())).toList());
        if (category == null || category.equals("미분류")) result.addAll(actualBlocks(user, days.of(user), day, day));
        return result;
    }
    /**
     * 실제 기록을 날짜별로 나눈다. 기록에 저장한 시간대가 아니라 사용자 시간대와 하루 경계를 쓴다(Q-06). 저장된 시작·종료 시각은 바꾸지 않는다.
     * 그날 구간에 겹친 일시정지는 뺀다(PR-09 UF-122).
     */
    private List<Map<String,Object>> actualBlocks(String user, DayPolicy.Day clock, LocalDate from, LocalDate to) {
        var result = new ArrayList<Map<String,Object>>();
        for (var row : store.all(user, FeatureType.ACTUAL_SESSION)) {
            if (!"COMPLETED".equals(row.get("state"))) continue;
            Instant start = Instant.parse(row.get("startedAt").toString()), end = Instant.parse(row.get("endedAt").toString());
            for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
                Instant dayStart = clock.start(day), dayEnd = clock.end(day);
                if (start.isBefore(dayEnd) && end.isAfter(dayStart))
                    result.add(Map.of("id", row.get("id"), "title", row.get("title"), "date", day.toString(), "minutes", RecordingTime.seconds(row, dayStart, dayEnd) / 60, "type", "ACTUAL"));
            }
        }
        return result;
    }
    /** 통계 원본 행. id는 목록 안에서 겹치지 않는 값, recordId는 원래 기록의 ID다. */
    private static Map<String,Object> source(String kind, Object id, Object recordId, String title, LocalDate date, long minutes, String category) {
        var row = new LinkedHashMap<String,Object>();
        row.put("kind", kind); row.put("id", String.valueOf(id)); row.put("recordId", String.valueOf(recordId)); row.put("title", title == null ? "" : title);
        row.put("date", date.toString()); row.put("minutes", minutes); row.put("category", category == null || category.isEmpty() ? "미분류" : category);
        return row;
    }
    private long minutes(LocalTime from, LocalTime to) { return from == null || to == null ? 0 : Math.max(0, Duration.between(from, to).toMinutes()); }
}
