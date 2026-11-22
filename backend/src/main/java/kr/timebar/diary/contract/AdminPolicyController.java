// 관리자 정책 보기: 서버가 지금 실제로 적용하는 보안·업로드·보관 값을 읽기 전용으로 준다(Q-30). 화면에서 바꾸는 API는 두지 않는다.
package kr.timebar.diary.contract;

import kr.timebar.diary.auth.LoginThrottleEntity;
import kr.timebar.diary.auth.PasswordPolicy;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.common.IdempotencyKeys;
import kr.timebar.diary.operations.AdminService;
import kr.timebar.diary.operations.BackupService;
import kr.timebar.diary.records.AttachmentController;
import kr.timebar.diary.security.JwtProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminPolicyController {
    /** 화면에 있었지만 서버가 적용하지 않는 항목. 화면은 "지원하지 않음"으로 보인다. */
    public static final List<String> UNSUPPORTED = List.of("adminTwoFactor", "ipAllowlist", "operatorRoles", "signupControl", "emailVerification", "dataRetention", "dormantAccounts");
    private final AdminService admin;
    private final JwtProperties jwt;
    public AdminPolicyController(AdminService admin, JwtProperties jwt) { this.admin = admin; this.jwt = jwt; }

    @GetMapping("/policy")
    public ApiResponse<?> policy() {
        admin.requireAdmin();
        var result = new LinkedHashMap<String,Object>();
        result.put("password", Map.of("minLength", PasswordPolicy.MIN_LENGTH, "maxLength", PasswordPolicy.MAX_LENGTH, "minKinds", PasswordPolicy.MIN_KINDS, "whitespaceAllowed", false));
        result.put("login", Map.of("maxFailures", LoginThrottleEntity.MAX_ATTEMPTS, "lockMinutes", LoginThrottleEntity.LOCK_MINUTES));
        result.put("session", Map.of("accessTtlSeconds", jwt.getAccessTtlSeconds(), "refreshTtlSeconds", jwt.getRefreshTtlSeconds()));
        result.put("uploads", Map.of("attachmentMaxBytes", AttachmentController.MAX_BYTES, "backupMaxBytes", BackupService.MAX_BYTES));
        result.put("retention", Map.of("idempotencyKeyDays", IdempotencyKeys.RETENTION_DAYS));
        result.put("roles", List.of("USER", "ADMIN"));
        result.put("unsupported", UNSUPPORTED);
        return ApiResponse.ok(result);
    }
}
