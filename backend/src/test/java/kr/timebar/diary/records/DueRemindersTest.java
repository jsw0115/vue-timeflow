// 마감 알림(Q-32): 할 일·지원 마감을 정한 시점부터 한 번만 알리고, 설정·커리어 목표에 따라 시점이 바뀌며, 5분 안 재호출은 계산하지 않는다.
package kr.timebar.diary.records;

import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.task.TaskEntity;
import kr.timebar.diary.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(FeatureTestConfig.class)
class DueRemindersTest {
    @Autowired FeatureStore store;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    final TaskRepository tasks = mock(TaskRepository.class);
    String user;

    @BeforeEach void setup() { user = UUID.randomUUID().toString(); jdbc.update("INSERT INTO users(id) VALUES (?)", user); }

    /** 서울 시각으로 시계를 고정한 서비스. */
    private DueReminders at(String seoul) {
        Instant now = LocalDateTime.parse(seoul).atZone(ZoneId.of("Asia/Seoul")).toInstant();
        return new DueReminders(store, tasks, new DayPolicy(users, store, Clock.fixed(now, ZoneOffset.UTC)));
    }
    private int run(String seoul) { var service = at(seoul); return service.generate(user, new DayPolicy(users, store, Clock.fixed(LocalDateTime.parse(seoul).atZone(ZoneId.of("Asia/Seoul")).toInstant(), ZoneOffset.UTC)).of(user), LocalDateTime.parse(seoul).atZone(ZoneId.of("Asia/Seoul")).toInstant()); }
    private TaskEntity task(String title, String due, String time) {
        var task = new TaskEntity(user, title, null, null, null, 30, LocalDate.parse(due), null, null, null, null);
        if (time != null) task.changeDueTime(LocalTime.parse(time));
        return task;
    }
    private List<Map<String, Object>> notes() { return store.all(user, FeatureType.NOTIFICATION); }

    /** 시각 있는 할 일은 기본 60분 전부터, 날짜만 있는 할 일은 그날 시작부터 알리고 같은 마감은 한 번만 만든다. 끝낸 할 일은 알리지 않는다. */
    @Test void tasksAreRemindedOnceFromTheirLeadTime() {
        var dentist = task("치과", "2026-11-23", "15:00");
        var report = task("보고서", "2026-11-23", null);
        var done = task("끝낸 일", "2026-11-23", null); done.toggleStatus();
        when(tasks.findByUserIdAndDeletedAtIsNullOrderByDueAscCreatedAtAsc(user)).thenReturn(List.of(dentist, report, done));
        assertEquals(0, run("2026-11-22T23:59"));
        assertEquals(1, run("2026-11-23T00:00"));
        assertEquals(0, run("2026-11-23T13:59"));
        assertEquals(1, run("2026-11-23T14:00"));
        assertEquals(0, run("2026-11-23T14:30"));
        assertEquals(List.of("‘보고서’ 오늘 마감이에요", "‘치과’ 마감이 15:00이에요"), notes().stream().map(n -> n.get("title").toString()).sorted().toList());
        assertTrue(notes().stream().allMatch(n -> "마감".equals(n.get("kind")) && Boolean.FALSE.equals(n.get("read"))));
    }

    /** 지원 마감은 커리어 목표가 취업 준비면 3일 전, 아니면 1일 전부터 알리고, 끝난 지원은 알리지 않는다. 설정으로 바꿀 수 있고 끌 수도 있다. */
    @Test void applicationLeadDependsOnGoalAndSettings() {
        when(tasks.findByUserIdAndDeletedAtIsNullOrderByDueAscCreatedAtAsc(user)).thenReturn(List.of());
        store.create(user, FeatureType.JOB_APPLICATION, Map.of("title", "프런트엔드", "company", "가회사", "status", "applied", "deadline", "2026-11-26"));
        store.create(user, FeatureType.JOB_APPLICATION, Map.of("title", "백엔드", "company", "나회사", "status", "rejected", "deadline", "2026-11-24"));
        assertEquals(0, run("2026-11-24T09:00"));
        assertEquals(1, run("2026-11-25T09:00"));
        jdbc.update("DELETE FROM feature_record WHERE owner_id=? AND kind='NOTIFICATION'", user);
        store.create(user, FeatureType.SETTING, "career", Map.of("value", Map.of("goal", "job-seeker")));
        assertEquals(1, run("2026-11-23T09:00"));
        jdbc.update("DELETE FROM feature_record WHERE owner_id=? AND kind='NOTIFICATION'", user);
        store.create(user, FeatureType.SETTING, "notifications", Map.of("value", Map.of("applicationLeadDays", 0)));
        assertEquals(0, run("2026-11-25T09:00"));
        assertEquals(1, run("2026-11-26T09:00"));
        jdbc.update("DELETE FROM feature_record WHERE owner_id=? AND kind='NOTIFICATION'", user);
        var row = store.get(user, FeatureType.SETTING, "notifications");
        store.replace(user, FeatureType.SETTING, "notifications", ((Number) row.get("version")).longValue(), Map.of("value", Map.of("dueReminders", false)));
        assertEquals(0, run("2026-11-26T09:00"));
    }

    /** 같은 사용자의 재계산은 5분 간격이다. */
    @Test void refreshIsThrottledPerUser() {
        when(tasks.findByUserIdAndDeletedAtIsNullOrderByDueAscCreatedAtAsc(user)).thenReturn(List.of(task("오늘 일", "2026-11-23", null)));
        var service = at("2026-11-23T09:00");
        assertEquals(1, service.refresh(user));
        jdbc.update("DELETE FROM feature_record WHERE owner_id=? AND kind='NOTIFICATION'", user);
        assertEquals(0, service.refresh(user), "5분 안에 다시 부르면 계산하지 않는다");
    }
}
