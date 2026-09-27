# 현재 API 목록 — 소스 자동 대조

생성 명령: frontend에서 npm run docs:api. 현재 컨트롤러의 단일 문자열 매핑 형식에 한정된 생성기입니다.

총 104개. 서비스 연결 47, 계약 stub 52, 공용 메모리 시연 5.

서비스 연결은 코드의 Service 호출을 뜻하며 DB 통합 검증 완료를 의미하지 않습니다. 계약 stub은 실제 저장을 하지 않습니다.
ChatController의 15개 경로는 CHAT_ENABLED=true일 때 등록됩니다. [채팅 계약](../chat/api/catalog.md) · [Redis 목록](../chat/redis/api-catalog.md). SSE는 JSON envelope 대신 text/event-stream을 반환합니다.
현재 관리자 API도 JWT만 검사합니다. 관리자 권한 검사 구현 전 공개 배포 금지.

| Method | 전체 경로 | 현재 상태 | 현재 인증 | 컨트롤러 |
|---|---|---|---|---|
| POST | /api/auth/signup | 서비스 연결 | 공개 | AuthController |
| POST | /api/auth/login | 서비스 연결 | 공개 | AuthController |
| POST | /api/auth/logout | 서비스 연결 | JWT | AuthController |
| POST | /api/auth/refresh | 서비스 연결 | 공개 | AuthController |
| GET | /api/auth/me | 서비스 연결 | JWT | AuthController |
| GET | /api/chat/people | 서비스 연결 | JWT | ChatController |
| GET | /api/chat/rooms | 서비스 연결 | JWT | ChatController |
| POST | /api/chat/rooms | 서비스 연결 | JWT | ChatController |
| GET | /api/chat/rooms/{id} | 서비스 연결 | JWT | ChatController |
| GET | /api/chat/rooms/{id}/messages | 서비스 연결 | JWT | ChatController |
| POST | /api/chat/rooms/{id}/messages | 서비스 연결 | JWT | ChatController |
| PUT | /api/chat/rooms/{id}/read | 서비스 연결 | JWT | ChatController |
| PUT | /api/chat/rooms/{id}/owner | 서비스 연결 | JWT | ChatController |
| DELETE | /api/chat/rooms/{id}/members/me | 서비스 연결 | JWT | ChatController |
| POST | /api/chat/rooms/{id}/typing | 서비스 연결 | JWT | ChatController |
| GET | /api/chat/events | 서비스 연결 | JWT | ChatController |
| GET | /api/chat/mentions | 서비스 연결 | JWT | ChatController |
| PUT | /api/chat/mentions/{messageId}/read | 서비스 연결 | JWT | ChatController |
| GET | /api/chat/tags | 서비스 연결 | JWT | ChatController |
| GET | /api/chat/tagged-messages | 서비스 연결 | JWT | ChatController |
| GET | /api/admin/users | 계약 stub | JWT | AdminController |
| GET | /api/admin/users/{id} | 계약 stub | JWT | AdminController |
| POST | /api/admin/users | 계약 stub | JWT | AdminController |
| PUT | /api/admin/users/{id} | 계약 stub | JWT | AdminController |
| DELETE | /api/admin/users/{id} | 계약 stub | JWT | AdminController |
| GET | /api/diary/calendar | 계약 stub | JWT | EventDiaryMemoController |
| GET | /api/diary/{date} | 계약 stub | JWT | EventDiaryMemoController |
| POST | /api/diary/{date} | 계약 stub | JWT | EventDiaryMemoController |
| DELETE | /api/diary/{date} | 계약 stub | JWT | EventDiaryMemoController |
| GET | /api/memos | 계약 stub | JWT | EventDiaryMemoController |
| POST | /api/memos | 계약 stub | JWT | EventDiaryMemoController |
| DELETE | /api/memos/{id} | 계약 stub | JWT | EventDiaryMemoController |
| POST | /api/memos/stt | 계약 stub | JWT | EventDiaryMemoController |
| GET | /api/home/summary | 계약 stub | JWT | InsightController |
| GET | /api/stat/dashboard | 계약 stub | JWT | InsightController |
| GET | /api/stat/category | 계약 stub | JWT | InsightController |
| GET | /api/stat/plan-actual | 계약 stub | JWT | InsightController |
| GET | /api/stat/focus | 계약 stub | JWT | InsightController |
| GET | /api/focus/sessions | 계약 stub | JWT | InsightController |
| POST | /api/focus/sessions | 계약 stub | JWT | InsightController |
| PUT | /api/focus/sessions/{id} | 계약 stub | JWT | InsightController |
| DELETE | /api/focus/sessions/{id} | 계약 stub | JWT | InsightController |
| GET | /api/reports/time-blocks | 계약 stub | JWT | ReportController |
| POST | /api/reports/draft | 계약 stub | JWT | ReportController |
| GET | /api/reports/{reportKey} | 계약 stub | JWT | ReportController |
| POST | /api/reports/{reportKey} | 계약 stub | JWT | ReportController |
| GET | /api/reports/{reportKey}/sub-reports | 계약 stub | JWT | ReportController |
| GET | /api/settings | 계약 stub | JWT | SettingsController |
| POST | /api/settings | 계약 stub | JWT | SettingsController |
| GET | /api/settings/categories | 계약 stub | JWT | SettingsController |
| POST | /api/settings/categories | 계약 stub | JWT | SettingsController |
| GET | /api/settings/notifications | 계약 stub | JWT | SettingsController |
| POST | /api/settings/notifications | 계약 stub | JWT | SettingsController |
| GET | /api/settings/share-visibility | 계약 stub | JWT | SettingsController |
| POST | /api/settings/share-visibility | 계약 stub | JWT | SettingsController |
| GET | /api/settings/theme-sticker | 계약 stub | JWT | SettingsController |
| POST | /api/settings/theme-sticker | 계약 stub | JWT | SettingsController |
| GET | /api/share/friends | 계약 stub | JWT | ShareController |
| POST | /api/share/friends/invite | 계약 stub | JWT | ShareController |
| POST | /api/share/friends/{id}/accept | 계약 stub | JWT | ShareController |
| POST | /api/share/friends/{id}/reject | 계약 stub | JWT | ShareController |
| DELETE | /api/share/friends/{id} | 계약 stub | JWT | ShareController |
| GET | /api/share/groups | 계약 stub | JWT | ShareController |
| POST | /api/share/groups | 계약 stub | JWT | ShareController |
| GET | /api/share/groups/{id} | 계약 stub | JWT | ShareController |
| PUT | /api/share/groups/{id} | 계약 stub | JWT | ShareController |
| DELETE | /api/share/groups/{id} | 계약 stub | JWT | ShareController |
| GET | /api/share/groups/{id}/members | 계약 stub | JWT | ShareController |
| POST | /api/share/groups/{id}/members | 계약 stub | JWT | ShareController |
| DELETE | /api/share/groups/{id}/members/{memberId} | 계약 stub | JWT | ShareController |
| GET | /api/user/profile | 계약 stub | JWT | UserProfileController |
| PUT | /api/user/profile | 계약 stub | JWT | UserProfileController |
| GET | /api/events | 서비스 연결 | JWT | EventController |
| POST | /api/events | 서비스 연결 | JWT | EventController |
| PUT | /api/events/{eventId} | 서비스 연결 | JWT | EventController |
| DELETE | /api/events/{eventId} | 서비스 연결 | JWT | EventController |
| POST | /api/events/recurring | 서비스 연결 | JWT | EventController |
| PUT | /api/events/{eventId}/following | 서비스 연결 | JWT | EventController |
| DELETE | /api/events/{eventId}/following | 서비스 연결 | JWT | EventController |
| GET | /api/planner/items | 공용 메모리 시연 | JWT | PlannerController |
| POST | /api/planner/items | 공용 메모리 시연 | JWT | PlannerController |
| PUT | /api/planner/items/{id} | 공용 메모리 시연 | JWT | PlannerController |
| PATCH | /api/planner/items/{id}/status | 공용 메모리 시연 | JWT | PlannerController |
| DELETE | /api/planner/items/{id} | 공용 메모리 시연 | JWT | PlannerController |
| GET | /api/planner/daily | 서비스 연결 | JWT | PlannerViewController |
| GET | /api/planner/weekly | 서비스 연결 | JWT | PlannerViewController |
| GET | /api/planner/monthly | 서비스 연결 | JWT | PlannerViewController |
| GET | /api/planner/yearly | 서비스 연결 | JWT | PlannerViewController |
| GET | /api/planner/upcoming | 서비스 연결 | JWT | PlannerViewController |
| GET | /api/routines | 서비스 연결 | JWT | RoutineController |
| POST | /api/routines/quick | 서비스 연결 | JWT | RoutineController |
| POST | /api/routines | 서비스 연결 | JWT | RoutineController |
| PUT | /api/routines/{routineId} | 서비스 연결 | JWT | RoutineController |
| DELETE | /api/routines/{routineId} | 서비스 연결 | JWT | RoutineController |
| GET | /api/routines/{routineId}/history | 서비스 연결 | JWT | RoutineController |
| PATCH | /api/routines/{routineId}/history/{date}/toggle | 서비스 연결 | JWT | RoutineController |
| DELETE | /api/routines/{routineId}/history/{date} | 서비스 연결 | JWT | RoutineController |
| GET | /api/tasks | 서비스 연결 | JWT | TaskController |
| GET | /api/tasks/{taskId} | 서비스 연결 | JWT | TaskController |
| POST | /api/tasks | 서비스 연결 | JWT | TaskController |
| PUT | /api/tasks/{taskId} | 서비스 연결 | JWT | TaskController |
| DELETE | /api/tasks/{taskId} | 서비스 연결 | JWT | TaskController |
| PATCH | /api/tasks/{taskId}/status | 서비스 연결 | JWT | TaskController |
| POST | /api/tasks/{taskId}/duplicate | 서비스 연결 | JWT | TaskController |
