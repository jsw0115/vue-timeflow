package kr.timebar.diary.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * jjwt 0.11.5 기반 Access/Refresh 토큰 발급·검증. 액세스 토큰은 subject=userId, 클레임에
 * email/role을 담고, 리프레시 토큰은 subject만 담아 회전(rotate)·폐기(revoke) 대상 식별에만 쓴다.
 */
@Component
@EnableConfigurationProperties(JwtProperties.class)
public class JwtTokenProvider {
    private final JwtProperties properties;
    private final SecretKey key;

    public JwtTokenProvider(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(String userId, String email, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(userId)
                .setIssuer(properties.getIssuer())
                .claim("email", email)
                .claim("role", role)
                .claim("typ", "access")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(properties.getAccessTtlSeconds())))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String createRefreshToken(String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(userId)
                .setIssuer(properties.getIssuer())
                .claim("typ", "refresh")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(properties.getRefreshTtlSeconds())))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public long accessTtlSeconds() {
        return properties.getAccessTtlSeconds();
    }

    public long refreshTtlSeconds() {
        return properties.getRefreshTtlSeconds();
    }

    /** 서명·만료를 검증하고 클레임을 반환한다. 실패 시 ApiException(TOKEN_INVALID/TOKEN_EXPIRED). */
    public Claims parse(String token) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
        } catch (ExpiredJwtException e) {
            throw new ApiException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            throw new ApiException(ErrorCode.TOKEN_INVALID);
        }
    }
}
