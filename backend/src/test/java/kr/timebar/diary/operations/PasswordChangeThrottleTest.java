// 비밀번호 변경의 현재 비밀번호 확인이 로그인과 따로 5번 실패에 15분 잠기고, 맞히면 횟수를 되돌리는지 검증한다.
package kr.timebar.diary.operations;

import kr.timebar.diary.auth.*;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PasswordChangeThrottleTest {
    private final UserRepository users = mock(UserRepository.class);
    private final RefreshTokenRepository tokens = mock(RefreshTokenRepository.class);
    private final LoginThrottleRepository throttles = mock(LoginThrottleRepository.class);
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final SettingsService service = new SettingsService(mock(FeatureStore.class), users, encoder, new PasswordPolicy(), tokens, throttles);
    private final UserEntity account = new UserEntity("me@example.test", "나", encoder.encode("current-pass-1"), UserRole.USER, UserStatus.ACTIVE);
    private LoginThrottleEntity stored;

    @BeforeEach
    void setUp() {
        when(users.findByIdForUpdate(account.getId())).thenReturn(Optional.of(account));
        when(throttles.findForUpdate(ThrottleKeyType.PASSWORD, account.getId())).thenAnswer(call -> Optional.ofNullable(stored));
        when(throttles.save(any())).thenAnswer(call -> stored = call.getArgument(0));
    }

    private ErrorCode change(String current) {
        try { service.password(account.getId(), Map.of("currentPassword", current, "newPassword", "new-pass-123")); return null; }
        catch (ApiException e) { return e.errorCode(); }
    }

    @Test
    void fiveWrongCurrentPasswordsLockPasswordChangeEvenForTheRightOne() {
        String hash = account.getPasswordHash();
        for (int i = 1; i <= LoginThrottleEntity.MAX_ATTEMPTS; i++) assertEquals(ErrorCode.INVALID_CREDENTIALS, change("wrong-" + i));
        assertTrue(stored.isLocked());
        assertEquals(ErrorCode.ACCOUNT_LOCKED, change("current-pass-1"), "잠긴 동안에는 맞는 비밀번호로도 바꾸지 못한다");
        assertEquals(hash, account.getPasswordHash());
        verify(tokens, never()).revokeAllActiveByUserId(any(), any());
        verify(throttles, never()).findForUpdate(eq(ThrottleKeyType.EMAIL), any());
        verify(throttles, never()).findForUpdate(eq(ThrottleKeyType.IP), any());
    }

    @Test
    void rightPasswordBeforeTheLimitResetsTheCountAndChanges() {
        for (int i = 1; i < LoginThrottleEntity.MAX_ATTEMPTS; i++) assertEquals(ErrorCode.INVALID_CREDENTIALS, change("wrong-" + i));
        assertNull(change("current-pass-1"));
        assertEquals(0, stored.getFailCount());
        assertTrue(encoder.matches("new-pass-123", account.getPasswordHash()));
        verify(tokens).revokeAllActiveByUserId(eq(account.getId()), any());
    }

    @Test
    void firstSuccessDoesNotCreateAThrottleRow() {
        assertNull(change("current-pass-1"));
        verify(throttles, never()).save(any());
    }
}
