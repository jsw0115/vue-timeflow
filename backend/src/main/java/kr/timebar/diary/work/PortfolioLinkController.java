// 선택한 포트폴리오 항목만 공개 링크로 연다. 링크 공개(만료·검색 차단)와 전체 공개(만료 없음) 두 범위다(Q-22).
package kr.timebar.diary.work;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.*;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class PortfolioLinkController {
    /** 공개 범위(Q-22, 2026-11-22 사용자 결정): public은 누구나(만료 없음·검색 허용), link는 링크를 받은 사람만(만료 있음·검색 차단). */
    public static final Set<String> SCOPES = Set.of("public", "link");
    public static final Set<Integer> LINK_DAYS = Set.of(1, 7, 30);
    public static final int MAX_ACTIVE_LINKS = 20;
    /** 링크 공개의 선택 비밀번호(Q-39). 길이 4~100자, 틀린 횟수 10번이면 그 링크를 잠근다. 원문에 없는 제안값이다. */
    public static final int PASSWORD_MIN = 4, PASSWORD_MAX = 100, MAX_FAILED = 10;
    /** 공개 화면에 보이는 필드(PR-26). 근거 연결 ID(activityIds·experienceId)와 새로 생길 내부 필드는 내보내지 않는다. */
    public static final List<String> PUBLIC_FIELDS = List.of("title", "kind", "body", "role", "stack", "problem", "process", "outcome", "contribution", "links");
    private final FeatureStore store;
    private final kr.timebar.diary.auth.UserRepository users;
    private final org.springframework.security.crypto.password.PasswordEncoder encoder;
    public PortfolioLinkController(FeatureStore store, kr.timebar.diary.auth.UserRepository users, org.springframework.security.crypto.password.PasswordEncoder encoder) { this.store = store; this.users = users; this.encoder = encoder; }

    /**
     * 고른 포트폴리오 항목만 여는 링크를 만든다. 링크 공개의 주소(토큰)는 해시만 저장해 이 응답에서 한 번만 보인다.
     * 전체 공개는 누구나 보라고 여는 것이라 목록에서 주소를 다시 보이도록 토큰을 함께 저장한다.
     */
    @PostMapping("/work/portfolio-links")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> create(@RequestBody Map<String,Object> body) {
        if (body == null) FeatureInput.fail("요청 본문이 필요합니다.");
        var input = new LinkedHashMap<String,Object>(body);
        String scope = Objects.toString(input.remove("scope"), "link");
        Object daysValue = input.remove("expiresInDays");
        Object passwordValue = input.remove("password");
        if (!SCOPES.contains(scope)) FeatureInput.fail("공개 범위는 public 또는 link입니다.");
        // 비밀번호는 링크 공개에만 받는다(Q-39). 원문은 저장하지 않고 해시만 남긴다
        String password = null;
        if (passwordValue != null) {
            if (!scope.equals("link")) FeatureInput.fail("비밀번호는 링크 공개에만 걸 수 있어요.");
            if (!(passwordValue instanceof String text) || text.length() < PASSWORD_MIN || text.length() > PASSWORD_MAX) FeatureInput.fail("비밀번호는 " + PASSWORD_MIN + "~" + PASSWORD_MAX + "자로 정해 주세요.");
            password = (String) passwordValue;
        }
        int days = 7;
        if (daysValue != null) {
            if (!(daysValue instanceof Number number) || number.doubleValue() != number.intValue() || !LINK_DAYS.contains(number.intValue())) FeatureInput.fail("링크 유효 기간은 1·7·30일 중 하나입니다.");
            days = ((Number) daysValue).intValue();
        }
        var data = FeatureInput.validate(FeatureType.PORTFOLIO_LINK, input);
        String user = CurrentUser.id();
        for (Object id : (List<?>)data.get("itemIds")) store.get(user, FeatureType.PORTFOLIO, id.toString());
        if (active(user).size() >= MAX_ACTIVE_LINKS) throw new ApiException(ErrorCode.CONFLICT, "열어 둔 공개 링크는 " + MAX_ACTIVE_LINKS + "개까지예요. 쓰지 않는 링크를 먼저 닫아 주세요.");
        byte[] random = new byte[32]; new SecureRandom().nextBytes(random); String token = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        String hash = TokenHashSupporter.sha256Hex(token);
        data.put("userId", user); data.put("scope", scope);
        String expiry = null;
        if (scope.equals("link")) { expiry = Instant.now().plus(Duration.ofDays(days)).toString(); data.put("expiresAt", expiry); }
        if (password != null) { data.put("passwordHash", encoder.encode(password)); data.put("failedAttempts", 0); }
        else data.put("publicToken", token);
        var row = store.create(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, hash, data);
        var result = new LinkedHashMap<String,Object>(view(row));
        result.put("token", token); result.put("url", "/api/public/portfolios/" + token);
        return ApiResponse.ok(result);
    }

    /** 내가 만든 링크 중 아직 열려 있는 것. 링크 공개는 주소를 다시 보이지 않는다(해시만 있음). */
    @GetMapping("/work/portfolio-links")
    public ApiResponse<?> list() {
        return ApiResponse.ok(active(CurrentUser.id()).stream().map(PortfolioLinkController::view).toList());
    }

    @DeleteMapping("/work/portfolio-links/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable String id) {
        var row = store.get(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, id);
        if (!CurrentUser.id().equals(row.get("userId"))) throw new ApiException(ErrorCode.NOT_FOUND);
        store.delete(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, id, ((Number)row.get("version")).longValue());
    }

    /** 공개 조회. 만료·닫힘·계정 비활성·형식 오류는 모두 같은 404다. scope로 화면이 검색 허용 여부를 정한다. 비밀번호가 걸린 링크는 항목 없이 protected=true만 돌려준다. */
    @GetMapping("/public/portfolios/{token}")
    public ApiResponse<?> read(@PathVariable String token) {
        var row = openLink(token);
        if (row.get("passwordHash") != null) {
            var result = new LinkedHashMap<String,Object>();
            result.put("items", List.of()); result.put("scope", scope(row)); result.put("protected", true);
            if (row.get("expiresAt") != null) result.put("expiresAt", row.get("expiresAt"));
            return ApiResponse.ok(result);
        }
        return ApiResponse.ok(content(row));
    }

    /** 비밀번호가 걸린 링크 열기(Q-39). 틀리면 401, 틀린 횟수가 10번이 되면 링크를 잠가 403이다. 비밀번호 없는 링크는 바로 내용을 준다. */
    @PostMapping("/public/portfolios/{token}/unlock")
    @Transactional(noRollbackFor = ApiException.class)
    public ApiResponse<?> unlock(@PathVariable String token, @RequestBody(required = false) Map<String,Object> body) {
        var row = openLink(token);
        if (row.get("passwordHash") == null) return ApiResponse.ok(content(row));
        // 틀린 횟수는 행을 잠근 채 다시 읽고 센다. 동시에 보낸 추측이 버전 충돌(409)로 빠져 세지지 않으면 잠금을 넘길 수 있다
        row = store.lock(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, row.get("id").toString());
        int failed = row.get("failedAttempts") instanceof Number n ? n.intValue() : 0;
        if (failed >= MAX_FAILED) throw new ApiException(ErrorCode.FORBIDDEN, "비밀번호를 여러 번 틀려 이 링크를 잠갔어요. 링크를 보낸 사람에게 새 링크를 받아 주세요.");
        String password = body == null ? "" : Objects.toString(body.get("password"), "");
        if (password.isEmpty() || password.length() > PASSWORD_MAX || !encoder.matches(password, row.get("passwordHash").toString())) {
            var data = new LinkedHashMap<String,Object>(FeatureStore.payload(row)); data.put("failedAttempts", failed + 1);
            store.replace(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, row.get("id").toString(), ((Number) row.get("version")).longValue(), data);
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "비밀번호가 맞지 않아요.");
        }
        var result = new LinkedHashMap<String,Object>(content(row)); result.put("protected", true);
        return ApiResponse.ok(result);
    }

    /** 열 수 있는 링크. 만료·닫힘·계정 비활성·형식 오류는 같은 404다. */
    private Map<String,Object> openLink(String token) {
        if (!token.matches("[A-Za-z0-9_-]{43}")) throw new ApiException(ErrorCode.NOT_FOUND);
        var row = store.get(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, TokenHashSupporter.sha256Hex(token));
        if (users.findById(row.get("userId").toString()).filter(kr.timebar.diary.auth.UserEntity::isActive).isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND);
        if (expired(row)) throw new ApiException(ErrorCode.NOT_FOUND);
        return row;
    }

    private Map<String,Object> content(Map<String,Object> row) {
        List<Map<String,Object>> items = new ArrayList<>();
        for (Object id : (List<?>)row.get("itemIds")) store.optional(row.get("userId").toString(), FeatureType.PORTFOLIO, id.toString()).ifPresent(item -> items.add(publicView(item)));
        var result = new LinkedHashMap<String,Object>();
        result.put("items", items); result.put("scope", scope(row));
        if (row.get("expiresAt") != null) result.put("expiresAt", row.get("expiresAt"));
        return result;
    }

    private static Map<String,Object> publicView(Map<String,Object> item) {
        var result = new LinkedHashMap<String,Object>();
        for (String key : PUBLIC_FIELDS) if (item.get(key) != null) result.put(key, item.get(key));
        return result;
    }

    private List<Map<String,Object>> active(String user) {
        return store.all(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK).stream().filter(row -> user.equals(row.get("userId")) && !expired(row)).toList();
    }
    private static boolean expired(Map<String,Object> row) {
        return row.get("expiresAt") != null && !Instant.parse(row.get("expiresAt").toString()).isAfter(Instant.now());
    }
    /** 범위가 없는 예전 링크는 링크 공개다. */
    private static String scope(Map<String,Object> row) { return "public".equals(row.get("scope")) ? "public" : "link"; }
    private static Map<String,Object> view(Map<String,Object> row) {
        var result = new LinkedHashMap<String,Object>();
        result.put("id", row.get("id")); result.put("scope", scope(row)); result.put("itemIds", row.get("itemIds"));
        if (row.get("expiresAt") != null) result.put("expiresAt", row.get("expiresAt"));
        if (row.get("createdAt") != null) result.put("createdAt", row.get("createdAt"));
        if ("public".equals(row.get("scope")) && row.get("publicToken") != null) result.put("token", row.get("publicToken"));
        // 비밀번호 자체나 해시는 내보내지 않고 걸려 있는지만 알린다
        result.put("protected", row.get("passwordHash") != null);
        return result;
    }
}
