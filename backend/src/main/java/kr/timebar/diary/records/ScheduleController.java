// 여러 날 일정·반복 규칙·목표 수량을 보존하는 프런트엔드 모델 API를 제공한다.
package kr.timebar.diary.records;
import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;
@RestController
@RequestMapping("/api")
public class ScheduleController {
    private final RecordService records;
    private final ScheduleService schedules;
    public ScheduleController(RecordService records, ScheduleService schedules) { this.records = records; this.schedules = schedules; }
    @GetMapping("/schedules")
    public ApiResponse<?> scheduleList(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q) { return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.SCHEDULE, null, null, q, null, page, size)); }
    @GetMapping("/schedules/{id}")
    public ApiResponse<?> scheduleGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.SCHEDULE, id)); }
    @PostMapping("/schedules")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> scheduleCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.SCHEDULE, body)); }
    @PutMapping("/schedules/{id}")
    public ApiResponse<?> scheduleUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.SCHEDULE, id, body)); }
    @DeleteMapping("/schedules/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void scheduleDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.SCHEDULE, id, version); }
    @GetMapping("/routine-records")
    public ApiResponse<?> routinerecordList(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q) { return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.ROUTINE_RECORD, null, null, q, null, page, size)); }
    @GetMapping("/routine-records/{id}")
    public ApiResponse<?> routinerecordGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.ROUTINE_RECORD, id)); }
    @PostMapping("/routine-records")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> routinerecordCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.ROUTINE_RECORD, body)); }
    @PutMapping("/routine-records/{id}")
    public ApiResponse<?> routinerecordUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.ROUTINE_RECORD, id, body)); }
    @DeleteMapping("/routine-records/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void routinerecordDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.ROUTINE_RECORD, id, version); }
    @GetMapping("/schedules/occurrences")
    public ApiResponse<?> occurrences(@RequestParam String from, @RequestParam String to) { return ApiResponse.ok(schedules.occurrences(CurrentUser.id(), from, to)); }
    @GetMapping("/routine-records/{id}/history")
    public ApiResponse<?> history(@PathVariable String id, @RequestParam String from, @RequestParam String to) { return ApiResponse.ok(schedules.history(CurrentUser.id(), id, from, to)); }
    @PutMapping("/routine-records/{id}/history/{date}")
    public ApiResponse<?> completion(@PathVariable String id, @PathVariable String date, @RequestBody Map<String,Object> body) { return ApiResponse.ok(schedules.complete(CurrentUser.id(), id, date, body)); }
}
