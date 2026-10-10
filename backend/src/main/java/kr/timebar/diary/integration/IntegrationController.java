// 제공자 미설정 기능의 상태와 외부 연동 API 경계를 명확하게 반환한다.
package kr.timebar.diary.integration;

import kr.timebar.diary.common.*;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.security.CurrentUser;
import kr.timebar.diary.operations.AdminService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@RequestMapping("/api")
public class IntegrationController {
    private final AdminService admin;
    public IntegrationController(AdminService admin) { this.admin = admin; }
    @GetMapping("/integrations/capabilities")
    public ApiResponse<?> capabilities() {
        CurrentUser.id();
        return ApiResponse.ok(List.of("ai", "stt", "calendar-sync", "billing", "social-login", "kakao-notification", "two-factor", "cofocus-video").stream()
                .map(feature -> Map.of("feature", feature, "available", false, "status", "PROVIDER_REQUIRED")).toList());
    }
    @PostMapping("/insight/generate")
    public ApiResponse<?> insight(@RequestBody Map<String,Object> body) { CurrentUser.id(); FeatureInput.keys(body, Set.of("from", "to", "features")); throw unavailable("AI"); }
    @PostMapping(value="/memos/stt", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> stt(@RequestPart MultipartFile file) { CurrentUser.id(); if (file.isEmpty()) FeatureInput.fail("음성 파일이 필요합니다."); throw unavailable("음성 인식"); }
    @GetMapping("/sync/status")
    public ApiResponse<?> syncStatus() { CurrentUser.id(); return ApiResponse.ok(Map.of("providers", List.of(), "conflicts", List.of(), "logs", List.of(), "available", false)); }
    @PostMapping("/sync/{provider}/run")
    public ApiResponse<?> sync(@PathVariable String provider) { CurrentUser.id(); throw unavailable("캘린더 동기화"); }
    @PostMapping("/billing/checkout")
    public ApiResponse<?> checkout(@RequestBody Map<String,Object> body) { CurrentUser.id(); FeatureInput.keys(body, Set.of("planId", "returnUrl")); throw unavailable("결제"); }
    @PostMapping("/billing/cancel")
    public ApiResponse<?> cancel(@RequestBody Map<String,Object> body) { CurrentUser.id(); FeatureInput.keys(body, Set.of("reason")); throw unavailable("구독"); }
    @PostMapping("/admin/billing/{id}/refund")
    public ApiResponse<?> refund(@PathVariable String id) { admin.requireAdmin(); throw unavailable("환불"); }
    @PostMapping("/admin/billing/{id}/retry")
    public ApiResponse<?> retry(@PathVariable String id) { admin.requireAdmin(); throw unavailable("결제 재시도"); }
    @GetMapping("/user/social-accounts")
    public ApiResponse<?> socialAccounts() { CurrentUser.id(); return ApiResponse.ok(List.of()); }
    @PostMapping("/user/social-accounts/{provider}/connect")
    public ApiResponse<?> connect(@PathVariable String provider) { CurrentUser.id(); throw unavailable("OAuth"); }
    @PostMapping("/settings/notifications/kakao/verify")
    public ApiResponse<?> kakao(@RequestBody Map<String,Object> body) { CurrentUser.id(); FeatureInput.keys(body, Set.of("phone", "code", "consent")); throw unavailable("알림톡"); }
    @PostMapping("/cofocus/rooms")
    public ApiResponse<?> cofocus(@RequestBody Map<String,Object> body) { CurrentUser.id(); FeatureInput.keys(body, Set.of("title", "recordingConsent")); throw unavailable("공동 집중 영상"); }
    private ApiException unavailable(String feature) { return new ApiException(ErrorCode.SERVICE_UNAVAILABLE, feature + " 제공자 및 서버 어댑터 설정이 필요합니다."); }
}
