// 업무 기록·WBS·위키 화면이 기대는 서버 규칙(UT-82~UT-88)과 100단계 경계를 검증한다(PR-10 4단계, TS-43).
package kr.timebar.diary.work;

import kr.timebar.diary.auth.*;
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
import static org.mockito.Mockito.when;

@SpringJUnitConfig(FeatureTestConfig.class)
class WorkRulesTest {
    @Autowired WorkService work;
    @Autowired FeatureStore store;
    @Autowired UserRepository users;
    String a, b;

    @BeforeEach void setup() { a = account("A"); b = account("B"); }
    private String account(String name) {
        var user = new UserEntity(UUID.randomUUID() + "@example.test", name, "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        return user.getId();
    }
    private Map<String,Object> record(String type, Map<String,Object> extra) {
        var body = new LinkedHashMap<String,Object>(Map.of("title", type, "type", type, "owner", "나", "startDate", "2026-11-20", "endDate", "2026-11-20", "startTime", "09:00", "endTime", "18:00"));
        body.putAll(extra);
        return body;
    }
    private ErrorCode error(Runnable action) { return assertThrows(ApiException.class, action::run).errorCode(); }
    private String wbs(String user, String title, String parent, double md, int progress) {
        var body = new LinkedHashMap<String,Object>(Map.of("title", title, "md", md, "progress", progress));
        if (parent != null) body.put("parentId", parent);
        return work.create(user, FeatureType.WBS, body).get("id").toString();
    }

    /** UT-82. 연차는 0.5~365일, 0.5일 단위만 받는다. */
    @Test void leaveDaysAcceptOnlyHalfDayStepsWithinAYear() {
        for (double days : new double[] {0.5, 365}) assertNotNull(work.create(a, FeatureType.WORK_RECORD, record("연차", Map.of("leaveDays", days))).get("id"));
        for (double days : new double[] {0.4, 1.3, 365.5}) assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(a, FeatureType.WORK_RECORD, record("연차", Map.of("leaveDays", days)))), String.valueOf(days));
    }

    /** UT-83·UT-84. 외근·출장은 장소, 출장 경비는 0~100,000,000원, 이직은 회사와 직무가 필요하다. */
    @Test void typeSpecificFieldsAreRequired() {
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(a, FeatureType.WORK_RECORD, record("외근", Map.of()))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(a, FeatureType.WORK_RECORD, record("출장", Map.of("location", "부산", "expense", -1)))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(a, FeatureType.WORK_RECORD, record("출장", Map.of("location", "부산", "expense", 100000001)))));
        assertNotNull(work.create(a, FeatureType.WORK_RECORD, record("출장", Map.of("location", "부산", "expense", 100000000))).get("id"));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(a, FeatureType.WORK_RECORD, record("이직", Map.of("role", "개발")))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(a, FeatureType.WORK_RECORD, record("이직", Map.of("toCompany", "새 회사")))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.create(a, FeatureType.WORK_RECORD, record("기타", Map.of()))));
    }

    /** UT-85. 다른 사람의 노드는 부모로 지정할 수 없다(없는 노드와 같은 404). */
    @Test void anotherUsersNodeCannotBeAParent() {
        String others = wbs(b, "B의 노드", null, 1, 0);
        assertEquals(ErrorCode.NOT_FOUND, error(() -> wbs(a, "A의 노드", others, 1, 0)));
    }

    /** UT-86. 자기 자신·자손을 부모로 지정할 수 없고, 100단계를 넘는 계층은 만들 수 없다. */
    @Test void cyclesAndDeeperThanHundredLevelsAreRejected() {
        String root = wbs(a, "1단계", null, 0, 0), child = wbs(a, "2단계", root, 1, 0);
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.update(a, FeatureType.WBS, root, Map.of("title", "1단계", "md", 0, "progress", 0, "parentId", root, "version", 1))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> work.update(a, FeatureType.WBS, root, Map.of("title", "1단계", "md", 0, "progress", 0, "parentId", child, "version", 1))));
        String parent = child;
        for (int level = 3; level <= 100; level++) parent = wbs(a, level + "단계", parent, 1, 0);
        String last = parent;
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> wbs(a, "101단계", last, 1, 0)));
        assertEquals(100, work.current(a, FeatureType.WBS).size());
        assertEquals(100, work.wbs(a).get("items") instanceof List<?> items ? items.size() : -1);
    }

    /** UT-87. 부모 진척은 말단 공수 가중 평균이다. 공수 2·진척 100과 공수 6·진척 0이면 25%다. */
    @Test void parentProgressIsMdWeightedAverageOfLeaves() {
        String root = wbs(a, "프로젝트", null, 0, 0);
        wbs(a, "설계", root, 2, 100); wbs(a, "개발", root, 6, 0);
        @SuppressWarnings("unchecked") var items = (List<Map<String,Object>>) work.wbs(a).get("items");
        var parent = items.stream().filter(row -> root.equals(row.get("id"))).findFirst().orElseThrow();
        assertEquals(8.0, ((Number) parent.get("rollupMd")).doubleValue());
        assertEquals(25L, ((Number) parent.get("rollupProgress")).longValue());
        assertEquals(25L, ((Number) work.wbs(a).get("totalProgress")).longValue());
    }

    /** UT-88. 위키를 두 번 고치면 이전 버전 2개가 남고, 부모를 지우면 자식은 그 위로 올라간다. */
    @Test void wikiKeepsTwoPreviousVersionsAndPromotesChildrenToGrandparent() {
        String top = work.create(a, FeatureType.WIKI, Map.of("title", "개발", "space", "개발")).get("id").toString();
        String middle = work.create(a, FeatureType.WIKI, Map.of("title", "배포", "space", "개발", "parentId", top, "body", "첫 판")).get("id").toString();
        String leaf = work.create(a, FeatureType.WIKI, Map.of("title", "롤백", "space", "개발", "parentId", middle)).get("id").toString();
        work.update(a, FeatureType.WIKI, middle, Map.of("title", "배포", "space", "개발", "parentId", top, "body", "둘째 판", "version", 1));
        work.update(a, FeatureType.WIKI, middle, Map.of("title", "배포 절차", "space", "개발", "parentId", top, "body", "셋째 판", "version", 2));
        var history = work.history(a, middle);
        assertEquals(2, history.size());
        assertEquals(Set.of("첫 판", "둘째 판"), new HashSet<>(history.stream().map(row -> row.get("body")).toList()));
        work.delete(a, FeatureType.WIKI, middle, 3);
        assertEquals(top, store.get(a, FeatureType.WIKI, leaf).get("parentId"));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> work.history(b, top)));
    }
}
