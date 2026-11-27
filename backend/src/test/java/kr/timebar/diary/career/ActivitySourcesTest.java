// 커리어 활동 근거 연결(PR-24): 같은 계정의 일정·실제 기록·WBS만 잇고, 지워진 원본은 깨진 출처로 남으며, 활동을 지우면 연결도 지운다.
package kr.timebar.diary.career;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.records.RecordLinks;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class ActivitySourcesTest {
    @Autowired ActivitySources sources;
    @Autowired CareerService career;
    @Autowired RecordLinks links;
    @Autowired FeatureStore store;
    @Autowired JdbcTemplate jdbc;
    String me, other, activity;

    @BeforeEach void setup() {
        me = UUID.randomUUID().toString(); other = UUID.randomUUID().toString();
        activity = career.create(me, FeatureType.CAREER_ACTIVITY, new HashMap<>(Map.of("title", "결제 개선", "activityType", "work", "date", "2026-11-02"))).get("id").toString();
    }
    private String schedule(String owner) { return store.create(owner, FeatureType.SCHEDULE, Map.of("title", "결제 회의", "startDate", "2026-11-02", "endDate", "2026-11-02", "startTime", "10:00", "endTime", "11:00")).get("id").toString(); }
    private String actual(String owner) { return store.create(owner, FeatureType.ACTUAL_SESSION, Map.of("title", "결제 화면 작업", "state", "COMPLETED", "startedAt", "2026-11-02T01:00:00Z", "endedAt", "2026-11-02T03:00:00Z")).get("id").toString(); }
    private String wbs(String owner, String title) { return store.create(owner, FeatureType.WBS, Map.of("title", title, "md", 1, "progress", 100)).get("id").toString(); }
    private ErrorCode error(Runnable run) { return assertThrows(ApiException.class, run::run).errorCode(); }

    /** 일정·실제 기록·WBS를 잇고 제목과 함께 보인다. 같은 연결은 한 번만 남는다. */
    @Test void linksScheduleActualAndWbsOnce() {
        String s = schedule(me), a = actual(me), w = wbs(me, "결제 리뉴얼");
        sources.add(me, activity, Map.of("kind", "schedule", "id", s));
        sources.add(me, activity, Map.of("kind", "actual", "id", a));
        sources.add(me, activity, Map.of("kind", "wbs", "id", w));
        var list = sources.add(me, activity, Map.of("kind", "wbs", "id", w));
        assertEquals(List.of("결제 회의", "결제 화면 작업", "결제 리뉴얼"), list.stream().map(row -> row.get("title")).toList());
        assertTrue(list.stream().noneMatch(row -> Boolean.TRUE.equals(row.get("broken"))));
    }

    /** 다른 계정의 원본·활동, 모르는 종류, 할 일은 잇지 않는다. 다른 계정의 원본이 있는지도 드러나지 않는다(같은 404). */
    @Test void rejectsForeignRecordsAndUnknownKinds() {
        assertEquals(ErrorCode.NOT_FOUND, error(() -> sources.add(me, activity, Map.of("kind", "schedule", "id", schedule(other)))));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> sources.add(me, activity, Map.of("kind", "schedule", "id", "no-such-id"))));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> sources.list(other, activity)));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> sources.add(me, activity, Map.of("kind", "task", "id", "t1"))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> sources.add(me, activity, Map.of("kind", "wbs", "id", "w", "extra", 1))));
    }

    /** 원본을 지우면 활동 쪽 연결은 깨진 출처로 남고, 끊을 수 있다. 다른 연결(할 일·일정 등)은 지금처럼 함께 지워진다. */
    @Test void deletedOriginalsStayAsBrokenSources() {
        String s = schedule(me);
        sources.add(me, activity, Map.of("kind", "schedule", "id", s));
        var row = store.get(me, FeatureType.SCHEDULE, s);
        links.deleteSchedule(me, s, ((Number) row.get("version")).longValue());
        var list = sources.list(me, activity);
        assertEquals(1, list.size());
        assertEquals(true, list.get(0).get("broken"));
        assertNull(list.get(0).get("title"));
        assertTrue(sources.remove(me, activity, "schedule", s).isEmpty());
    }

    /** 활동을 지우면 그 활동의 근거 연결은 모두 지우고 원본은 남는다. */
    @Test void deletingActivityRemovesItsLinksButKeepsOriginals() {
        String w = wbs(me, "남는 작업");
        sources.add(me, activity, Map.of("kind", "wbs", "id", w));
        var row = store.get(me, FeatureType.CAREER_ACTIVITY, activity);
        career.delete(me, FeatureType.CAREER_ACTIVITY, activity, ((Number) row.get("version")).longValue());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM record_link WHERE owner_id=? AND source_id=?", Integer.class, me, activity));
        assertEquals("남는 작업", store.get(me, FeatureType.WBS, w).get("title"));
    }

    /** 근거는 활동마다 50개까지다. */
    @Test void sourcesAreLimitedPerActivity() {
        for (int i = 0; i < ActivitySources.MAX_SOURCES; i++) sources.add(me, activity, Map.of("kind", "wbs", "id", wbs(me, "작업 " + i)));
        assertEquals(ErrorCode.CONFLICT, error(() -> sources.add(me, activity, Map.of("kind", "wbs", "id", wbs(me, "넘침")))));
    }
}
