// 경력 상세 필드(PR-24, REQ-F25): 고용 형태·재직 상태 허용값, 기간 순서, 재직 중·종료와 종료일의 관계를 검사한다. 예전 자유 기간은 그대로 받는다.
package kr.timebar.diary.feature;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class CareerDetailInputTest {
    private static Map<String, Object> career(Object... pairs) {
        var body = new LinkedHashMap<String, Object>(Map.of("title", "결제 서비스", "role", "프런트엔드"));
        for (int i = 0; i < pairs.length; i += 2) body.put((String) pairs[i], pairs[i + 1]);
        return body;
    }
    private static ErrorCode error(Map<String, Object> body) { return assertThrows(ApiException.class, () -> FeatureInput.validate(FeatureType.CAREER, body)).errorCode(); }

    @Test void acceptsDetailedAndLegacyCareers() {
        assertEquals("intern", FeatureInput.validate(FeatureType.CAREER, career("employmentType", "intern", "department", "결제팀", "startDate", "2025-07-01", "endDate", "2025-12-31", "employmentStatus", "ended")).get("employmentType"));
        assertEquals("current", FeatureInput.validate(FeatureType.CAREER, career("employmentType", "full-time", "startDate", "2026-01-02", "employmentStatus", "current")).get("employmentStatus"));
        assertEquals("2025.07 ~ 2025.12", FeatureInput.validate(FeatureType.CAREER, career("period", "2025.07 ~ 2025.12")).get("period"));
        // 담당 업무(REQ-F25)는 긴 글이라 200자를 넘어도 된다
        assertEquals(3000, FeatureInput.validate(FeatureType.CAREER, career("duties", "가".repeat(3000))).get("duties").toString().length());
    }

    @Test void rejectsUnknownValuesAndInconsistentDates() {
        assertEquals(ErrorCode.VALIDATION_FAILED, error(career("employmentType", "정규직")));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(career("employmentStatus", "retired")));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(career("startDate", "2026-03-01", "endDate", "2026-02-01")));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(career("startDate", "2026-01-01", "endDate", "2026-02-01", "employmentStatus", "current")));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(career("startDate", "2026-01-01", "employmentStatus", "ended")));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(career("startDate", "2026-02-30")));
    }
}
