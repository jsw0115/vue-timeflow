// 개인 기록의 기능별 조회와 저장 API를 제공한다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.records.RecordService;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RecordsController {
    private final RecordService records;
    public RecordsController(RecordService records) { this.records = records; }
    @GetMapping("/diaries")
    public ApiResponse<?> diaryList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.DIARY, from, to, q, category, page, size));
    }
    @GetMapping("/diaries/{id}")
    public ApiResponse<?> diaryGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.DIARY, id)); }
    @PostMapping("/diaries")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> diaryCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.DIARY, body)); }
    @PutMapping("/diaries/{id}")
    public ApiResponse<?> diaryUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.DIARY, id, body)); }
    @DeleteMapping("/diaries/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void diaryDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.DIARY, id, version); }
    @GetMapping("/memos")
    public ApiResponse<?> memoList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.MEMO, from, to, q, category, page, size));
    }
    @GetMapping("/memos/{id}")
    public ApiResponse<?> memoGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.MEMO, id)); }
    @PostMapping("/memos")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> memoCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.MEMO, body)); }
    @PutMapping("/memos/{id}")
    public ApiResponse<?> memoUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.MEMO, id, body)); }
    @DeleteMapping("/memos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void memoDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.MEMO, id, version); }
    @GetMapping("/ddays")
    public ApiResponse<?> ddayList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.DDAY, from, to, q, category, page, size));
    }
    @GetMapping("/ddays/{id}")
    public ApiResponse<?> ddayGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.DDAY, id)); }
    @PostMapping("/ddays")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> ddayCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.DDAY, body)); }
    @PutMapping("/ddays/{id}")
    public ApiResponse<?> ddayUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.DDAY, id, body)); }
    @DeleteMapping("/ddays/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void ddayDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.DDAY, id, version); }
    @GetMapping("/money/entries")
    public ApiResponse<?> moneyList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.MONEY, from, to, q, category, page, size));
    }
    @GetMapping("/money/entries/{id}")
    public ApiResponse<?> moneyGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.MONEY, id)); }
    @PostMapping("/money/entries")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> moneyCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.MONEY, body)); }
    @PutMapping("/money/entries/{id}")
    public ApiResponse<?> moneyUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.MONEY, id, body)); }
    @DeleteMapping("/money/entries/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void moneyDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.MONEY, id, version); }
    @GetMapping("/focus/sessions")
    public ApiResponse<?> focusList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.FOCUS, from, to, q, category, page, size));
    }
    @GetMapping("/focus/sessions/{id}")
    public ApiResponse<?> focusGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.FOCUS, id)); }
    @PostMapping("/focus/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> focusCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.FOCUS, body)); }
    @PutMapping("/focus/sessions/{id}")
    public ApiResponse<?> focusUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.FOCUS, id, body)); }
    @DeleteMapping("/focus/sessions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void focusDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.FOCUS, id, version); }
    @GetMapping("/events/templates")
    public ApiResponse<?> eventtemplateList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.EVENT_TEMPLATE, from, to, q, category, page, size));
    }
    @GetMapping("/events/templates/{id}")
    public ApiResponse<?> eventtemplateGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.EVENT_TEMPLATE, id)); }
    @PostMapping("/events/templates")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> eventtemplateCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.EVENT_TEMPLATE, body)); }
    @PutMapping("/events/templates/{id}")
    public ApiResponse<?> eventtemplateUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.EVENT_TEMPLATE, id, body)); }
    @DeleteMapping("/events/templates/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eventtemplateDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.EVENT_TEMPLATE, id, version); }
    @GetMapping("/planner/templates")
    public ApiResponse<?> plannertemplateList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.PLANNER_TEMPLATE, from, to, q, category, page, size));
    }
    @GetMapping("/planner/templates/{id}")
    public ApiResponse<?> plannertemplateGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.PLANNER_TEMPLATE, id)); }
    @PostMapping("/planner/templates")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> plannertemplateCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.PLANNER_TEMPLATE, body)); }
    @PutMapping("/planner/templates/{id}")
    public ApiResponse<?> plannertemplateUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.PLANNER_TEMPLATE, id, body)); }
    @DeleteMapping("/planner/templates/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void plannertemplateDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.PLANNER_TEMPLATE, id, version); }
}
