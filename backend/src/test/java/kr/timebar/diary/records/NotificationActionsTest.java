// 알림에서 바로 처리(UF-126·UF-127): 완료는 한 번만, 이미 처리·기간 지남·대상 없음은 자료를 바꾸지 않고, 처리 결과는 알림에 남는다.
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.task.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class NotificationActionsTest {
    static final Instant NOW = Instant.parse("2026-11-23T05:00:00Z");
    @Autowired FeatureStore store;
    final TaskService tasks = mock(TaskService.class);
    NotificationActions actions;
    String user;

    @BeforeEach void setup() { user = UUID.randomUUID().toString(); actions = new NotificationActions(store, tasks, Clock.fixed(NOW, ZoneOffset.UTC)); }
    private String note(String expiresAt, boolean withAction) {
        var data = new LinkedHashMap<String, Object>(Map.of("title", "‘치과’ 마감이 15:00이에요", "kind", "마감", "link", "/tasks/T1", "read", false, "expiresAt", expiresAt));
        if (withAction) data.put("action", Map.of("kind", "task", "id", "T1"));
        String id = "due:task:T1:" + UUID.randomUUID();
        store.create(user, FeatureType.NOTIFICATION, id, data);
        return id;
    }
    private ErrorCode error(Runnable run) { return assertThrows(ApiException.class, run::run).errorCode(); }

    /** UT-221·UT-222: 완료하면 할 일을 한 번만 완료하고 알림은 처리됨·읽음이 된다. 다시 누르면(다른 기기) "이미 완료했어요"이고 할 일은 다시 바꾸지 않는다. */
    @Test void completeRunsOnceAndRecordsTheResult() {
        when(tasks.completeFromReminder(user, "T1")).thenReturn(true);
        String id = note("2026-11-24T00:00:00Z", true);
        var first = actions.apply(user, id, "complete");
        assertEquals("completed", first.get("result"));
        var stored = store.get(user, FeatureType.NOTIFICATION, id);
        assertEquals("completed", stored.get("handled"));
        assertEquals(true, stored.get("read"));
        var again = assertThrows(ApiException.class, () -> actions.apply(user, id, "complete"));
        assertEquals(ErrorCode.CONFLICT, again.errorCode());
        assertEquals("이미 완료했어요.", again.getMessage());
        verify(tasks, times(1)).completeFromReminder(user, "T1");
    }

    /** 다른 화면에서 먼저 끝낸 할 일이면 알림만 처리됨으로 바꾸고 result=already다. */
    @Test void alreadyDoneTaskOnlyClosesTheNotification() {
        when(tasks.completeFromReminder(user, "T1")).thenReturn(false);
        String id = note("2026-11-24T00:00:00Z", true);
        assertEquals("already", actions.apply(user, id, "complete").get("result"));
        assertEquals("completed", store.get(user, FeatureType.NOTIFICATION, id).get("handled"));
    }

    /** UT-223: 기간이 지난 알림, 처리 대상 없는 알림, 지워진 할 일은 자료를 바꾸지 않는다. 모르는 동작은 400이다. */
    @Test void expiredMissingOrDeletedTargetsChangeNothing() {
        String expired = note("2026-11-23T05:00:00Z", true);
        assertEquals(ErrorCode.CONFLICT, error(() -> actions.apply(user, expired, "complete")));
        assertNull(store.get(user, FeatureType.NOTIFICATION, expired).get("handled"));
        String plain = note("2026-11-24T00:00:00Z", false);
        assertEquals(ErrorCode.CONFLICT, error(() -> actions.apply(user, plain, "complete")));
        when(tasks.completeFromReminder(user, "T1")).thenThrow(new ApiException(ErrorCode.NOT_FOUND, "할 일을 찾을 수 없습니다."));
        String deleted = note("2026-11-24T00:00:00Z", true);
        assertEquals(ErrorCode.NOT_FOUND, error(() -> actions.apply(user, deleted, "complete")));
        assertNull(store.get(user, FeatureType.NOTIFICATION, deleted).get("handled"));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> actions.apply(user, deleted, "delete-task")));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> actions.apply(UUID.randomUUID().toString(), deleted, "complete")), "다른 계정의 알림은 처리할 수 없다");
        verify(tasks, times(1)).completeFromReminder(user, "T1");
    }

    /** "10분 뒤"는 알림을 10분 뒤에 다시 보이게 하고 처리됨으로 바꾸지 않는다. 그 뒤에도 완료할 수 있다. */
    @Test void snoozeShowsTheNotificationAgainLater() {
        when(tasks.completeFromReminder(user, "T1")).thenReturn(true);
        String id = note("2026-11-24T00:00:00Z", true);
        assertEquals("snoozed", actions.apply(user, id, "snooze").get("result"));
        var stored = store.get(user, FeatureType.NOTIFICATION, id);
        assertEquals(NOW.plus(Duration.ofMinutes(10)).toString(), stored.get("showAfter"));
        assertNull(stored.get("handled"));
        assertEquals("completed", actions.apply(user, id, "complete").get("result"));
        assertNull(store.get(user, FeatureType.NOTIFICATION, id).get("showAfter"));
    }
}
