// 앱·알림함을 열 때 그 사용자의 다가오는 마감 알림을 만든다(Q-32). 같은 사용자는 5분에 한 번만 계산한다.
package kr.timebar.diary.contract;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.records.DueReminders;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationRefreshController {
    private final DueReminders reminders;
    public NotificationRefreshController(DueReminders reminders) { this.reminders = reminders; }
    @PostMapping("/due-refresh")
    public ApiResponse<?> refresh() { return ApiResponse.ok(Map.of("created", reminders.refresh(CurrentUser.id()))); }
}
