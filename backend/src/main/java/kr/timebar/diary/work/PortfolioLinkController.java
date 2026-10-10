// 선택한 포트폴리오 항목만 만료 가능한 비밀 링크로 공개한다.
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
    private final FeatureStore store;
    private final kr.timebar.diary.auth.UserRepository users;
    public PortfolioLinkController(FeatureStore store, kr.timebar.diary.auth.UserRepository users) { this.store = store; this.users = users; }
    @PostMapping("/work/portfolio-links")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> create(@RequestBody Map<String,Object> body) {
        var data = FeatureInput.validate(FeatureType.PORTFOLIO_LINK, body);
        String user = CurrentUser.id();
        for (Object id : (List<?>)data.get("itemIds")) store.get(user, FeatureType.PORTFOLIO, id.toString());
        byte[] random = new byte[32]; new SecureRandom().nextBytes(random); String token = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        String hash = TokenHashSupporter.sha256Hex(token), expiry = Instant.now().plus(Duration.ofDays(7)).toString();
        data.put("userId", user); data.put("expiresAt", expiry);
        store.create(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, hash, data);
        return ApiResponse.ok(Map.of("id", hash, "token", token, "url", "/api/public/portfolios/" + token, "expiresAt", expiry));
    }
    @DeleteMapping("/work/portfolio-links/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable String id) {
        var row = store.get(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, id);
        if (!CurrentUser.id().equals(row.get("userId"))) throw new ApiException(ErrorCode.NOT_FOUND);
        store.delete(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, id, ((Number)row.get("version")).longValue());
    }
    @GetMapping("/public/portfolios/{token}")
    public ApiResponse<?> read(@PathVariable String token) {
        if (!token.matches("[A-Za-z0-9_-]{43}")) throw new ApiException(ErrorCode.NOT_FOUND);
        var row = store.get(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, TokenHashSupporter.sha256Hex(token));
        if (users.findById(row.get("userId").toString()).filter(kr.timebar.diary.auth.UserEntity::isActive).isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND);
        if (!Instant.parse(row.get("expiresAt").toString()).isAfter(Instant.now())) throw new ApiException(ErrorCode.NOT_FOUND);
        List<Map<String,Object>> items = new ArrayList<>();
        for (Object id : (List<?>)row.get("itemIds")) store.optional(row.get("userId").toString(), FeatureType.PORTFOLIO, id.toString()).ifPresent(item -> items.add(FeatureStore.payload(item)));
        return ApiResponse.ok(Map.of("items", items));
    }
}
