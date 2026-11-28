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
    /** 표시 언어(PR-32). 기본은 한국어(DESIGN.md Voice and microcopy). */
    public static final List<String> LOCALES = List.of("ko", "en");
    public static final Set<String> SECTIONS = Set.of("general", "categories", "notifications", "share-visibility", "theme-sticker", "appearance", "mode-profiles", "form-style", "dashboard", "stats-portlets", "automation", "ai", "work-privacy", "security", "widgets", "integrations", "career");
    /** 커리어 목표(docs/design 03 §5). 첫 화면 위젯 순서만 바꾸고 권한·공개 범위는 바꾸지 않는다. */
    public static final Set<String> CAREER_GOALS = Set.of("job-seeker", "job-changer", "employee", "project-member");
    private final FeatureStore store;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final PasswordPolicy passwords;
    private final RefreshTokenRepository tokens;
    private final LoginThrottleRepository throttles;
    public SettingsService(FeatureStore store, UserRepository users, PasswordEncoder encoder, PasswordPolicy passwords, RefreshTokenRepository tokens, LoginThrottleRepository throttles) {
        this.store = store; this.users = users; this.encoder = encoder; this.passwords = passwords; this.tokens = tokens; this.throttles = throttles;
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
        if (section.equals("career") && data.get("value") instanceof Map<?,?> value && value.get("goal") != null && !CAREER_GOALS.contains(value.get("goal"))) FeatureInput.fail("커리어 목표 값을 확인해주세요.");
        // 표시 언어(PR-32 1단계). 화면 문구만 바꾸고 저장된 기록은 바꾸지 않는다
        if (section.equals("general") && data.get("value") instanceof Map<?,?> value && value.get("locale") != null && !LOCALES.contains(value.get("locale"))) FeatureInput.fail("표시 언어는 ko 또는 en입니다.");
        // 랭킹 참여(PR-19 UF-136). false면 다른 회원의 챌린지 랭킹 응답에서 빠진다(ChallengeService.ranking)
        if (section.equals("share-visibility") && data.get("value") instanceof Map<?,?> value && value.containsKey("rankingVisible") && !(value.get("rankingVisible") instanceof Boolean)) FeatureInput.fail("랭킹 참여 값은 true 또는 false입니다.");
        // 마감 알림 시점(Q-32). 서버 DueReminders가 같은 허용값으로 읽는다
        if (section.equals("notifications") && data.get("value") instanceof Map<?,?> value) {
            if (value.containsKey("dueReminders") && !(value.get("dueReminders") instanceof Boolean)) FeatureInput.fail("마감 알림 켜기 값은 true 또는 false입니다.");
            if (value.containsKey("dueLeadMinutes") && !(value.get("dueLeadMinutes") instanceof Number n && n.doubleValue() == n.intValue() && kr.timebar.diary.records.DueReminders.LEAD_MINUTES.contains(n.intValue()))) FeatureInput.fail("할 일 마감 알림 시점은 0·10·30·60·180·1440분 전 중 하나입니다.");
            if (value.containsKey("applicationLeadDays") && !(value.get("applicationLeadDays") instanceof Number n && n.doubleValue() == n.intValue() && kr.timebar.diary.records.DueReminders.LEAD_DAYS.contains(n.intValue()))) FeatureInput.fail("지원 일정 알림 시점은 0·1·3·7일 전 중 하나입니다.");
        }
        if (store.optional(user, FeatureType.SETTING, section).isEmpty()) return store.create(user, FeatureType.SETTING, section, data);
        return store.replace(user, FeatureType.SETTING, section, FeatureInput.version(body), data);
    }
    public Map<String,Object> profile(String user) {
        UserEntity account = account(user);
        var extra = store.optional(user, FeatureType.SETTING, "profile").map(row -> row.get("value")).orElse(Map.of());
        return Map.of("id", account.getId(), "nickname", account.getNickname(), "email", account.getEmail(), "timeZone", account.getTimeZone(), "extra", extra);
    }
    public Map<String,Object> profile(String user, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("nickname", "timeZone", "intro", "mode", "dayStartHour"));
        String nickname = FeatureInput.requiredText(body, "nickname");
        if (nickname.length() > 80) FeatureInput.fail("닉네임은 최대 80자입니다.");
        String zone = FeatureInput.text(body, "timeZone");
        if (zone.isEmpty()) zone = account(user).getTimeZone();
        try { ZoneId.of(zone); } catch (DateTimeException e) { FeatureInput.fail("유효한 IANA 시간대가 필요합니다."); }
        if (body.get("intro") != null) FeatureInput.requiredText(body, "intro");
        if (body.get("mode") != null) FeatureInput.choice(body, "mode", "J", "P", "B");
        // 하루 경계는 0~6시 정시 하나다. 날짜 배정에만 쓰고 저장된 시각은 바꾸지 않는다(Q-12)
        if (body.get("dayStartHour") != null) FeatureInput.number(body, "dayStartHour", 0, kr.timebar.diary.records.DayPolicy.MAX_START_HOUR, true);
        account(user).changeProfile(nickname); account(user).changeTimeZone(zone);
        Map<String,Object> extra = new LinkedHashMap<>();
        for (String key : List.of("intro", "mode", "dayStartHour")) if (body.containsKey(key)) extra.put(key, body.get(key));
        var previous = store.optional(user, FeatureType.SETTING, "profile");
        if (previous.isEmpty()) store.create(user, FeatureType.SETTING, "profile", Map.of("value", extra));
        else store.replace(user, FeatureType.SETTING, "profile", ((Number) previous.get().get("version")).longValue(), Map.of("value", extra));
        return profile(user);
    }
    /**
     * 현재 비밀번호를 확인하고 바꾼다. 확인 실패는 로그인과 따로 계정별로 세어 5번 틀리면 15분 동안 변경만 막는다(로그인은 막지 않는다).
     * 계정 행을 잠가 같은 계정의 시도를 한 줄로 세운다. 실패 횟수가 남도록 오류 응답에도 커밋한다.
     */
    @Transactional(noRollbackFor = ApiException.class)
    public void password(String user, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("currentPassword", "newPassword"));
        UserEntity account = users.findByIdForUpdate(user).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        LoginThrottleEntity throttle = throttles.findForUpdate(ThrottleKeyType.PASSWORD, user).orElseGet(() -> new LoginThrottleEntity(ThrottleKeyType.PASSWORD, user));
        if (throttle.isLocked()) throw new ApiException(ErrorCode.ACCOUNT_LOCKED, "현재 비밀번호를 여러 번 틀려 비밀번호 변경을 잠시 막았어요. 15분 뒤에 다시 시도해 주세요.");
        if (!encoder.matches(FeatureInput.requiredText(body, "currentPassword"), account.getPasswordHash())) {
            throttle.recordFailure(); throttles.save(throttle);
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (throttle.getFailCount() > 0) { throttle.recordSuccess(); throttles.save(throttle); }
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
