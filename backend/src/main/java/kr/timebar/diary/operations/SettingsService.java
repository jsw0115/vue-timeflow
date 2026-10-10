// 개인 설정과 프로필·비밀번호·데이터 내보내기를 서버 계정에 연결한다.
package kr.timebar.diary.operations;

import kr.timebar.diary.auth.*;
import kr.timebar.diary.common.*;
import kr.timebar.diary.feature.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class SettingsService {
    public static final Set<String> SECTIONS = Set.of("general", "categories", "notifications", "share-visibility", "theme-sticker", "appearance", "mode-profiles", "form-style", "dashboard", "stats-portlets", "automation", "ai", "work-privacy", "security", "widgets", "integrations");
    private final FeatureStore store;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final PasswordPolicy passwords;
    private final RefreshTokenRepository tokens;
    public SettingsService(FeatureStore store, UserRepository users, PasswordEncoder encoder, PasswordPolicy passwords, RefreshTokenRepository tokens) {
        this.store = store; this.users = users; this.encoder = encoder; this.passwords = passwords; this.tokens = tokens;
    }
    public Map<String,Object> get(String user, String section) {
        section(section);
        return store.optional(user, FeatureType.SETTING, section).orElse(Map.of("id", section, "version", 0, "value", Map.of()));
    }
    public Map<String,Object> save(String user, String section, Map<String,Object> body) {
        section(section); var data = FeatureInput.validate(FeatureType.SETTING, body);
        if (!(data.get("value") instanceof Map<?,?>) && !(data.get("value") instanceof List<?>)) FeatureInput.fail("value는 설정 객체 또는 배열이어야 합니다.");
        if (section.equals("security") && data.get("value") instanceof Map<?,?> value && Boolean.TRUE.equals(value.get("twoFactor"))) throw new ApiException(ErrorCode.SERVICE_UNAVAILABLE, "2단계 인증 제공자를 설정해야 합니다.");
        if (section.equals("work-privacy") && data.get("value") instanceof Map<?,?> value && value.containsKey("portfolioVisibility") && !Set.of("private", "link").contains(value.get("portfolioVisibility"))) FeatureInput.fail("포트폴리오 공개 설정은 private/link입니다. 링크는 별도 발급이 필요합니다.");
        if (store.optional(user, FeatureType.SETTING, section).isEmpty()) return store.create(user, FeatureType.SETTING, section, data);
        return store.replace(user, FeatureType.SETTING, section, FeatureInput.version(body), data);
    }
    public Map<String,Object> profile(String user) {
        UserEntity account = account(user);
        var extra = store.optional(user, FeatureType.SETTING, "profile").map(row -> row.get("value")).orElse(Map.of());
        return Map.of("id", account.getId(), "nickname", account.getNickname(), "email", account.getEmail(), "timeZone", account.getTimeZone(), "extra", extra);
    }
    public Map<String,Object> profile(String user, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("nickname", "timeZone", "intro", "mode"));
        String nickname = FeatureInput.requiredText(body, "nickname");
        if (nickname.length() > 80) FeatureInput.fail("닉네임은 최대 80자입니다.");
        String zone = FeatureInput.text(body, "timeZone");
        if (zone.isEmpty()) zone = account(user).getTimeZone();
        try { ZoneId.of(zone); } catch (DateTimeException e) { FeatureInput.fail("유효한 IANA 시간대가 필요합니다."); }
        if (body.get("intro") != null) FeatureInput.requiredText(body, "intro");
        if (body.get("mode") != null) FeatureInput.choice(body, "mode", "J", "P", "B");
        account(user).changeProfile(nickname); account(user).changeTimeZone(zone);
        Map<String,Object> extra = new LinkedHashMap<>();
        for (String key : List.of("intro", "mode")) if (body.containsKey(key)) extra.put(key, body.get(key));
        var previous = store.optional(user, FeatureType.SETTING, "profile");
        if (previous.isEmpty()) store.create(user, FeatureType.SETTING, "profile", Map.of("value", extra));
        else store.replace(user, FeatureType.SETTING, "profile", ((Number) previous.get().get("version")).longValue(), Map.of("value", extra));
        return profile(user);
    }
    public void password(String user, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("currentPassword", "newPassword"));
        UserEntity account = account(user);
        if (!encoder.matches(FeatureInput.requiredText(body, "currentPassword"), account.getPasswordHash())) throw new ApiException(ErrorCode.INVALID_CREDENTIALS);
        String password = FeatureInput.requiredText(body, "newPassword"); passwords.validateOrThrow(password);
        account.changePassword(encoder.encode(password)); tokens.revokeAllActiveByUserId(user, LocalDateTime.now(ZoneOffset.UTC));
    }
    public Map<String,Object> export(String user) {
        Map<String,Object> result = new LinkedHashMap<>();
        result.put("profile", profile(user)); result.put("exportedAt", Instant.now().toString());
        for (FeatureType type : FeatureType.values()) {
            var rows = store.all(user, type); if (!rows.isEmpty()) result.put(type.name().toLowerCase(Locale.ROOT), rows);
        }
        return result;
    }
    public List<Map<String,Object>> sessions(String user) {
        return tokens.findByUserIdOrderByCreatedAtDesc(user).stream().filter(RefreshTokenEntity::isActive).map(token -> {
            Map<String,Object> row = new LinkedHashMap<>(); row.put("id", token.getId()); row.put("deviceId", token.getDeviceId());
            row.put("createdAt", token.getCreatedAt()); row.put("expiresAt", token.getExpiresAt()); row.put("lastUsedAt", token.getLastUsedAt()); return row;
        }).toList();
    }
    public void revokeSession(String user, String id) {
        var token = tokens.findById(id).filter(item -> user.equals(item.getUserId())).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND)); token.revoke();
    }
    public void revokeSessions(String user) { account(user).invalidateSessions(); tokens.revokeAllActiveByUserId(user, LocalDateTime.now(ZoneOffset.UTC)); }
    private UserEntity account(String user) { return users.findById(user).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND)); }
    private void section(String section) { if (!SECTIONS.contains(section)) throw new ApiException(ErrorCode.NOT_FOUND, "지원하지 않는 설정입니다."); }
}
