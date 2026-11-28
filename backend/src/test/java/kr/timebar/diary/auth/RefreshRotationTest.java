// refresh 토큰이 한 번만 소비되고 비밀번호 변경·강제 로그아웃 이전 세션과 옛 토큰을 거부하는지 검증한다.
package kr.timebar.diary.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.TokenHashSupporter;
import kr.timebar.diary.security.JwtProperties;
import kr.timebar.diary.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class RefreshRotationTest {
    private static final String SECRET = "test-secret-at-least-32-bytes-long";
    private final UserRepository users = mock(UserRepository.class);
    private final RefreshTokenRepository tokens = mock(RefreshTokenRepository.class);
    private JwtTokenProvider provider;
    private AuthService auth;
    private UserEntity user;

    @BeforeEach
    void setup() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret(SECRET);
        provider = new JwtTokenProvider(properties);
        auth = new AuthService(users, tokens, mock(LoginThrottleRepository.class), new BCryptPasswordEncoder(), new PasswordPolicy(), provider);
        user = new UserEntity("user@example.test", "사용자", "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
    }

    private String storeFor(String ownerId, String token) {
        String hash = TokenHashSupporter.sha256Hex(token);
        when(tokens.findByTokenHash(hash)).thenReturn(Optional.of(new RefreshTokenEntity(ownerId, hash, LocalDateTime.now().plusDays(1))));
        return hash;
    }

    private ErrorCode refreshError(String token) {
        return assertThrows(ApiException.class, () -> auth.refresh(token)).errorCode();
    }

    @Test
    void rotatesOnceAndCarriesCurrentAccountVersion() {
        String token = provider.createRefreshToken(user.getId(), user.getAuthVersion());
        String hash = storeFor(user.getId(), token);
        when(tokens.revokeByTokenHash(eq(hash), any())).thenReturn(1);

        var pair = auth.refresh(token);

        assertEquals(user.getAuthVersion(), provider.parse(pair.refreshToken()).get("av", Number.class).longValue());
        verify(tokens).save(any(RefreshTokenEntity.class));
    }

    @Test
    void concurrentOrAlreadyRevokedConsumeIsRejected() {
        String token = provider.createRefreshToken(user.getId(), user.getAuthVersion());
        String hash = storeFor(user.getId(), token);
        when(tokens.revokeByTokenHash(eq(hash), any())).thenReturn(0);

        assertEquals(ErrorCode.TOKEN_EXPIRED, refreshError(token));
        verify(tokens, never()).save(any());
    }

    @Test
    void tokenIssuedBeforePasswordChangeIsRejected() {
        String token = provider.createRefreshToken(user.getId(), user.getAuthVersion());
        storeFor(user.getId(), token);
        user.changePassword("new-hash");

        assertEquals(ErrorCode.TOKEN_EXPIRED, refreshError(token));
        verify(tokens, never()).revokeByTokenHash(any(), any());
        verify(tokens, never()).save(any());
    }

    @Test
    void legacyTokenWithoutAccountVersionIsRejected() {
        String legacy = Jwts.builder()
                .setSubject(user.getId())
                .claim("typ", "refresh")
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                .compact();
        storeFor(user.getId(), legacy);

        assertEquals(ErrorCode.TOKEN_EXPIRED, refreshError(legacy));
        verify(tokens, never()).save(any());
    }

    @Test
    void storedRowOfAnotherUserIsRejected() {
        String token = provider.createRefreshToken(user.getId(), user.getAuthVersion());
        storeFor("other-user", token);

        assertEquals(ErrorCode.TOKEN_INVALID, refreshError(token));
        verify(tokens, never()).save(any());
    }
}
