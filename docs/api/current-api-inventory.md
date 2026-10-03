# 현재 API 목록 — 소스 자동 대조

기준 2026-10-03. 생성 명령: frontend에서 npm run docs:api. 현재 컨트롤러의 단일 문자열 매핑 형식에 한정된 생성기입니다.

총 117개. 이번 구현 완료 10, 기존 서비스 연결 50, 미구현 stub 52, 공용 메모리 시연 5.

| 상태 | 의미 |
|---|---|
| 구현 완료 · 단위/HTTP 계약 검증 | 이번 체크리스트·담당자·플래너 설정 모듈의 소스와 단위/MockMvc HTTP 계약 테스트 완료. 실제 MySQL·Redis 검증 결과는 별도 복구 기록 참조. 프런트엔드 연결은 별도. |
| 기존 구현 · 서비스 연결 | 기존 Service 경로가 존재함. 이번에 모든 기존 API 동작을 재검증했다는 뜻은 아님. |
| 미구현 · stub | 컨트롤러 계약만 존재하며 실제 조회·저장 기능은 미구현. |
| 시연 · 메모리 | 공용 메모리 시연이며 사용자별 영속 데이터 API가 아님. |

사전 설계: [구현 계획](implementation-plan-2026-10-03.md). 정확한 신규 입력·응답·권한·버전 계약: [체크리스트·플래너 계약](task-planner-contract.md).
실제 DB 반영·데이터 보존·실서버 검증: [복구 기록](../development/database-recovery-2026-10-03.md).
ChatController의 18개 경로는 CHAT_ENABLED=true일 때 등록됩니다. [채팅 계약](../chat/api/catalog.md) · [Redis 목록](../chat/redis/api-catalog.md). SSE는 JSON envelope 대신 text/event-stream을 반환합니다.
현재 관리자 API도 JWT만 검사합니다. 관리자 권한 검사 구현 전 공개 배포 금지.

| Method | 전체 경로 | 현재 상태 | 현재 인증 | 컨트롤러 |
|---|---|---|---|---|
| POST | /api/auth/signup | 기존 구현 · 서비스 연결 | 공개 | AuthController |
| POST | /api/auth/login | 기존 구현 · 서비스 연결 | 공개 | AuthController |
| POST | /api/auth/logout | 기존 구현 · 서비스 연결 | JWT | AuthController |
| POST | /api/auth/refresh | 기존 구현 · 서비스 연결 | 공개 | AuthController |
| GET | /api/auth/me | 기존 구현 · 서비스 연결 | JWT | AuthController |
| GET | /api/chat/people | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/chat/rooms | 기존 구현 · 서비스 연결 | JWT | ChatController |
| POST | /api/chat/rooms | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/chat/rooms/{id} | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/chat/search | 기존 구현 · 서비스 연결 | JWT | ChatController |
| PUT | /api/chat/presence | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/chat/presence | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/chat/rooms/{id}/messages | 기존 구현 · 서비스 연결 | JWT | ChatController |
| POST | /api/chat/rooms/{id}/messages | 기존 구현 · 서비스 연결 | JWT | ChatController |
| PUT | /api/chat/rooms/{id}/read | 기존 구현 · 서비스 연결 | JWT | ChatController |
| PUT | /api/chat/rooms/{id}/owner | 기존 구현 · 서비스 연결 | JWT | ChatController |
| DELETE | /api/chat/rooms/{id}/members/me | 기존 구현 · 서비스 연결 | JWT | ChatController |
| POST | /api/chat/rooms/{id}/typing | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/chat/events | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/chat/mentions | 기존 구현 · 서비스 연결 | JWT | ChatController |
| PUT | /api/chat/mentions/{messageId}/read | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/chat/tags | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/chat/tagged-messages | 기존 구현 · 서비스 연결 | JWT | ChatController |
| GET | /api/admin/users | 미구현 · stub | JWT | AdminController |
| GET | /api/admin/users/{id} | 미구현 · stub | JWT | AdminController |
| POST | /api/admin/users | 미구현 · stub | JWT | AdminController |
| PUT | /api/admin/users/{id} | 미구현 · stub | JWT | AdminController |
| DELETE | /api/admin/users/{id} | 미구현 · stub | JWT | AdminController |
| GET | /api/diary/calendar | 미구현 · stub | JWT | EventDiaryMemoController |
| GET | /api/diary/{date} | 미구현 · stub | JWT | EventDiaryMemoController |
| POST | /api/diary/{date} | 미구현 · stub | JWT | EventDiaryMemoController |
| DELETE | /api/diary/{date} | 미구현 · stub | JWT | EventDiaryMemoController |
| GET | /api/memos | 미구현 · stub | JWT | EventDiaryMemoController |
| POST | /api/memos | 미구현 · stub | JWT | EventDiaryMemoController |
| DELETE | /api/memos/{id} | 미구현 · stub | JWT | EventDiaryMemoController |
| POST | /api/memos/stt | 미구현 · stub | JWT | EventDiaryMemoController |
| GET | /api/home/summary | 미구현 · stub | JWT | InsightController |
| GET | /api/stat/dashboard | 미구현 · stub | JWT | InsightController |
| GET | /api/stat/category | 미구현 · stub | JWT | InsightController |
| GET | /api/stat/plan-actual | 미구현 · stub | JWT | InsightController |
| GET | /api/stat/focus | 미구현 · stub | JWT | InsightController |
| GET | /api/focus/sessions | 미구현 · stub | JWT | InsightController |
| POST | /api/focus/sessions | 미구현 · stub | JWT | InsightController |
| PUT | /api/focus/sessions/{id} | 미구현 · stub | JWT | InsightController |
| DELETE | /api/focus/sessions/{id} | 미구현 · stub | JWT | InsightController |
| GET | /api/reports/time-blocks | 미구현 · stub | JWT | ReportController |
| POST | /api/reports/draft | 미구현 · stub | JWT | ReportController |
| GET | /api/reports/{reportKey} | 미구현 · stub | JWT | ReportController |
| POST | /api/reports/{reportKey} | 미구현 · stub | JWT | ReportController |
| GET | /api/reports/{reportKey}/sub-reports | 미구현 · stub | JWT | ReportController |
| GET | /api/settings | 미구현 · stub | JWT | SettingsController |
| POST | /api/settings | 미구현 · stub | JWT | SettingsController |
| GET | /api/settings/categories | 미구현 · stub | JWT | SettingsController |
| POST | /api/settings/categories | 미구현 · stub | JWT | SettingsController |
| GET | /api/settings/notifications | 미구현 · stub | JWT | SettingsController |
| POST | /api/settings/notifications | 미구현 · stub | JWT | SettingsController |
| GET | /api/settings/share-visibility | 미구현 · stub | JWT | SettingsController |
| POST | /api/settings/share-visibility | 미구현 · stub | JWT | SettingsController |
| GET | /api/settings/theme-sticker | 미구현 · stub | JWT | SettingsController |
| POST | /api/settings/theme-sticker | 미구현 · stub | JWT | SettingsController |
| GET | /api/share/friends | 미구현 · stub | JWT | ShareController |
| POST | /api/share/friends/invite | 미구현 · stub | JWT | ShareController |
| POST | /api/share/friends/{id}/accept | 미구현 · stub | JWT | ShareController |
| POST | /api/share/friends/{id}/reject | 미구현 · stub | JWT | ShareController |
| DELETE | /api/share/friends/{id} | 미구현 · stub | JWT | ShareController |
| GET | /api/share/groups | 미구현 · stub | JWT | ShareController |
| POST | /api/share/groups | 미구현 · stub | JWT | ShareController |
| GET | /api/share/groups/{id} | 미구현 · stub | JWT | ShareController |
| PUT | /api/share/groups/{id} | 미구현 · stub | JWT | ShareController |
| DELETE | /api/share/groups/{id} | 미구현 · stub | JWT | ShareController |
| GET | /api/share/groups/{id}/members | 미구현 · stub | JWT | ShareController |
| POST | /api/share/groups/{id}/members | 미구현 · stub | JWT | ShareController |
| DELETE | /api/share/groups/{id}/members/{memberId} | 미구현 · stub | JWT | ShareController |
| GET | /api/user/profile | 미구현 · stub | JWT | UserProfileController |
| PUT | /api/user/profile | 미구현 · stub | JWT | UserProfileController |
| GET | /api/events | 기존 구현 · 서비스 연결 | JWT | EventController |
| POST | /api/events | 기존 구현 · 서비스 연결 | JWT | EventController |
| PUT | /api/events/{eventId} | 기존 구현 · 서비스 연결 | JWT | EventController |
| DELETE | /api/events/{eventId} | 기존 구현 · 서비스 연결 | JWT | EventController |
| POST | /api/events/recurring | 기존 구현 · 서비스 연결 | JWT | EventController |
| PUT | /api/events/{eventId}/following | 기존 구현 · 서비스 연결 | JWT | EventController |
| DELETE | /api/events/{eventId}/following | 기존 구현 · 서비스 연결 | JWT | EventController |
| GET | /api/planner/items | 시연 · 메모리 | JWT | PlannerController |
| POST | /api/planner/items | 시연 · 메모리 | JWT | PlannerController |
| PUT | /api/planner/items/{id} | 시연 · 메모리 | JWT | PlannerController |
| PATCH | /api/planner/items/{id}/status | 시연 · 메모리 | JWT | PlannerController |
| DELETE | /api/planner/items/{id} | 시연 · 메모리 | JWT | PlannerController |
| GET | /api/planner/daily | 기존 구현 · 서비스 연결 | JWT | PlannerViewController |
| GET | /api/planner/weekly | 기존 구현 · 서비스 연결 | JWT | PlannerViewController |
| GET | /api/planner/monthly | 기존 구현 · 서비스 연결 | JWT | PlannerViewController |
| GET | /api/planner/yearly | 기존 구현 · 서비스 연결 | JWT | PlannerViewController |
| GET | /api/planner/upcoming | 기존 구현 · 서비스 연결 | JWT | PlannerViewController |
| GET | /api/planner/preferences | 구현 완료 · 단위/HTTP 계약 검증 | JWT | PlannerPreferenceController |
| PUT | /api/planner/preferences | 구현 완료 · 단위/HTTP 계약 검증 | JWT | PlannerPreferenceController |
| GET | /api/routines | 기존 구현 · 서비스 연결 | JWT | RoutineController |
| POST | /api/routines/quick | 기존 구현 · 서비스 연결 | JWT | RoutineController |
| POST | /api/routines | 기존 구현 · 서비스 연결 | JWT | RoutineController |
| PUT | /api/routines/{routineId} | 기존 구현 · 서비스 연결 | JWT | RoutineController |
| DELETE | /api/routines/{routineId} | 기존 구현 · 서비스 연결 | JWT | RoutineController |
| GET | /api/routines/{routineId}/history | 기존 구현 · 서비스 연결 | JWT | RoutineController |
| PATCH | /api/routines/{routineId}/history/{date}/toggle | 기존 구현 · 서비스 연결 | JWT | RoutineController |
| DELETE | /api/routines/{routineId}/history/{date} | 기존 구현 · 서비스 연결 | JWT | RoutineController |
| GET | /api/tasks | 기존 구현 · 서비스 연결 | JWT | TaskController |
| GET | /api/tasks/{taskId} | 기존 구현 · 서비스 연결 | JWT | TaskController |
| POST | /api/tasks | 기존 구현 · 서비스 연결 | JWT | TaskController |
| PUT | /api/tasks/{taskId} | 기존 구현 · 서비스 연결 | JWT | TaskController |
| DELETE | /api/tasks/{taskId} | 기존 구현 · 서비스 연결 | JWT | TaskController |
| PATCH | /api/tasks/{taskId}/status | 기존 구현 · 서비스 연결 | JWT | TaskController |
| POST | /api/tasks/{taskId}/duplicate | 기존 구현 · 서비스 연결 | JWT | TaskController |
| GET | /api/tasks/{taskId}/assignees | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskAssigneeController |
| PUT | /api/tasks/{taskId}/assignees/{userId} | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskAssigneeController |
| DELETE | /api/tasks/{taskId}/assignees/{userId} | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskAssigneeController |
| GET | /api/tasks/{taskId}/checklist-items | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
| POST | /api/tasks/{taskId}/checklist-items | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
| PUT | /api/tasks/{taskId}/checklist-items/{itemId} | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
| PUT | /api/tasks/{taskId}/checklist-items/{itemId}/completion | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
| DELETE | /api/tasks/{taskId}/checklist-items/{itemId} | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
