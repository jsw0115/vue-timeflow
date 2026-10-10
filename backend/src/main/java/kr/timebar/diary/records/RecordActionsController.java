// 회고·템플릿 적용·메모 전환·알림 읽음 등 기록의 동작 API를 제공한다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import kr.timebar.diary.task.TaskService;
import kr.timebar.diary.task.dto.TaskRequest;
import kr.timebar.diary.event.EventService;
import kr.timebar.diary.event.EventVisibility;
import kr.timebar.diary.event.dto.EventRequest;
import kr.timebar.diary.planner.*;
import kr.timebar.diary.work.WorkService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@Transactional
public class RecordActionsController {
    private final RecordService records;
    private final FeatureStore store;
    private final TaskService tasks;
    private final EventService events;
    private final PlannerService planner;
    private final WorkService work;
    public RecordActionsController(RecordService records, FeatureStore store, TaskService tasks, EventService events, PlannerService planner, WorkService work) {
        this.records = records; this.store = store; this.tasks = tasks; this.events = events; this.planner = planner; this.work = work;
    }

    @GetMapping("/planner/reviews/{date}")
    public ApiResponse<?> review(@PathVariable String date) { FeatureInput.date(date); return ApiResponse.ok(store.get(CurrentUser.id(), FeatureType.REVIEW, date)); }
    @PutMapping("/planner/reviews/{date}")
    public ApiResponse<?> saveReview(@PathVariable String date, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.saveDate(CurrentUser.id(), FeatureType.REVIEW, date, body)); }
    @DeleteMapping("/planner/reviews/{date}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(@PathVariable String date, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.REVIEW, date, version); }
    @GetMapping("/money/summary")
    public ApiResponse<?> money(@RequestParam(required=false) String from, @RequestParam(required=false) String to) { return ApiResponse.ok(records.moneySummary(CurrentUser.id(), from, to)); }
    @GetMapping("/notifications")
    public ApiResponse<?> notifications(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.NOTIFICATION, null, null, q, null, page, size));
    }
    @PutMapping("/notifications/{id}/read")
    public ApiResponse<?> read(@PathVariable String id) { return ApiResponse.ok(records.setRead(CurrentUser.id(), id)); }
    @PutMapping("/notifications/read-all")
    public ApiResponse<?> readAll() { records.readAll(CurrentUser.id()); return ApiResponse.ok(null); }
    @DeleteMapping("/notifications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.NOTIFICATION, id, version); }

    @PostMapping("/memos/{id}/convert-to-task")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> convert(@PathVariable String id, @RequestBody Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("version", "due", "category"));
        String user = CurrentUser.id(); var memo = store.lock(user, FeatureType.MEMO, id);
        if (((Number)memo.get("version")).longValue() != FeatureInput.version(body)) throw new kr.timebar.diary.common.ApiException(kr.timebar.diary.common.ErrorCode.CONFLICT);
        LocalDate due = FeatureInput.text(body, "due").isEmpty() ? null : FeatureInput.date(FeatureInput.text(body, "due"));
        var result = tasks.create(user, new TaskRequest(memo.get("title").toString(), FeatureInput.text(memo, "body"), null, null, 30, due, null, FeatureInput.text(body, "category"), null, null));
        store.delete(user, FeatureType.MEMO, id, FeatureInput.version(body));
        return ApiResponse.ok(result);
    }

    @PostMapping("/events/templates/{id}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> applyEvent(@PathVariable String id, @RequestBody Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("date", "startTime"));
        var template = store.get(CurrentUser.id(), FeatureType.EVENT_TEMPLATE, id);
        LocalDate date = FeatureInput.date(FeatureInput.requiredText(body, "date"));
        LocalTime start = FeatureInput.time(FeatureInput.requiredText(body, "startTime"));
        int duration = ((Number)template.get("duration")).intValue();
        if (start.toSecondOfDay() + duration * 60 >= 86400) FeatureInput.fail("일정 템플릿은 같은 날짜 안에 종료되어야 합니다.");
        return ApiResponse.ok(events.create(CurrentUser.id(), new EventRequest(template.get("title").toString(), FeatureInput.text(template, "category"), date, start, start.plusMinutes(duration), null, EventVisibility.PRIVATE, "")));
    }

    @PostMapping("/planner/templates/{id}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> applyPlanner(@PathVariable String id, @RequestBody Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("date"));
        LocalDate date = FeatureInput.date(FeatureInput.requiredText(body, "date"));
        var template = store.get(CurrentUser.id(), FeatureType.PLANNER_TEMPLATE, id);
        List<PlannerItem> items = new ArrayList<>();
        for (Object item : (List<?>) template.get("blocks")) {
            var block = FeatureInput.object(item); LocalTime start = FeatureInput.time(block.get("time").toString());
            LocalTime end = block.get("duration") == null ? null : start.plusMinutes(((Number)block.get("duration")).longValue());
            items.add(planner.save(CurrentUser.id(), new PlannerItem(null, PlannerItem.ItemType.EVENT, block.get("title").toString(), "개인", date, start, end, PlannerItem.ItemStatus.SCHEDULED, false, "")));
        }
        return ApiResponse.ok(items);
    }

    @GetMapping("/planner/canvas")
    public ApiResponse<?> canvas() { return ApiResponse.ok(store.optional(CurrentUser.id(), FeatureType.BOARD, "default").orElse(Map.of("columns", List.of(), "cards", List.of(), "version", 0))); }
    @PutMapping("/planner/canvas")
    public ApiResponse<?> saveCanvas(@RequestBody Map<String,Object> body) {
        var data = FeatureInput.validate(FeatureType.BOARD, body);
        if (store.optional(CurrentUser.id(), FeatureType.BOARD, "default").isEmpty()) return ApiResponse.ok(store.create(CurrentUser.id(), FeatureType.BOARD, "default", data));
        return ApiResponse.ok(store.replace(CurrentUser.id(), FeatureType.BOARD, "default", FeatureInput.version(body), data));
    }
    @GetMapping("/work/wbs")
    public ApiResponse<?> wbs() { return ApiResponse.ok(work.wbs(CurrentUser.id())); }
    @GetMapping("/work/wiki/{id}/history")
    public ApiResponse<?> wikiHistory(@PathVariable String id) { return ApiResponse.ok(work.history(CurrentUser.id(), id)); }
    @GetMapping("/work/resume")
    public ApiResponse<?> resume() { return ApiResponse.ok(store.optional(CurrentUser.id(), FeatureType.RESUME, "default").orElse(Map.of("version", 0))); }
    @PutMapping("/work/resume")
    public ApiResponse<?> saveResume(@RequestBody Map<String,Object> body) {
        var data = FeatureInput.validate(FeatureType.RESUME, body);
        if (store.optional(CurrentUser.id(), FeatureType.RESUME, "default").isEmpty()) return ApiResponse.ok(store.create(CurrentUser.id(), FeatureType.RESUME, "default", data));
        return ApiResponse.ok(store.replace(CurrentUser.id(), FeatureType.RESUME, "default", FeatureInput.version(body), data));
    }
}
