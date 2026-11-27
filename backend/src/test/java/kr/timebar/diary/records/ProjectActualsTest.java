// 업무 보고서 초안(PR-19 UF-138, UT-244·UT-245): 프로젝트에 이은 기간 안 실제 기록만 합치고, 다이어리·이어지지 않은 기록·다른 계정 기록은 넣지 않으며, 초안을 저장해도 원본은 그대로다.
package kr.timebar.diary.records;

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
class ProjectActualsTest {
    @Autowired ProjectActuals actuals;
    @Autowired FeatureStore store;
    String me, other, project, otherProject;

    @BeforeEach void setup() {
        me = UUID.randomUUID().toString(); other = UUID.randomUUID().toString();
        project = wbs(me, "결제 리뉴얼", null, 40); otherProject = wbs(me, "사내 위키", null, 0);
    }
    private String wbs(String owner, String title, String parent, int progress) {
        var body = new HashMap<String, Object>(Map.of("title", title, "md", 1, "progress", progress));
        if (parent != null) body.put("parentId", parent);
        return store.create(owner, FeatureType.WBS, body).get("id").toString();
    }
    /** 서울 시각 기준. state가 COMPLETED가 아니면 진행 중 기록이다. */
    private String actual(String owner, String title, String start, String end, String state) {
        var body = new HashMap<String, Object>(Map.of("title", title, "startedAt", start, "timeZone", "Asia/Seoul", "state", state));
        if (end != null) body.put("endedAt", end);
        return store.create(owner, FeatureType.ACTUAL_SESSION, body).get("id").toString();
    }
    private ErrorCode error(Runnable run) { return assertThrows(ApiException.class, run::run).errorCode(); }
    private void link(String projectId, String actualId) { actuals.link(me, projectId, new HashMap<>(Map.of("actualId", actualId))); }

    /** UT-244: 프로젝트 X에 이은 기간 안 기록만 합친다. 기간 밖으로 걸친 부분과 다이어리·이어지지 않은 기록은 빠진다. 완료·남은 일은 진척으로 나눈다. */
    @Test void draftSumsOnlyLinkedActualsInPeriod() {
        String a = actual(me, "결제 화면", "2026-11-23T01:00:00Z", "2026-11-23T03:00:00Z", "COMPLETED");      // 서울 11/23 10~12시, 120분
        String b = actual(me, "결제 API", "2026-11-29T14:30:00Z", "2026-11-29T15:30:00Z", "COMPLETED");      // 서울 11/29 23:30~11/30 00:30, 기간 안 30분
        String unlinked = actual(me, "점심 산책", "2026-11-24T03:00:00Z", "2026-11-24T04:00:00Z", "COMPLETED");
        String elsewhere = actual(me, "위키 정리", "2026-11-25T01:00:00Z", "2026-11-25T02:00:00Z", "COMPLETED");
        store.create(me, FeatureType.DIARY, Map.of("title", "개인 일기", "date", "2026-11-24", "body", "가족과 저녁"));
        link(project, a); link(project, b); link(otherProject, elsewhere);
        String doneTask = wbs(me, "결제 화면 설계", project, 100), openTask = wbs(me, "결제 API 연동", project, 30);
        wbs(me, "세부 작업", openTask, 100);
        var draft = actuals.draft(me, project, "2026-11-23", "2026-11-29");
        assertEquals(150L, draft.get("actualMinutes"));
        @SuppressWarnings("unchecked") var sessions = (List<Map<String, Object>>) draft.get("sessions");
        assertEquals(List.of(a, b), sessions.stream().map(s -> s.get("id")).toList());
        assertEquals(150L, sessions.stream().mapToLong(s -> (Long) s.get("minutes")).sum());
        assertFalse(sessions.stream().anyMatch(s -> List.of(unlinked, elsewhere).contains(s.get("id"))));
        @SuppressWarnings("unchecked") var done = (List<Map<String, Object>>) draft.get("done");
        @SuppressWarnings("unchecked") var remaining = (List<Map<String, Object>>) draft.get("remaining");
        assertEquals(List.of("결제 화면 설계", "세부 작업"), done.stream().map(x -> x.get("title")).sorted().toList());
        assertEquals(List.of(openTask), remaining.stream().map(x -> x.get("id")).toList());
        assertTrue(done.stream().noneMatch(x -> x.get("id").equals(project)));
        assertTrue(done.stream().anyMatch(x -> x.get("id").equals(doneTask)));
    }

    /** UT-245: 초안을 따로 저장하고 고쳐도 원본 실제 기록은 그대로다. */
    @Test void savingDraftDoesNotChangeOriginals() {
        String a = actual(me, "결제 화면", "2026-11-23T01:00:00Z", "2026-11-23T03:00:00Z", "COMPLETED");
        link(project, a);
        var before = store.get(me, FeatureType.ACTUAL_SESSION, a);
        String key = "wd-" + project + "-2026-11-23-2026-11-29";
        var saved = store.create(me, FeatureType.REPORT, key, Map.of("title", "주간 보고", "date", "2026-11-29", "category", "work-draft", "body", "실제 시간 2시간"));
        store.replace(me, FeatureType.REPORT, key, ((Number) saved.get("version")).longValue(), Map.of("title", "주간 보고", "date", "2026-11-29", "category", "work-draft", "body", "실제 시간 9시간"));
        assertEquals(before, store.get(me, FeatureType.ACTUAL_SESSION, a));
        assertEquals(120L, actuals.draft(me, project, "2026-11-23", "2026-11-29").get("actualMinutes"));
    }

    /** 실제 기록 하나는 프로젝트 하나에만 이어진다. 후보 목록이 어느 프로젝트에 이어졌는지 보인다. 빼면 초안에서 빠진다. */
    @Test void actualBelongsToOneProjectAndCanBeRemoved() {
        String a = actual(me, "결제 화면", "2026-11-23T01:00:00Z", "2026-11-23T03:00:00Z", "COMPLETED");
        link(otherProject, a);
        var listed = actuals.candidates(me, project, "2026-11-23", "2026-11-23");
        assertEquals(false, listed.get(0).get("linked"));
        assertEquals("사내 위키", listed.get(0).get("linkedProjectTitle"));
        link(project, a);
        assertEquals(0L, actuals.draft(me, otherProject, "2026-11-23", "2026-11-23").get("actualMinutes"));
        assertEquals(true, actuals.candidates(me, project, "2026-11-23", "2026-11-23").get(0).get("linked"));
        actuals.unlink(me, project, a);
        assertEquals(0L, actuals.draft(me, project, "2026-11-23", "2026-11-23").get("actualMinutes"));
    }

    /** 하위 작업은 프로젝트가 아니다(400). 다른 계정의 프로젝트·기록, 진행 중 기록, 잘못된 기간은 막는다. */
    @Test void rejectsInvalidRequests() {
        String child = wbs(me, "하위", project, 0);
        String running = actual(me, "진행 중", "2026-11-23T01:00:00Z", null, "RUNNING");
        String foreign = actual(other, "남의 기록", "2026-11-23T01:00:00Z", "2026-11-23T02:00:00Z", "COMPLETED");
        String foreignProject = wbs(other, "남의 프로젝트", null, 0);
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> actuals.draft(me, child, "2026-11-01", "2026-11-30")));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> actuals.draft(me, foreignProject, "2026-11-01", "2026-11-30")));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> link(project, foreign)));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> link(project, running)));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> actuals.draft(me, project, "2026-11-30", "2026-11-01")));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> actuals.draft(me, project, "2025-01-01", "2026-11-30")));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> actuals.draft(me, project, "2026-11-01", "어제")));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> actuals.link(me, project, new HashMap<>(Map.of("actualId", "x", "extra", 1)))));
    }
}
