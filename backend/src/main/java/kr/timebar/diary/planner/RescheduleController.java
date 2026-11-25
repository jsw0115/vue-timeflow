// 재배치 제안 API(PR-19 UF-137). 제안은 아무것도 바꾸지 않고, 적용·되돌리기는 고른 항목만 version을 확인해 옮긴다.
package kr.timebar.diary.planner;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/planner/reschedule")
public class RescheduleController {
    private final Rescheduler rescheduler;
    public RescheduleController(Rescheduler rescheduler) { this.rescheduler = rescheduler; }

    @PostMapping("/preview")
    public ApiResponse<?> preview(@RequestBody(required = false) Map<String, Object> body) { return ApiResponse.ok(rescheduler.preview(CurrentUser.id(), body)); }
    @PostMapping("/apply")
    public ApiResponse<?> apply(@RequestBody(required = false) Map<String, Object> body) { return ApiResponse.ok(rescheduler.apply(CurrentUser.id(), body)); }
}
