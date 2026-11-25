// 문서 버전(PR-25): 지금 저장된 내용을 고정하고 원본을 고쳐도 바뀌지 않으며, 지원 건에 문서 종류별 하나씩 제출본으로 잇고, 연결된 버전은 지우지 못한다.
package kr.timebar.diary.career;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class DocumentVersionsTest {
    @Autowired DocumentVersions versions;
    @Autowired CareerService career;
    @Autowired FeatureStore store;
    @Autowired JdbcTemplate jdbc;
    String me, other, application;

    @BeforeEach void setup() {
        me = UUID.randomUUID().toString(); other = UUID.randomUUID().toString();
        application = career.create(me, FeatureType.JOB_APPLICATION, new HashMap<>(Map.of("title", "프런트엔드", "company", "가나다", "status", "applied"))).get("id").toString();
    }
    private ErrorCode error(Runnable run) { return assertThrows(ApiException.class, run::run).errorCode(); }
    private void resume(String owner, String headline) {
        var row = store.optional(owner, FeatureType.RESUME, "default");
        var data = new HashMap<String, Object>(Map.of("name", "김지수", "headline", headline));
        if (row.isEmpty()) store.create(owner, FeatureType.RESUME, "default", data);
        else store.replace(owner, FeatureType.RESUME, "default", ((Number) row.get().get("version")).longValue(), data);
    }
    @SuppressWarnings("unchecked")
    private Map<String, Object> resumeOf(Map<String, Object> version) { return (Map<String, Object>) ((Map<String, Object>) version.get("content")).get("resume"); }

    /** 버전은 그때 저장된 내용을 복사하고, 원본을 고쳐도 그대로다. 번호는 문서마다 1부터 늘고, 이름표가 없으면 "이력서 v1"이다. */
    @Test void freezesSavedContentAndNumbersPerDocument() {
        resume(me, "첫 소개");
        var first = versions.create(me, new HashMap<>(Map.of("document", "resume")));
        resume(me, "바뀐 소개");
        var second = versions.create(me, new HashMap<>(Map.of("document", "resume", "label", "가나다 제출용", "note", "소개 문장 수정")));
        assertEquals(List.of(1, 2), List.of(((Number) first.get("number")).intValue(), ((Number) second.get("number")).intValue()));
        assertEquals("이력서 v1", first.get("title"));
        assertEquals("가나다 제출용", second.get("title"));
        assertEquals("첫 소개", resumeOf(versions.get(me, first.get("id").toString())).get("headline"));
        assertEquals("바뀐 소개", resumeOf(versions.get(me, second.get("id").toString())).get("headline"));
        assertEquals(List.of(2, 1), versions.list(me, "resume").stream().map(row -> ((Number) row.get("number")).intValue()).toList());
        assertNull(versions.list(me, "resume").get(0).get("content"));
    }

    /** 경력기술서·포트폴리오는 항목 목록을 원본 ID와 함께 고정한다. 저장한 내용이 없으면 만들지 않는다(409). */
    @Test void freezesItemsWithSourceIdsAndRefusesEmptyDocuments() {
        assertEquals(ErrorCode.CONFLICT, error(() -> versions.create(me, new HashMap<>(Map.of("document", "career")))));
        assertEquals(ErrorCode.CONFLICT, error(() -> versions.create(me, new HashMap<>(Map.of("document", "resume")))));
        String project = store.create(me, FeatureType.CAREER, Map.of("title", "결제 리뉴얼", "role", "프런트엔드")).get("id").toString();
        var version = versions.get(me, versions.create(me, new HashMap<>(Map.of("document", "career"))).get("id").toString());
        @SuppressWarnings("unchecked") var items = (List<Map<String, Object>>) ((Map<String, Object>) version.get("content")).get("items");
        assertEquals(project, items.get(0).get("id"));
        assertEquals("결제 리뉴얼", items.get(0).get("title"));
    }

    /** 자기소개서(PR-25 Q-41)도 버전으로 고정하고 지원에 잇는다. 저장한 자기소개서가 없으면 409, 긴 글 칸은 200자를 넘어도 된다. */
    @Test void freezesCoverLetters() {
        assertEquals(ErrorCode.CONFLICT, error(() -> versions.create(me, new HashMap<>(Map.of("document", "cover-letter")))));
        var data = kr.timebar.diary.feature.FeatureInput.validate(FeatureType.COVER_LETTER, new HashMap<>(Map.of("title", "기본 자기소개서", "motivation", "가".repeat(1500), "growth", "성장")));
        store.create(me, FeatureType.COVER_LETTER, "default", data);
        var version = versions.create(me, new HashMap<>(Map.of("document", "cover-letter", "label", "가나다 제출용")));
        assertEquals("cover-letter-1", version.get("id"));
        @SuppressWarnings("unchecked") var letter = (Map<String, Object>) ((Map<String, Object>) version.get("content")).get("coverLetter");
        assertEquals("성장", letter.get("growth"));
        versions.attach(me, application, new HashMap<>(Map.of("versionId", "cover-letter-1")));
        assertEquals(List.of("cover-letter-1"), versions.attached(me, application).stream().map(row -> row.get("id")).toList());
    }

    /** 모르는 문서·필드, 너무 긴 이름표는 400이다. 다른 계정의 버전은 같은 404다. */
    @Test void rejectsInvalidInputAndForeignVersions() {
        resume(me, "소개");
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> versions.create(me, new HashMap<>(Map.of("document", "self-intro")))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> versions.create(me, new HashMap<>(Map.of("document", "resume", "content", "x")))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> versions.create(me, new HashMap<>(Map.of("document", "resume", "label", "가".repeat(101))))));
        String id = versions.create(me, new HashMap<>(Map.of("document", "resume"))).get("id").toString();
        assertEquals(ErrorCode.NOT_FOUND, error(() -> versions.get(other, id)));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> versions.delete(other, id)));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> versions.attached(other, application)));
    }

    /** 지원 건에는 문서 종류마다 하나만 남는다(새 버전으로 바꿈). 다른 계정 버전은 잇지 못한다. */
    @Test void attachesOneVersionPerDocumentKind() {
        resume(me, "소개");
        String v1 = versions.create(me, new HashMap<>(Map.of("document", "resume"))).get("id").toString();
        String v2 = versions.create(me, new HashMap<>(Map.of("document", "resume"))).get("id").toString();
        store.create(me, FeatureType.PORTFOLIO, Map.of("title", "케이스 스터디", "kind", "문서"));
        String p1 = versions.create(me, new HashMap<>(Map.of("document", "portfolio"))).get("id").toString();
        versions.attach(me, application, new HashMap<>(Map.of("versionId", v1)));
        versions.attach(me, application, new HashMap<>(Map.of("versionId", p1)));
        var list = versions.attach(me, application, new HashMap<>(Map.of("versionId", v2)));
        assertEquals(Set.of(v2, p1), new HashSet<>(list.stream().map(row -> row.get("id")).toList()));
        // 버전 ID는 계정마다 "문서-번호"라, 내게 없는 경력기술서 버전으로 다른 계정 것을 가리킨다
        store.create(other, FeatureType.CAREER, Map.of("title", "남의 경력", "role", "개발"));
        String foreign = versions.create(other, new HashMap<>(Map.of("document", "career"))).get("id").toString();
        assertEquals("career-1", foreign);
        assertEquals(ErrorCode.NOT_FOUND, error(() -> versions.attach(me, application, new HashMap<>(Map.of("versionId", foreign)))));
        assertEquals(List.of(p1), versions.detach(me, application, v2).stream().map(row -> row.get("id")).toList());
    }

    /** 연결된 버전은 지울 수 없고(409), 지원 건을 지우면 연결만 사라져 그 뒤에는 지울 수 있다. */
    @Test void attachedVersionsCannotBeDeletedUntilApplicationIsGone() {
        resume(me, "소개");
        String v1 = versions.create(me, new HashMap<>(Map.of("document", "resume"))).get("id").toString();
        versions.attach(me, application, new HashMap<>(Map.of("versionId", v1)));
        assertEquals(1, ((Number) versions.get(me, v1).get("applicationCount")).intValue());
        assertEquals(ErrorCode.CONFLICT, error(() -> versions.delete(me, v1)));
        var row = store.get(me, FeatureType.JOB_APPLICATION, application);
        career.delete(me, FeatureType.JOB_APPLICATION, application, ((Number) row.get("version")).longValue());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM record_link WHERE owner_id=? AND target_id=?", Integer.class, me, v1));
        versions.delete(me, v1);
        assertTrue(versions.list(me, null).isEmpty());
    }
}
