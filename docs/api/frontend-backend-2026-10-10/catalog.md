# API 목록

기준 2026-10-10. 총 277개 매핑이며 wildcard 경로는 허용된 값을 선택한다. 채팅은 CHAT_ENABLED=true 조건부 등록이다. 구현·검증 범위는 [검증 기록](verification.md)을 확인한다.

| 메서드 | 경로 | 인증 | 처리 | 소스 |
|---|---|---|---|---|
| GET | `/api/admin/audit` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| POST | `/api/admin/billing/{id}/refund` | JWT + ADMIN | 외부 연동 경계 | IntegrationController |
| POST | `/api/admin/billing/{id}/retry` | JWT + ADMIN | 외부 연동 경계 | IntegrationController |
| GET | `/api/admin/content` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| POST | `/api/admin/content` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| DELETE | `/api/admin/content/{id}` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| PUT | `/api/admin/content/{id}` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| GET | `/api/admin/moderation` | JWT + ADMIN | 실제 처리 소스 있음 | ModerationController |
| PUT | `/api/admin/moderation/{id}` | JWT + ADMIN | 실제 처리 소스 있음 | ModerationController |
| GET | `/api/admin/monitoring` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| GET | `/api/admin/notices` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| POST | `/api/admin/notices` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| DELETE | `/api/admin/notices/{id}` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| PUT | `/api/admin/notices/{id}` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| GET | `/api/admin/settings` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| PUT | `/api/admin/settings` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| GET | `/api/admin/stats` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| GET | `/api/admin/tickets` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| PUT | `/api/admin/tickets/{id}` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| GET | `/api/admin/users` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| POST | `/api/admin/users` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| DELETE | `/api/admin/users/{id}` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| GET | `/api/admin/users/{id}` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| PUT | `/api/admin/users/{id}` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| POST | `/api/admin/users/{id}/force-logout` | JWT + ADMIN | 실제 처리 소스 있음 | AdminController |
| GET | `/api/attachments` | JWT | 실제 처리 소스 있음 | AttachmentController |
| POST | `/api/attachments` | JWT | 실제 처리 소스 있음 | AttachmentController |
| DELETE | `/api/attachments/{id}` | JWT | 실제 처리 소스 있음 | AttachmentController |
| GET | `/api/attachments/{id}/download` | JWT | 실제 처리 소스 있음 | AttachmentController |
| PUT | `/api/attachments/{id}/retention` | JWT | 실제 처리 소스 있음 | AttachmentController |
| POST | `/api/attachments/purge-expired` | JWT | 실제 처리 소스 있음 | AttachmentController |
| POST | `/api/auth/login` | 공개 | 실제 처리 소스 있음 | AuthController |
| POST | `/api/auth/logout` | JWT | 실제 처리 소스 있음 | AuthController |
| GET | `/api/auth/me` | JWT | 실제 처리 소스 있음 | AuthController |
| POST | `/api/auth/refresh` | 공개 | 실제 처리 소스 있음 | AuthController |
| POST | `/api/auth/signup` | 공개 | 실제 처리 소스 있음 | AuthController |
| POST | `/api/billing/cancel` | JWT | 외부 연동 경계 | IntegrationController |
| POST | `/api/billing/checkout` | JWT | 외부 연동 경계 | IntegrationController |
| GET | `/api/chat/events` | JWT | 실제 처리 소스 있음 | ChatController |
| GET | `/api/chat/mentions` | JWT | 실제 처리 소스 있음 | ChatController |
| PUT | `/api/chat/mentions/{messageId}/read` | JWT | 실제 처리 소스 있음 | ChatController |
| GET | `/api/chat/people` | JWT | 실제 처리 소스 있음 | ChatController |
| GET | `/api/chat/presence` | JWT | 실제 처리 소스 있음 | ChatController |
| PUT | `/api/chat/presence` | JWT | 실제 처리 소스 있음 | ChatController |
| GET | `/api/chat/rooms` | JWT | 실제 처리 소스 있음 | ChatController |
| POST | `/api/chat/rooms` | JWT | 실제 처리 소스 있음 | ChatController |
| GET | `/api/chat/rooms/{id}` | JWT | 실제 처리 소스 있음 | ChatController |
| DELETE | `/api/chat/rooms/{id}/members/me` | JWT | 실제 처리 소스 있음 | ChatController |
| GET | `/api/chat/rooms/{id}/messages` | JWT | 실제 처리 소스 있음 | ChatController |
| POST | `/api/chat/rooms/{id}/messages` | JWT | 실제 처리 소스 있음 | ChatController |
| PUT | `/api/chat/rooms/{id}/owner` | JWT | 실제 처리 소스 있음 | ChatController |
| PUT | `/api/chat/rooms/{id}/read` | JWT | 실제 처리 소스 있음 | ChatController |
| POST | `/api/chat/rooms/{id}/typing` | JWT | 실제 처리 소스 있음 | ChatController |
| GET | `/api/chat/search` | JWT | 실제 처리 소스 있음 | ChatController |
| GET | `/api/chat/tagged-messages` | JWT | 실제 처리 소스 있음 | ChatController |
| GET | `/api/chat/tags` | JWT | 실제 처리 소스 있음 | ChatController |
| POST | `/api/cofocus/rooms` | JWT | 외부 연동 경계 | IntegrationController |
| GET | `/api/communities` | JWT | 실제 처리 소스 있음 | CommunityController |
| POST | `/api/communities` | JWT | 실제 처리 소스 있음 | CommunityController |
| DELETE | `/api/communities/{id}` | JWT | 실제 처리 소스 있음 | CommunityController |
| GET | `/api/communities/{id}` | JWT | 실제 처리 소스 있음 | CommunityController |
| PUT | `/api/communities/{id}` | JWT | 실제 처리 소스 있음 | CommunityController |
| GET | `/api/communities/{id}/challenges` | JWT | 실제 처리 소스 있음 | CommunityController |
| POST | `/api/communities/{id}/challenges` | JWT | 실제 처리 소스 있음 | CommunityController |
| PUT | `/api/communities/{id}/challenges/{challengeId}/checkins/{date}` | JWT | 실제 처리 소스 있음 | CommunityController |
| POST | `/api/communities/{id}/challenges/{challengeId}/join` | JWT | 실제 처리 소스 있음 | CommunityController |
| GET | `/api/communities/{id}/challenges/{challengeId}/ranking` | JWT | 실제 처리 소스 있음 | CommunityController |
| POST | `/api/communities/{id}/join` | JWT | 실제 처리 소스 있음 | CommunityController |
| GET | `/api/communities/{id}/join-requests` | JWT | 실제 처리 소스 있음 | CommunityController |
| PUT | `/api/communities/{id}/join-requests/{userId}` | JWT | 실제 처리 소스 있음 | CommunityController |
| GET | `/api/communities/{id}/members` | JWT | 실제 처리 소스 있음 | CommunityController |
| POST | `/api/communities/{id}/members` | JWT | 실제 처리 소스 있음 | CommunityController |
| DELETE | `/api/communities/{id}/members/{userId}` | JWT | 실제 처리 소스 있음 | CommunityController |
| GET | `/api/communities/{id}/posts` | JWT | 실제 처리 소스 있음 | CommunityController |
| POST | `/api/communities/{id}/posts` | JWT | 실제 처리 소스 있음 | CommunityController |
| DELETE | `/api/communities/{id}/posts/{postId}` | JWT | 실제 처리 소스 있음 | CommunityController |
| PUT | `/api/communities/{id}/posts/{postId}` | JWT | 실제 처리 소스 있음 | CommunityController |
| GET | `/api/communities/{id}/posts/{postId}/comments` | JWT | 실제 처리 소스 있음 | CommunityController |
| POST | `/api/communities/{id}/posts/{postId}/comments` | JWT | 실제 처리 소스 있음 | CommunityController |
| PUT | `/api/communities/{id}/posts/{postId}/like` | JWT | 실제 처리 소스 있음 | CommunityController |
| POST | `/api/communities/{id}/posts/{postId}/report` | JWT | 실제 처리 소스 있음 | ModerationController |
| GET | `/api/contacts` | JWT | 실제 처리 소스 있음 | ContactsController |
| POST | `/api/contacts` | JWT | 실제 처리 소스 있음 | ContactsController |
| DELETE | `/api/contacts/{id}` | JWT | 실제 처리 소스 있음 | ContactsController |
| GET | `/api/contacts/{id}` | JWT | 실제 처리 소스 있음 | ContactsController |
| PUT | `/api/contacts/{id}` | JWT | 실제 처리 소스 있음 | ContactsController |
| GET | `/api/content` | JWT | 실제 처리 소스 있음 | SupportController |
| GET | `/api/ddays` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/ddays` | JWT | 실제 처리 소스 있음 | RecordsController |
| DELETE | `/api/ddays/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/ddays/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| PUT | `/api/ddays/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/diaries` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/diaries` | JWT | 실제 처리 소스 있음 | RecordsController |
| DELETE | `/api/diaries/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/diaries/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| PUT | `/api/diaries/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| DELETE | `/api/diary/{date}` | JWT | 실제 처리 소스 있음 | EventDiaryMemoController |
| GET | `/api/diary/{date}` | JWT | 실제 처리 소스 있음 | EventDiaryMemoController |
| POST | `/api/diary/{date}` | JWT | 실제 처리 소스 있음 | EventDiaryMemoController |
| GET | `/api/diary/calendar` | JWT | 실제 처리 소스 있음 | EventDiaryMemoController |
| GET | `/api/events` | JWT | 실제 처리 소스 있음 | EventController |
| POST | `/api/events` | JWT | 실제 처리 소스 있음 | EventController |
| DELETE | `/api/events/{eventId}` | JWT | 실제 처리 소스 있음 | EventController |
| PUT | `/api/events/{eventId}` | JWT | 실제 처리 소스 있음 | EventController |
| DELETE | `/api/events/{eventId}/following` | JWT | 실제 처리 소스 있음 | EventController |
| PUT | `/api/events/{eventId}/following` | JWT | 실제 처리 소스 있음 | EventController |
| POST | `/api/events/recurring` | JWT | 실제 처리 소스 있음 | EventController |
| GET | `/api/events/templates` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/events/templates` | JWT | 실제 처리 소스 있음 | RecordsController |
| DELETE | `/api/events/templates/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/events/templates/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| PUT | `/api/events/templates/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/events/templates/{id}/apply` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| GET | `/api/focus/sessions` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/focus/sessions` | JWT | 실제 처리 소스 있음 | RecordsController |
| DELETE | `/api/focus/sessions/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/focus/sessions/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| PUT | `/api/focus/sessions/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/home/summary` | JWT | 실제 처리 소스 있음 | InsightController |
| POST | `/api/insight/generate` | JWT | 외부 연동 경계 | IntegrationController |
| GET | `/api/integrations/capabilities` | JWT | 외부 연동 경계 | IntegrationController |
| GET | `/api/memos` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/memos` | JWT | 실제 처리 소스 있음 | RecordsController |
| DELETE | `/api/memos/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/memos/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| PUT | `/api/memos/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/memos/{id}/convert-to-task` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| POST | `/api/memos/stt` | JWT | 외부 연동 경계 | IntegrationController |
| GET | `/api/money/entries` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/money/entries` | JWT | 실제 처리 소스 있음 | RecordsController |
| DELETE | `/api/money/entries/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/money/entries/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| PUT | `/api/money/entries/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/money/summary` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| GET | `/api/notices` | JWT | 실제 처리 소스 있음 | SupportController |
| GET | `/api/notifications` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| DELETE | `/api/notifications/{id}` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| PUT | `/api/notifications/{id}/read` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| PUT | `/api/notifications/read-all` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| GET | `/api/planner/canvas` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| PUT | `/api/planner/canvas` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| GET | `/api/planner/daily` | JWT | 실제 처리 소스 있음 | PlannerViewController |
| GET | `/api/planner/items` | JWT | 실제 처리 소스 있음 | PlannerController |
| POST | `/api/planner/items` | JWT | 실제 처리 소스 있음 | PlannerController |
| DELETE | `/api/planner/items/{id}` | JWT | 실제 처리 소스 있음 | PlannerController |
| PUT | `/api/planner/items/{id}` | JWT | 실제 처리 소스 있음 | PlannerController |
| PATCH | `/api/planner/items/{id}/status` | JWT | 실제 처리 소스 있음 | PlannerController |
| GET | `/api/planner/monthly` | JWT | 실제 처리 소스 있음 | PlannerViewController |
| GET | `/api/planner/preferences` | JWT | 실제 처리 소스 있음 | PlannerPreferenceController |
| PUT | `/api/planner/preferences` | JWT | 실제 처리 소스 있음 | PlannerPreferenceController |
| DELETE | `/api/planner/reviews/{date}` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| GET | `/api/planner/reviews/{date}` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| PUT | `/api/planner/reviews/{date}` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| GET | `/api/planner/templates` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/planner/templates` | JWT | 실제 처리 소스 있음 | RecordsController |
| DELETE | `/api/planner/templates/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| GET | `/api/planner/templates/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| PUT | `/api/planner/templates/{id}` | JWT | 실제 처리 소스 있음 | RecordsController |
| POST | `/api/planner/templates/{id}/apply` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| GET | `/api/planner/upcoming` | JWT | 실제 처리 소스 있음 | PlannerViewController |
| GET | `/api/planner/weekly` | JWT | 실제 처리 소스 있음 | PlannerViewController |
| GET | `/api/planner/yearly` | JWT | 실제 처리 소스 있음 | PlannerViewController |
| GET | `/api/public/portfolios/{token}` | 공개 | 실제 처리 소스 있음 | PortfolioLinkController |
| GET | `/api/reports/{reportKey}` | JWT | 실제 처리 소스 있음 | ReportController |
| POST | `/api/reports/{reportKey}` | JWT | 실제 처리 소스 있음 | ReportController |
| GET | `/api/reports/{reportKey}/sub-reports` | JWT | 실제 처리 소스 있음 | ReportController |
| POST | `/api/reports/draft` | JWT | 실제 처리 소스 있음 | ReportController |
| GET | `/api/reports/time-blocks` | JWT | 실제 처리 소스 있음 | ReportController |
| GET | `/api/routine-records` | JWT | 실제 처리 소스 있음 | ScheduleController |
| POST | `/api/routine-records` | JWT | 실제 처리 소스 있음 | ScheduleController |
| DELETE | `/api/routine-records/{id}` | JWT | 실제 처리 소스 있음 | ScheduleController |
| GET | `/api/routine-records/{id}` | JWT | 실제 처리 소스 있음 | ScheduleController |
| PUT | `/api/routine-records/{id}` | JWT | 실제 처리 소스 있음 | ScheduleController |
| GET | `/api/routine-records/{id}/history` | JWT | 실제 처리 소스 있음 | ScheduleController |
| PUT | `/api/routine-records/{id}/history/{date}` | JWT | 실제 처리 소스 있음 | ScheduleController |
| GET | `/api/routines` | JWT | 실제 처리 소스 있음 | RoutineController |
| POST | `/api/routines` | JWT | 실제 처리 소스 있음 | RoutineController |
| DELETE | `/api/routines/{routineId}` | JWT | 실제 처리 소스 있음 | RoutineController |
| PUT | `/api/routines/{routineId}` | JWT | 실제 처리 소스 있음 | RoutineController |
| GET | `/api/routines/{routineId}/history` | JWT | 실제 처리 소스 있음 | RoutineController |
| DELETE | `/api/routines/{routineId}/history/{date}` | JWT | 실제 처리 소스 있음 | RoutineController |
| PATCH | `/api/routines/{routineId}/history/{date}/toggle` | JWT | 실제 처리 소스 있음 | RoutineController |
| POST | `/api/routines/quick` | JWT | 실제 처리 소스 있음 | RoutineController |
| GET | `/api/schedules` | JWT | 실제 처리 소스 있음 | ScheduleController |
| POST | `/api/schedules` | JWT | 실제 처리 소스 있음 | ScheduleController |
| DELETE | `/api/schedules/{id}` | JWT | 실제 처리 소스 있음 | ScheduleController |
| GET | `/api/schedules/{id}` | JWT | 실제 처리 소스 있음 | ScheduleController |
| PUT | `/api/schedules/{id}` | JWT | 실제 처리 소스 있음 | ScheduleController |
| GET | `/api/schedules/occurrences` | JWT | 실제 처리 소스 있음 | ScheduleController |
| GET | `/api/search` | JWT | 실제 처리 소스 있음 | SearchController |
| GET | `/api/search/tags` | JWT | 실제 처리 소스 있음 | SearchController |
| GET | `/api/settings` | JWT | 실제 처리 소스 있음 | SettingsController |
| POST | `/api/settings` | JWT | 실제 처리 소스 있음 | SettingsController |
| GET | `/api/settings/{section}` | JWT | 실제 처리 소스 있음 | SettingsController |
| POST | `/api/settings/{section}` | JWT | 실제 처리 소스 있음 | SettingsController |
| POST | `/api/settings/notifications/kakao/verify` | JWT | 외부 연동 경계 | IntegrationController |
| GET | `/api/share/blocks` | JWT | 실제 처리 소스 있음 | ShareController |
| DELETE | `/api/share/blocks/{userId}` | JWT | 실제 처리 소스 있음 | ShareController |
| PUT | `/api/share/blocks/{userId}` | JWT | 실제 처리 소스 있음 | ShareController |
| GET | `/api/share/friends` | JWT | 실제 처리 소스 있음 | ShareController |
| DELETE | `/api/share/friends/{id}` | JWT | 실제 처리 소스 있음 | ShareController |
| POST | `/api/share/friends/{id}/accept` | JWT | 실제 처리 소스 있음 | ShareController |
| POST | `/api/share/friends/{id}/reject` | JWT | 실제 처리 소스 있음 | ShareController |
| POST | `/api/share/friends/invite` | JWT | 실제 처리 소스 있음 | ShareController |
| GET | `/api/share/groups` | JWT | 실제 처리 소스 있음 | ShareController |
| POST | `/api/share/groups` | JWT | 실제 처리 소스 있음 | ShareController |
| DELETE | `/api/share/groups/{id}` | JWT | 실제 처리 소스 있음 | ShareController |
| GET | `/api/share/groups/{id}` | JWT | 실제 처리 소스 있음 | ShareController |
| PUT | `/api/share/groups/{id}` | JWT | 실제 처리 소스 있음 | ShareController |
| POST | `/api/share/groups/{id}/join` | JWT | 실제 처리 소스 있음 | ShareController |
| GET | `/api/share/groups/{id}/members` | JWT | 실제 처리 소스 있음 | ShareController |
| POST | `/api/share/groups/{id}/members` | JWT | 실제 처리 소스 있음 | ShareController |
| DELETE | `/api/share/groups/{id}/members/{memberId}` | JWT | 실제 처리 소스 있음 | ShareController |
| GET | `/api/stat/category` | JWT | 실제 처리 소스 있음 | InsightController |
| GET | `/api/stat/dashboard` | JWT | 실제 처리 소스 있음 | InsightController |
| GET | `/api/stat/focus` | JWT | 실제 처리 소스 있음 | InsightController |
| GET | `/api/stat/plan-actual` | JWT | 실제 처리 소스 있음 | InsightController |
| GET | `/api/support/tickets` | JWT | 실제 처리 소스 있음 | SupportController |
| POST | `/api/support/tickets` | JWT | 실제 처리 소스 있음 | SupportController |
| POST | `/api/sync/{provider}/run` | JWT | 외부 연동 경계 | IntegrationController |
| GET | `/api/sync/status` | JWT | 외부 연동 경계 | IntegrationController |
| GET | `/api/tasks` | JWT | 실제 처리 소스 있음 | TaskController |
| POST | `/api/tasks` | JWT | 실제 처리 소스 있음 | TaskController |
| DELETE | `/api/tasks/{taskId}` | JWT | 실제 처리 소스 있음 | TaskController |
| GET | `/api/tasks/{taskId}` | JWT | 실제 처리 소스 있음 | TaskController |
| PUT | `/api/tasks/{taskId}` | JWT | 실제 처리 소스 있음 | TaskController |
| GET | `/api/tasks/{taskId}/assignees` | JWT | 실제 처리 소스 있음 | TaskAssigneeController |
| DELETE | `/api/tasks/{taskId}/assignees/{userId}` | JWT | 실제 처리 소스 있음 | TaskAssigneeController |
| PUT | `/api/tasks/{taskId}/assignees/{userId}` | JWT | 실제 처리 소스 있음 | TaskAssigneeController |
| GET | `/api/tasks/{taskId}/checklist-items` | JWT | 실제 처리 소스 있음 | TaskChecklistController |
| POST | `/api/tasks/{taskId}/checklist-items` | JWT | 실제 처리 소스 있음 | TaskChecklistController |
| DELETE | `/api/tasks/{taskId}/checklist-items/{itemId}` | JWT | 실제 처리 소스 있음 | TaskChecklistController |
| PUT | `/api/tasks/{taskId}/checklist-items/{itemId}` | JWT | 실제 처리 소스 있음 | TaskChecklistController |
| PUT | `/api/tasks/{taskId}/checklist-items/{itemId}/completion` | JWT | 실제 처리 소스 있음 | TaskChecklistController |
| POST | `/api/tasks/{taskId}/duplicate` | JWT | 실제 처리 소스 있음 | TaskController |
| PATCH | `/api/tasks/{taskId}/status` | JWT | 실제 처리 소스 있음 | TaskController |
| GET | `/api/user/data/export` | JWT | 실제 처리 소스 있음 | UserProfileController |
| PUT | `/api/user/password` | JWT | 실제 처리 소스 있음 | UserProfileController |
| GET | `/api/user/profile` | JWT | 실제 처리 소스 있음 | UserProfileController |
| PUT | `/api/user/profile` | JWT | 실제 처리 소스 있음 | UserProfileController |
| DELETE | `/api/user/sessions` | JWT | 실제 처리 소스 있음 | UserProfileController |
| GET | `/api/user/sessions` | JWT | 실제 처리 소스 있음 | UserProfileController |
| DELETE | `/api/user/sessions/{id}` | JWT | 실제 처리 소스 있음 | UserProfileController |
| GET | `/api/user/social-accounts` | JWT | 외부 연동 경계 | IntegrationController |
| POST | `/api/user/social-accounts/{provider}/connect` | JWT | 외부 연동 경계 | IntegrationController |
| GET | `/api/work/career/projects` | JWT | 실제 처리 소스 있음 | WorkController |
| POST | `/api/work/career/projects` | JWT | 실제 처리 소스 있음 | WorkController |
| DELETE | `/api/work/career/projects/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/career/projects/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| PUT | `/api/work/career/projects/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/portfolio` | JWT | 실제 처리 소스 있음 | WorkController |
| POST | `/api/work/portfolio` | JWT | 실제 처리 소스 있음 | WorkController |
| POST | `/api/work/portfolio-links` | JWT | 실제 처리 소스 있음 | PortfolioLinkController |
| DELETE | `/api/work/portfolio-links/{id}` | JWT | 실제 처리 소스 있음 | PortfolioLinkController |
| DELETE | `/api/work/portfolio/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/portfolio/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| PUT | `/api/work/portfolio/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/records` | JWT | 실제 처리 소스 있음 | WorkController |
| POST | `/api/work/records` | JWT | 실제 처리 소스 있음 | WorkController |
| DELETE | `/api/work/records/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/records/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| PUT | `/api/work/records/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/resume` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| PUT | `/api/work/resume` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| GET | `/api/work/wbs` | JWT | 실제 처리 소스 있음 | RecordActionsController |
| GET | `/api/work/wbs/nodes` | JWT | 실제 처리 소스 있음 | WorkController |
| POST | `/api/work/wbs/nodes` | JWT | 실제 처리 소스 있음 | WorkController |
| DELETE | `/api/work/wbs/nodes/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/wbs/nodes/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| PUT | `/api/work/wbs/nodes/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/wiki` | JWT | 실제 처리 소스 있음 | WorkController |
| POST | `/api/work/wiki` | JWT | 실제 처리 소스 있음 | WorkController |
| DELETE | `/api/work/wiki/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/wiki/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| PUT | `/api/work/wiki/{id}` | JWT | 실제 처리 소스 있음 | WorkController |
| GET | `/api/work/wiki/{id}/history` | JWT | 실제 처리 소스 있음 | RecordActionsController |
