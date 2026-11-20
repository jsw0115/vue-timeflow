// 인증한 계정의 실제 기록 시작·일시정지·재개·종료·취소·복구·상세 조회 API를 제공한다.
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/planner/recordings")
public class ActualRecordingController {
    private final ActualRecordingService recordings;
    public ActualRecordingController(ActualRecordingService recordings) { this.recordings = recordings; }
    @GetMapping
    public ApiResponse<?> list() { return ApiResponse.ok(recordings.list(CurrentUser.id())); }
    @GetMapping("/current")
    public ApiResponse<?> current() { return ApiResponse.ok(recordings.current(CurrentUser.id())); }
    @GetMapping("/{id}")
    public ApiResponse<?> get(@PathVariable String id) { return ApiResponse.ok(recordings.get(CurrentUser.id(), id)); }
    @PostMapping("/start")
    public ApiResponse<?> start(@RequestBody Map<String,Object> body) { return ApiResponse.ok(recordings.start(CurrentUser.id(), body)); }
    @PostMapping("/{id}/finish")
    public ApiResponse<?> finish(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(recordings.finish(CurrentUser.id(), id, body)); }
    @PostMapping("/{id}/pause")
    public ApiResponse<?> pause(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(recordings.pause(CurrentUser.id(), id, body)); }
    @PostMapping("/{id}/resume")
    public ApiResponse<?> resume(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(recordings.resume(CurrentUser.id(), id, body)); }
    @PostMapping("/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable String id, @RequestBody Map<String,Object> body) { recordings.cancel(CurrentUser.id(), id, body); }
}
