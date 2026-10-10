// 설정 섹션별 조회와 버전 검증 저장 API를 제공한다.
package kr.timebar.diary.contract;
import kr.timebar.diary.operations.SettingsService;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final SettingsService service;
    public SettingsController(SettingsService service) { this.service = service; }
    @GetMapping
    public ApiResponse<?> get() { return ApiResponse.ok(service.get(CurrentUser.id(), "general")); }
    @PostMapping
    public ApiResponse<?> save(@RequestBody Map<String,Object> body) { return ApiResponse.ok(service.save(CurrentUser.id(), "general", body)); }
    @GetMapping("/{section}")
    public ApiResponse<?> section(@PathVariable String section) { return ApiResponse.ok(service.get(CurrentUser.id(), section)); }
    @PostMapping("/{section}")
    public ApiResponse<?> saveSection(@PathVariable String section, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.save(CurrentUser.id(), section, body)); }
}
