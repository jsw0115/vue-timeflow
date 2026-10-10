// 관리자 계정·콘텐츠·문의·감사 기록을 실제 권한 검사와 함께 처리한다.
package kr.timebar.diary.operations;

import kr.timebar.diary.auth.*;
import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.*;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class AdminService {
    private final UserRepository users;
    private final FeatureStore store;
    private final RefreshTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final PasswordPolicy passwords;
    public AdminService(UserRepository users, FeatureStore store, RefreshTokenRepository tokens, PasswordEncoder encoder, PasswordPolicy passwords) {
        this.users = users; this.store = store; this.tokens = tokens; this.encoder = encoder; this.passwords = passwords;
    }
    public void requireAdmin() {
        var account = account(CurrentUser.id());
        if (!account.isActive() || account.getRole() != UserRole.ADMIN) throw new ApiException(ErrorCode.FORBIDDEN);
    }
    public FeaturePage users(String q, String role, String status, int page, int size) {
        requireAdmin();
        if (role != null) UserRole.valueOf(role); if (status != null) UserStatus.valueOf(status);
        var records = users.findAll().stream().filter(user -> role == null || role.equals(user.getRole().name())).filter(user -> status == null || status.equals(user.getStatus().name())).map(this::userResponse).toList();
        return FeaturePage.of(records, null, null, q, null, page, size);
    }
    public Map<String,Object> getUser(String id) { requireAdmin(); return userResponse(account(id)); }
    public Map<String,Object> createUser(Map<String,Object> body) {
        requireAdmin(); FeatureInput.keys(body, Set.of("email", "nickname", "password", "role"));
        String email = FeatureInput.requiredText(body, "email").toLowerCase(Locale.ROOT);
        if (!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) FeatureInput.fail("이메일을 확인해주세요.");
        String nickname = FeatureInput.requiredText(body, "nickname"); if (nickname.length() > 80) FeatureInput.fail("닉네임은 최대 80자입니다.");
        if (users.existsByEmail(email)) throw new ApiException(ErrorCode.DUPLICATE_EMAIL);
        String password = FeatureInput.requiredText(body, "password"); passwords.validateOrThrow(password);
        UserRole role = body.get("role") == null ? UserRole.USER : UserRole.valueOf(body.get("role").toString());
        var account = users.save(new UserEntity(email, nickname, encoder.encode(password), role, UserStatus.ACTIVE));
        audit("USER_CREATE", account.getId(), Map.of("role", role.name())); return userResponse(account);
    }
    public Map<String,Object> updateUser(String id, Map<String,Object> body) {
        requireAdmin(); FeatureInput.keys(body, Set.of("nickname", "role", "status"));
        var account = account(id); UserRole role = body.get("role") == null ? account.getRole() : UserRole.valueOf(body.get("role").toString());
        UserStatus status = body.get("status") == null ? account.getStatus() : UserStatus.valueOf(body.get("status").toString());
        if (id.equals(CurrentUser.id()) && (role != UserRole.ADMIN || status != UserStatus.ACTIVE)) throw new ApiException(ErrorCode.CONFLICT, "자신의 관리자 권한과 활성 상태는 유지해야 합니다.");
        if (body.get("nickname") != null) { String nickname = FeatureInput.requiredText(body, "nickname"); if (nickname.length() > 80) FeatureInput.fail("닉네임은 최대 80자입니다."); account.changeProfile(nickname); }
        account.changeAdminState(role, status); revoke(account);
        audit("USER_UPDATE", id, Map.of("role", role.name(), "status", status.name())); return userResponse(account);
    }
    public void deleteUser(String id) { updateUser(id, Map.of("status", "DELETED")); }
    public void logout(String id) { requireAdmin(); var account = account(id); account.invalidateSessions(); revoke(account); audit("FORCE_LOGOUT", id, Map.of()); }

    public FeaturePage list(FeatureType type, int page, int size, String q) {
        requireAdmin(); return FeaturePage.of(store.all(FeatureStore.SYSTEM, type), null, null, q, null, page, size);
    }
    public Map<String,Object> create(FeatureType type, Map<String,Object> body) {
        requireAdmin(); var row = store.create(FeatureStore.SYSTEM, type, FeatureInput.validate(type, body)); audit(type + "_CREATE", row.get("id").toString(), Map.of()); return row;
    }
    public Map<String,Object> update(FeatureType type, String id, Map<String,Object> body) {
        requireAdmin(); var row = store.replace(FeatureStore.SYSTEM, type, id, FeatureInput.version(body), FeatureInput.validate(type, body)); audit(type + "_UPDATE", id, Map.of()); return row;
    }
    public void delete(FeatureType type, String id, long version) { requireAdmin(); store.delete(FeatureStore.SYSTEM, type, id, version); audit(type + "_DELETE", id, Map.of()); }
    public List<Map<String,Object>> tickets() { requireAdmin(); return store.allOwners(FeatureType.TICKET); }
    public Map<String,Object> reply(String id, Map<String,Object> body) {
        requireAdmin(); FeatureInput.keys(body, Set.of("userId", "version", "reply", "status"));
        String user = FeatureInput.requiredText(body, "userId"), reply = FeatureInput.text(body, "reply");
        if (reply.length() > 20000) FeatureInput.fail("답변은 최대 20000자입니다.");
        FeatureInput.choice(body, "status", "OPEN", "IN_PROGRESS", "ANSWERED", "HOLD");
        if (body.get("status").equals("ANSWERED") && reply.isBlank()) FeatureInput.fail("답변이 필요합니다.");
        var old = store.get(user, FeatureType.TICKET, id); var data = FeatureStore.payload(old);
        data.put("reply", reply); data.put("status", body.get("status")); data.put("repliedBy", CurrentUser.id());
        var row = store.replace(user, FeatureType.TICKET, id, FeatureInput.version(body), data);
        audit("TICKET_REPLY", id, Map.of("status", body.get("status"))); return row;
    }
    public Map<String,Object> metrics() {
        requireAdmin(); return Map.of("users", users.count(), "activeUsers", users.findAll().stream().filter(UserEntity::isActive).count(), "tickets", store.allOwners(FeatureType.TICKET).size(), "communities", store.all(FeatureStore.SYSTEM, FeatureType.COMMUNITY).size());
    }
    public Map<String,Object> monitoring() {
        requireAdmin(); Runtime runtime = Runtime.getRuntime(); return Map.of("uptimeMs", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime(), "heapUsedBytes", runtime.totalMemory() - runtime.freeMemory(), "heapMaxBytes", runtime.maxMemory(), "processors", runtime.availableProcessors());
    }
    public Map<String,Object> settings() { requireAdmin(); return store.optional(FeatureStore.SYSTEM, FeatureType.SETTING, "admin").orElse(Map.of("version", 0, "value", Map.of())); }
    public Map<String,Object> settings(Map<String,Object> body) {
        requireAdmin(); var data = FeatureInput.validate(FeatureType.SETTING, body);
        var current = store.optional(FeatureStore.SYSTEM, FeatureType.SETTING, "admin");
        var row = current.isEmpty() ? store.create(FeatureStore.SYSTEM, FeatureType.SETTING, "admin", data) : store.replace(FeatureStore.SYSTEM, FeatureType.SETTING, "admin", FeatureInput.version(body), data);
        audit("SETTINGS_SAVE", "admin", Map.of()); return row;
    }
    private void audit(String action, String target, Map<String,Object> detail) { store.create(FeatureStore.SYSTEM, FeatureType.AUDIT, Map.of("action", action, "target", target, "actor", CurrentUser.id(), "detail", detail)); }
    public List<Map<String,Object>> moderation() { requireAdmin(); return store.allOwners(FeatureType.MODERATION); }
    public Map<String,Object> moderate(String id, Map<String,Object> body) {
        requireAdmin(); FeatureInput.keys(body, Set.of("userId", "version", "action")); FeatureInput.choice(body, "action", "REMOVE", "IGNORE");
        String user = FeatureInput.requiredText(body, "userId"); var report = store.lock(user, FeatureType.MODERATION, id);
        if (((Number)report.get("version")).longValue() != FeatureInput.version(body)) throw new ApiException(ErrorCode.CONFLICT);
        if (report.containsKey("decision")) throw new ApiException(ErrorCode.CONFLICT, "이미 처리한 신고입니다.");
        String community = report.get("communityId").toString(), post = report.get("postId").toString();
        if (body.get("action").equals("REMOVE")) store.optional(community, FeatureType.POST, post).ifPresent(row -> store.delete(community, FeatureType.POST, post, ((Number)row.get("version")).longValue()));
        var data = FeatureStore.payload(report); data.put("decision", body.get("action")); data.put("decidedBy", CurrentUser.id());
        var row = store.replace(user, FeatureType.MODERATION, id, FeatureInput.version(body), data);
        audit("MODERATION", id, Map.of("action", body.get("action"))); return row;
    }
    private void revoke(UserEntity account) { tokens.revokeAllActiveByUserId(account.getId(), LocalDateTime.now(ZoneOffset.UTC)); }
    private UserEntity account(String id) { return users.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND)); }
    private Map<String,Object> userResponse(UserEntity user) { return Map.of("id", user.getId(), "name", user.getNickname(), "nickname", user.getNickname(), "email", user.getEmail(), "role", user.getRole().name(), "status", user.getStatus().name(), "createdAt", Objects.toString(user.getCreatedAt(), "")); }
}
