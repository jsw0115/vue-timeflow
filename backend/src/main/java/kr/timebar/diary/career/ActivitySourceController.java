// 커리어 활동의 근거 원본 연결 API(PR-24). 일정·실제 기록·WBS 작업을 활동의 근거로 잇고, 지워진 원본은 깨진 출처로 보인다.
package kr.timebar.diary.career;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/career/activities/{id}/sources")
public class ActivitySourceController {
    private final ActivitySources sources;
    public ActivitySourceController(ActivitySources sources) { this.sources = sources; }
    @GetMapping
    public ApiResponse<?> list(@PathVariable String id) { return ApiResponse.ok(sources.list(CurrentUser.id(), id)); }
    @PostMapping
    public ApiResponse<?> add(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(sources.add(CurrentUser.id(), id, body)); }
    @DeleteMapping("/{kind}/{sourceId}")
    public ApiResponse<?> remove(@PathVariable String id, @PathVariable String kind, @PathVariable String sourceId) { return ApiResponse.ok(sources.remove(CurrentUser.id(), id, kind, sourceId)); }
}
