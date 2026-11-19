// 연결된 기록 조회와 할 일을 일정에 배치하는 API를 제공한다(PR-08 UF-90·UF-92).
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.common.IdempotencyKeys;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RecordLinkController {
    private final RecordLinks links;
    public RecordLinkController(RecordLinks links) { this.links = links; }

    @GetMapping("/record-links")
    public ApiResponse<?> list(@RequestParam String kind, @RequestParam String id) {
        RecordLinks.requireKind(kind);
        return ApiResponse.ok(links.of(CurrentUser.id(), kind, id));
    }

    @PostMapping("/tasks/{taskId}/schedules")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> place(@PathVariable String taskId, @RequestHeader(value = IdempotencyKeys.HEADER, required = false) String key, @RequestBody Map<String,Object> body) {
        return ApiResponse.ok(links.placeTask(CurrentUser.id(), taskId, body, key));
    }
}
