// 알림에서 바로 처리(UF-126): 할 일 마감 알림의 "완료"·"10분 뒤". 알림 행을 잠가 여러 기기에서 눌러도 한 번만 처리하고, 처리 결과는 알림에 남겨 다른 기기에도 보인다(UF-127).
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.task.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class NotificationActions {
    public static final Duration SNOOZE = Duration.ofMinutes(10);
    private final FeatureStore store;
    private final TaskService tasks;
    private final Clock clock;
    @Autowired
    public NotificationActions(FeatureStore store, TaskService tasks) { this(store, tasks, Clock.systemUTC()); }
    NotificationActions(FeatureStore store, TaskService tasks, Clock clock) { this.store = store; this.tasks = tasks; this.clock = clock; }

    /**
     * action은 complete 또는 snooze다. 처리한 알림·기간이 지난 알림·처리 대상이 없는 알림은 자료를 바꾸지 않고 409로 이유를 알린다.
     * 할 일이 이미 끝나 있었으면 알림만 처리됨으로 바꾸고 result=already를 돌려준다.
     */
    public Map<String,Object> apply(String user, String id, String action) {
        FeatureInput.choice(Map.of("action", action), "action", "complete", "snooze");
        var row = store.lock(user, FeatureType.NOTIFICATION, id);
        if (!(row.get("action") instanceof Map<?,?> target) || !"task".equals(target.get("kind"))) throw new ApiException(ErrorCode.CONFLICT, "이 알림에는 바로 처리할 일이 없어요.");
        if (row.get("handled") != null) throw new ApiException(ErrorCode.CONFLICT, "completed".equals(row.get("handled")) ? "이미 완료했어요." : "이미 처리한 알림이에요.");
        Instant now = clock.instant();
        if (row.get("expiresAt") != null && !Instant.parse(row.get("expiresAt").toString()).isAfter(now)) throw new ApiException(ErrorCode.CONFLICT, "기간이 지난 알림이라 처리하지 않았어요.");
        var data = new LinkedHashMap<String,Object>(FeatureStore.payload(row));
        String result;
        if (action.equals("complete")) {
            boolean changed = tasks.completeFromReminder(user, target.get("id").toString());
            result = changed ? "completed" : "already";
            data.put("handled", "completed"); data.put("read", true); data.remove("showAfter");
        } else {
            data.put("showAfter", now.plus(SNOOZE).toString()); data.put("read", false);
            result = "snoozed";
        }
        var saved = store.replace(user, FeatureType.NOTIFICATION, id, ((Number) row.get("version")).longValue(), data);
        return Map.of("result", result, "notification", saved);
    }
}
