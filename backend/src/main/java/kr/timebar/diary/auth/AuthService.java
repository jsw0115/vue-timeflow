package kr.timebar.diary.auth;

import io.jsonwebtoken.Claims;
import kr.timebar.diary.auth.dto.LoginRequest;
import kr.timebar.diary.auth.dto.LoginResponse;
import kr.timebar.diary.auth.dto.MeResponse;
import kr.timebar.diary.auth.dto.SignupRequest;
import kr.timebar.diary.auth.dto.SignupResponse;
import kr.timebar.diary.auth.dto.TokenPairResponse;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.TokenHashSupporter;
import kr.timebar.diary.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginThrottleRepository loginThrottleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
            LoginThrottleRepository loginThrottleRepository, PasswordEncoder passwordEncoder,
            PasswordPolicy passwordPolicy, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.loginThrottleRepository = loginThrottleRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    @Transactional("authTransactionManager")
    public SignupResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(ErrorCode.DUPLICATE_EMAIL);
        }
        passwordPolicy.validateOrThrow(request.password());
        UserEntity user = new UserEntity(email, request.nickname().trim(), passwordEncoder.encode(request.password()), UserRole.USER, UserStatus.ACTIVE);
        userRepository.save(user);
        return new SignupResponse(user.getEmail(), user.getNickname(), user.getRole().name());
    }

    @Transactional("authTransactionManager")
    public LoginResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        LoginThrottleEntity emailThrottle = loginThrottleRepository.findForUpdate(ThrottleKeyType.EMAIL, email)
                .orElseGet(() -> new LoginThrottleEntity(ThrottleKeyType.EMAIL, email));
        if (emailThrottle.isLocked()) {
            throw new ApiException(ErrorCode.ACCOUNT_LOCKED);
        }

        UserEntity user = userRepository.findByEmail(email).orElse(null);
        boolean passwordMatches = user != null && passwordEncoder.matches(request.password(), user.getPasswordHash());
        if (!passwordMatches) {
            emailThrottle.recordFailure();
            loginThrottleRepository.save(emailThrottle);
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (!user.isActive()) {
            throw new ApiException(ErrorCode.ACCOUNT_DISABLED);
        }

        emailThrottle.recordSuccess();
        loginThrottleRepository.save(emailThrottle);
        user.recordLogin();

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = issueRefreshToken(user.getId());
        return new LoginResponse(user.getId(), user.getEmail(), user.getNickname(), user.getRole().name(), accessToken, refreshToken);
    }

    @Transactional("authTransactionManager")
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return;
        refreshTokenRepository.revokeByTokenHash(TokenHashSupporter.sha256Hex(refreshToken), LocalDateTime.now());
    }

    @Transactional("authTransactionManager")
    public TokenPairResponse refresh(String refreshToken) {
        Claims claims = jwtTokenProvider.parse(refreshToken);
        if (!"refresh".equals(claims.get("typ", String.class))) {
            throw new ApiException(ErrorCode.TOKEN_INVALID);
        }
        String tokenHash = TokenHashSupporter.sha256Hex(refreshToken);
        RefreshTokenEntity stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException(ErrorCode.TOKEN_INVALID));
        if (!stored.isActive()) {
            throw new ApiException(ErrorCode.TOKEN_EXPIRED);
        }
        String userId = claims.getSubject();
        UserEntity user = userRepository.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.TOKEN_INVALID));
        if (!user.isActive()) {
            throw new ApiException(ErrorCode.ACCOUNT_DISABLED);
        }

        stored.revoke();
        refreshTokenRepository.save(stored);

        String newAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = issueRefreshToken(user.getId());
        return new TokenPairResponse(newAccessToken, newRefreshToken);
    }

    @Transactional(value = "authTransactionManager", readOnly = true)
    public MeResponse me(String userId) {
        UserEntity user = userRepository.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        return new MeResponse(user.getId(), user.getEmail(), user.getNickname(), user.getRole().name());
    }

    private String issueRefreshToken(String userId) {
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);
        RefreshTokenEntity entity = new RefreshTokenEntity(
                userId,
                TokenHashSupporter.sha256Hex(refreshToken),
                LocalDateTime.now().plusSeconds(jwtTokenProvider.refreshTtlSeconds()));
        refreshTokenRepository.save(entity);
        return refreshToken;
    }
}
