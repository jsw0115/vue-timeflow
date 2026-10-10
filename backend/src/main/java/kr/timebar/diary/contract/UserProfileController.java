// 실제 계정 프로필과 비밀번호 변경 및 개인 데이터 내보내기 API를 제공한다.
package kr.timebar.diary.contract;
import kr.timebar.diary.operations.SettingsService;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/user")
public class UserProfileController {
    private final SettingsService service;
    public UserProfileController(SettingsService service) { this.service = service; }
    @GetMapping("/profile")
    public ApiResponse<?> profile() { return ApiResponse.ok(service.profile(CurrentUser.id())); }
    @PutMapping("/profile")
    public ApiResponse<?> update(@RequestBody Map<String,Object> body) { return ApiResponse.ok(service.profile(CurrentUser.id(), body)); }
    @PutMapping("/password")
    public ApiResponse<?> password(@RequestBody Map<String,Object> body) { service.password(CurrentUser.id(), body); return ApiResponse.ok(null); }
    @GetMapping("/data/export")
    public ApiResponse<?> export() { return ApiResponse.ok(service.export(CurrentUser.id())); }
    @GetMapping("/sessions")
    public ApiResponse<?> sessions() { return ApiResponse.ok(service.sessions(CurrentUser.id())); }
    @DeleteMapping("/sessions/{id}")
    @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void revokeSession(@PathVariable String id) { service.revokeSession(CurrentUser.id(), id); }
    @DeleteMapping("/sessions")
    @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void revokeSessions() { service.revokeSessions(CurrentUser.id()); }
}
