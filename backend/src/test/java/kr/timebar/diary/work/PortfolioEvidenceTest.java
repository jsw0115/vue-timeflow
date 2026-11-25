// 포트폴리오 항목(PR-26): 새 필드 검사, 근거 활동·경력은 이 계정 것만 남고 지워진·다른 계정 ID는 저장할 때 빠진다.
package kr.timebar.diary.work;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class PortfolioEvidenceTest {
    @Autowired WorkService work;
    @Autowired FeatureStore store;
    String me, other;

    @BeforeEach void setup() { me = UUID.randomUUID().toString(); other = UUID.randomUUID().toString(); }
    private String activity(String owner) { return store.create(owner, FeatureType.CAREER_ACTIVITY, Map.of("title", "활동", "activityType", "project", "date", "2026-10-01", "visibility", "private")).get("id").toString(); }
    private Map<String, Object> item(Object... pairs) {
        var body = new LinkedHashMap<String, Object>(Map.of("title", "결제 개선", "kind", "케이스 스터디"));
        for (int i = 0; i < pairs.length; i += 2) body.put((String) pairs[i], pairs[i + 1]);
        return body;
    }
    private ErrorCode error(Runnable run) { return assertThrows(ApiException.class, run::run).errorCode(); }

    /** 내 활동·경력만 남고, 다른 계정·없는 ID와 중복은 빠진다. 긴 글 필드는 200자를 넘어도 된다. */
    @Test void keepsOnlyOwnEvidence() {
        String mine = activity(me), foreign = activity(other);
        String career = store.create(me, FeatureType.CAREER, Map.of("title", "경력", "role", "개발")).get("id").toString();
        var saved = work.create(me, FeatureType.PORTFOLIO, item("activityIds", List.of(mine, foreign, "no-such", mine), "experienceId", career, "process", "가".repeat(3000)));
        assertEquals(List.of(mine), saved.get("activityIds"));
        assertEquals(career, saved.get("experienceId"));
        var foreignCareer = store.create(other, FeatureType.CAREER, Map.of("title", "남의 경력", "role", "개발")).get("id").toString();
        assertNull(work.create(me, FeatureType.PORTFOLIO, item("experienceId", foreignCareer)).get("experienceId"));
    }

    /** 근거 활동을 지운 뒤에도 항목을 고칠 수 있고, 지워진 ID는 그때 빠진다. */
    @Test void deletedEvidenceDoesNotBlockEditing() {
        String a = activity(me);
        var saved = work.create(me, FeatureType.PORTFOLIO, item("activityIds", List.of(a)));
        var row = store.get(me, FeatureType.CAREER_ACTIVITY, a);
        store.delete(me, FeatureType.CAREER_ACTIVITY, a, ((Number) row.get("version")).longValue());
        var body = item("activityIds", List.of(a), "outcome", "결과", "version", saved.get("version"));
        var updated = work.update(me, FeatureType.PORTFOLIO, saved.get("id").toString(), body);
        assertEquals(List.of(), updated.get("activityIds"));
        assertEquals("결과", updated.get("outcome"));
    }

    /** 결과물 링크는 http·https만, 10개까지. 근거 활동은 20개까지, 문자열만. 짧은 필드는 200자까지. */
    @Test void rejectsInvalidFields() {
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(me, FeatureType.PORTFOLIO, item("links", List.of("javascript:alert(1)")))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(me, FeatureType.PORTFOLIO, item("links", Collections.nCopies(11, "https://example.com")))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(me, FeatureType.PORTFOLIO, item("activityIds", Collections.nCopies(21, "a")))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(me, FeatureType.PORTFOLIO, item("activityIds", List.of(3)))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(me, FeatureType.PORTFOLIO, item("role", "가".repeat(201)))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(me, FeatureType.PORTFOLIO, item("secret", "x"))));
    }
}
