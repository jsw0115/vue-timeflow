// 비밀번호 링크에 틀린 비밀번호를 동시에 보내도 모든 추측이 세져 10번에서 잠기는지 검증한다.
package kr.timebar.diary.work;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.auth.UserRole;
import kr.timebar.diary.auth.UserStatus;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.TokenHashSupporter;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringJUnitConfig({FeatureTestConfig.class, PortfolioUnlockConcurrencyTest.Beans.class})
class PortfolioUnlockConcurrencyTest {
    @Configuration
    static class Beans {
        // 트랜잭션 프록시를 거친 컨트롤러로 실제 요청과 같은 경계를 쓴다
        @Bean PortfolioLinkController portfolioLinks(FeatureStore store, UserRepository users, PasswordEncoder encoder) { return new PortfolioLinkController(store, users, encoder); }
    }

    @Autowired PortfolioLinkController links;
    @Autowired FeatureStore store;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;

    @Test
    void concurrentWrongPasswordsAreAllCountedAndLockAtTen() throws Exception {
        UserEntity owner = new UserEntity("owner@example.test", "작성자", "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(owner.getId())).thenReturn(Optional.of(owner));
        String token = "A".repeat(43);
        String id = TokenHashSupporter.sha256Hex(token);
        var data = new LinkedHashMap<String, Object>();
        data.put("userId", owner.getId()); data.put("scope", "link"); data.put("itemIds", List.of());
        data.put("expiresAt", Instant.now().plus(Duration.ofDays(1)).toString());
        data.put("passwordHash", encoder.encode("secret-1")); data.put("failedAttempts", 0);
        store.create(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, id, data);

        int guesses = 8;
        ExecutorService pool = Executors.newFixedThreadPool(guesses);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<ErrorCode>> results = new ArrayList<>();
        try {
            for (int i = 0; i < guesses; i++) {
                String guess = "wrong-" + i;
                results.add(pool.submit(() -> {
                    start.await();
                    try { links.unlock(token, Map.of("password", guess)); return null; }
                    catch (ApiException e) { return e.errorCode(); }
                }));
            }
            start.countDown();
            for (var result : results) assertEquals(ErrorCode.INVALID_CREDENTIALS, result.get(30, TimeUnit.SECONDS), "동시 추측도 409 없이 틀린 횟수로 세진다");
        } finally { pool.shutdownNow(); }
        assertEquals(guesses, ((Number) store.get(FeatureStore.SYSTEM, FeatureType.PORTFOLIO_LINK, id).get("failedAttempts")).intValue());

        for (int i = guesses; i < PortfolioLinkController.MAX_FAILED; i++) {
            assertEquals(ErrorCode.INVALID_CREDENTIALS, assertThrows(ApiException.class, () -> links.unlock(token, Map.of("password", "nope"))).errorCode());
        }
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> links.unlock(token, Map.of("password", "secret-1"))).errorCode());
    }
}
