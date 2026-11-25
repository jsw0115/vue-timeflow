// 선택한 포트폴리오 항목만 공개 링크로 연다. 링크 공개(만료·검색 차단)와 전체 공개(만료 없음) 두 범위다(Q-22).
package kr.timebar.diary.work;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.*;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
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
    /** 공개 화면에 보이는 필드(PR-26). 근거 연결 ID(activityIds·experienceId)와 새로 생길 내부 필드는 내보내지 않는다. */
    public static final List<String> PUBLIC_FIELDS = List.of("title", "kind", "body", "role", "stack", "problem", "process", "outcome", "contribution", "links");
    private final FeatureStore store;
    private final kr.timebar.diary.auth.UserRepository users;
    public PortfolioLinkController(FeatureStore store, kr.timebar.diary.auth.UserRepository users) { this.store = store; this.users = users; }

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
        if (!SCOPES.contains(scope)) FeatureInput.fail("공개 범위는 public 또는 link입니다.");
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

    /** 공개 조회. 만료·닫힘·계정 비활성·형식 오류는 모두 같은 404다. scope로 화면이 검색 허용 여부를 정한다. */
    @GetMapping("/public/portfolios/{token}")
    public ApiResponse<?> read(@PathVariable String token) {
        if (!token.matches("[A-Za-z0-9_-]{43}")) throw new ApiException(ErrorCode.NOT_FOUND);
        var row = store.get(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, TokenHashSupporter.sha256Hex(token));
        if (users.findById(row.get("userId").toString()).filter(kr.timebar.diary.auth.UserEntity::isActive).isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND);
        if (expired(row)) throw new ApiException(ErrorCode.NOT_FOUND);
        List<Map<String,Object>> items = new ArrayList<>();
        for (Object id : (List<?>)row.get("itemIds")) store.optional(row.get("userId").toString(), FeatureType.PORTFOLIO, id.toString()).ifPresent(item -> items.add(publicView(item)));
        var result = new LinkedHashMap<String,Object>();
        result.put("items", items); result.put("scope", scope(row));
        if (row.get("expiresAt") != null) result.put("expiresAt", row.get("expiresAt"));
        return ApiResponse.ok(result);
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
        return result;
    }
}
