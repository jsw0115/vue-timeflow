package kr.timebar.diary.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtConfigurationTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"short", "1234567890123456789012345678901"})
    void missingOrWeakSecretHasClearConfigurationError(String secret) {
        JwtProperties properties = new JwtProperties();
        properties.setSecret(secret);
        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> new JwtTokenProvider(properties));
        assertEquals("JWT_SECRET를 UTF-8 32바이트 이상으로 설정해주세요.", error.getMessage());
    }

    @Test
    void legacyUuidRemainsTheAuthenticatedSubject() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("unit-test-signing-secret-32-bytes-minimum");
        JwtTokenProvider provider = new JwtTokenProvider(properties);
        String userId = "6e41b3ca-ec09-4a7b-a42a-cfb41525e3c7";
        String token = provider.createAccessToken(userId, "fixture@example.test", "USER");
        assertEquals(userId, provider.parse(token).getSubject());
    }
}
