// 표시 언어(PR-32 1단계): general 구역의 locale은 ko·en만 받고, 같은 구역의 다른 값과 함께 저장된다.
package kr.timebar.diary.operations;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureTestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class SettingsLocaleTest {
    @Autowired SettingsService settings;

    @Test void acceptsKnownLocalesAndKeepsOtherValues() {
        String me = UUID.randomUUID().toString();
        var saved = settings.save(me, "general", new HashMap<>(Map.of("value", Map.of("locale", "en", "weekStart", "mon"))));
        assertEquals(Map.of("locale", "en", "weekStart", "mon"), saved.get("value"));
        var again = settings.save(me, "general", new HashMap<>(Map.of("value", Map.of("locale", "ko", "weekStart", "mon"), "version", saved.get("version"))));
        assertEquals("ko", ((Map<?, ?>) again.get("value")).get("locale"));
    }

    @Test void rejectsUnknownLocale() {
        String me = UUID.randomUUID().toString();
        for (Object bad : List.of("ja", "EN", 1)) {
            var error = assertThrows(ApiException.class, () -> settings.save(me, "general", new HashMap<>(Map.of("value", Map.of("locale", bad)))));
            assertEquals(ErrorCode.VALIDATION_FAILED, error.errorCode());
        }
    }
}
