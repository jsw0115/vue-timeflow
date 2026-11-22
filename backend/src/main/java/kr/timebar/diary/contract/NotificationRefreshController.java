// 앱·알림함을 열 때 그 사용자의 다가오는 마감 알림을 만들고(Q-32, 같은 사용자는 5분에 한 번), 알림에서 바로 처리한다(UF-126).
package kr.timebar.diary.contract;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.records.DueReminders;
import kr.timebar.diary.records.NotificationActions;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationRefreshController {
    private final DueReminders reminders;
    private final NotificationActions actions;
    public NotificationRefreshController(DueReminders reminders, NotificationActions actions) { this.reminders = reminders; this.actions = actions; }
    @PostMapping("/due-refresh")
    public ApiResponse<?> refresh() { return ApiResponse.ok(Map.of("created", reminders.refresh(CurrentUser.id()))); }
    /** action: complete(할 일 완료) 또는 snooze(10분 뒤 다시 보이기). */
    @PostMapping("/{id}/actions/{action}")
    public ApiResponse<?> act(@PathVariable String id, @PathVariable String action) { return ApiResponse.ok(actions.apply(CurrentUser.id(), id, action)); }
}
