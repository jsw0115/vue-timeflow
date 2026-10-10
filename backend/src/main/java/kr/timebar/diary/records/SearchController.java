// 개인 기록과 일정·할 일·루틴의 통합 검색 및 태그 목록을 제공한다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import kr.timebar.diary.task.TaskService;
import kr.timebar.diary.routine.RoutineService;
import kr.timebar.diary.event.EventService;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    private static final Set<FeatureType> TYPES = Set.of(FeatureType.SCHEDULE, FeatureType.ROUTINE_RECORD, FeatureType.DIARY, FeatureType.MEMO, FeatureType.DDAY, FeatureType.MONEY, FeatureType.REVIEW, FeatureType.WORK_RECORD, FeatureType.WIKI, FeatureType.WBS, FeatureType.CAREER, FeatureType.PORTFOLIO, FeatureType.REPORT);
    private final FeatureStore store;
    private final TaskService tasks;
    private final RoutineService routines;
    private final EventService events;
    public SearchController(FeatureStore store, TaskService tasks, RoutineService routines, EventService events) { this.store = store; this.tasks = tasks; this.routines = routines; this.events = events; }
    @GetMapping
    public ApiResponse<?> search(@RequestParam(required=false) String q, @RequestParam(required=false) String tag, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        List<Map<String,Object>> rows = rows(CurrentUser.id());
        if (tag != null) rows = rows.stream().filter(row -> tags(row).contains(tag)).toList();
        return ApiResponse.ok(FeaturePage.of(rows, null, null, q, null, page, size));
    }
    @GetMapping("/tags")
    public ApiResponse<?> tags() {
        Map<String,Long> counts = new TreeMap<>(); for (var row : rows(CurrentUser.id())) for (String tag : tags(row)) counts.merge(tag, 1L, Long::sum);
        return ApiResponse.ok(counts.entrySet().stream().map(e -> Map.of("tag", e.getKey(), "count", e.getValue())).toList());
    }
    private List<Map<String,Object>> rows(String user) {
        List<Map<String,Object>> result = new ArrayList<>();
        for (FeatureType type : TYPES) for (var row : store.all(user, type)) {
            if (row.get("id").toString().contains("@")) continue;
            var record = new LinkedHashMap<>(row); record.put("domain", type.name().toLowerCase(Locale.ROOT)); result.add(record);
        }
        for (var task : tasks.list(user)) result.add(row(task.id(), task.title(), task.note(), "task", task.due() == null ? "" : task.due().toString()));
        for (var routine : routines.list(user)) result.add(row(routine.id(), routine.name(), "", "routine", ""));
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        for (var event : events.search(user, today.minusYears(1), today.plusYears(1), null, null)) result.add(row(event.id().toString(), event.title(), event.note(), "event", event.date().toString()));
        return result;
    }
    private Map<String,Object> row(String id, String title, String body, String domain, String date) { return Map.of("id", id, "title", title, "body", Objects.toString(body, ""), "domain", domain, "date", date, "createdAt", Instant.EPOCH.toString()); }
    private Set<String> tags(Map<String,Object> row) {
        Set<String> result = new TreeSet<>(); var matcher = Pattern.compile("#([\\p{L}\\p{N}_-]+)").matcher(FeatureInput.text(row, "title") + " " + FeatureInput.text(row, "body"));
        while (matcher.find()) result.add(matcher.group(1));
        if (row.get("tags") instanceof List<?> list) for (Object item : list) result.add(item.toString()); return result;
    }
}
