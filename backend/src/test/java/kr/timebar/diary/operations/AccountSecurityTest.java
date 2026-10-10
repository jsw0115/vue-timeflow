// 관리자 권한 변경과 강제 로그아웃 이후 기존 JWT 폐기를 검증한다.
package kr.timebar.diary.operations;

import kr.timebar.diary.auth.*;
import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.*;
import kr.timebar.diary.security.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class AccountSecurityTest {
    @Autowired AdminService admin;
    @Autowired UserRepository users;
    @Autowired FeatureStore store;
    @Autowired RefreshTokenRepository tokens;
    UserEntity operator, user;
    JwtTokenProvider provider;
    @BeforeEach void setup() {
        operator = new UserEntity("admin@example.test", "관리자", "hash", UserRole.ADMIN, UserStatus.ACTIVE);
        user = new UserEntity("user@example.test", "사용자", "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(operator.getId())).thenReturn(Optional.of(operator)); when(users.findById(user.getId())).thenReturn(Optional.of(user));
        when(users.findAll()).thenReturn(List.of(operator, user));
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(operator.getId(), operator.getEmail(), "ADMIN"), null, List.of()));
        JwtProperties properties = new JwtProperties(); properties.setSecret("test-secret-at-least-32-bytes-long"); provider = new JwtTokenProvider(properties);
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @Test void forceLogoutRejectsExistingAccessTokenAndRevokesRefreshTokens() throws Exception {
        String token = provider.createAccessToken(user.getId(), user.getEmail(), "USER", user.getAuthVersion());
        assertTrue(authenticated(token));
        admin.logout(user.getId()); verify(tokens).revokeAllActiveByUserId(eq(user.getId()), any());
        assertFalse(authenticated(token));
        assertTrue(authenticated(provider.createAccessToken(user.getId(), user.getEmail(), "USER", user.getAuthVersion())));
    }
    @Test void suspensionAndRoleChangesInvalidateAccessTokensAndWriteAudit() throws Exception {
        String token = provider.createAccessToken(user.getId(), user.getEmail(), "USER", user.getAuthVersion());
        admin.updateUser(user.getId(), Map.of("status", "SUSPENDED"));
        assertFalse(user.isActive()); assertFalse(authenticated(token));
        assertTrue(store.all(FeatureStore.SYSTEM, FeatureType.AUDIT).stream().anyMatch(row -> user.getId().equals(row.get("target"))));
    }
    @Test void normalUserOrStaleAdminPrincipalCannotAdministerAccounts() {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user.getId(), user.getEmail(), "ADMIN"), null, List.of()));
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> admin.getUser(operator.getId())).errorCode());
    }
    @Test void administratorCannotDeleteTheirOwnAccount() { assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class, () -> admin.deleteUser(operator.getId())).errorCode()); }
    private boolean authenticated(String token) throws Exception {
        var original = SecurityContextHolder.getContext().getAuthentication(); SecurityContextHolder.clearContext();
        MockHttpServletRequest request = new MockHttpServletRequest(); request.addHeader("Authorization", "Bearer " + token);
        new JwtAuthenticationFilter(provider, users).doFilter(request, new MockHttpServletResponse(), (req, res) -> { });
        boolean result = SecurityContextHolder.getContext().getAuthentication() != null;
        SecurityContextHolder.getContext().setAuthentication(original); return result;
    }
}
