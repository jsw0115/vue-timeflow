# 현재 API 목록 — 소스 자동 대조

기준 2026-10-10. 생성 명령: frontend에서 npm run docs:api. 현재 컨트롤러의 단일 문자열 매핑 형식에 한정된 생성기입니다.

총 277개. 기존 지정 계약 검증 10, 서비스 연결 254, 외부 제공자 경계 13, 미구현 stub 0, 공용 메모리 시연 0.

| 상태 | 의미 |
|---|---|
| 구현 완료 · 단위/HTTP 계약 검증 | 이번 체크리스트·담당자·플래너 설정 모듈의 소스와 단위/MockMvc HTTP 계약 테스트 완료. 실제 MySQL·Redis 검증 결과는 별도 복구 기록 참조. 프런트엔드 연결은 별도. |
| 서비스 연결 · 검증 범위 별도 | 실제 처리 경로가 존재함. 모든 API를 이번에 HTTP·실 DB로 검증했다는 의미는 아님. |
| 외부 제공자 경계 · 연동 대기 | 제공자 의존 API. 상태 조회는 미연결 상태, 실행 요청은 503을 반환함. |
| 미구현 · stub | 컨트롤러 계약만 존재하며 실제 조회·저장 기능은 미구현. |
| 시연 · 메모리 | 공용 메모리 시연이며 사용자별 영속 데이터 API가 아님. |

사전 설계: [구현 계획](implementation-plan-2026-10-03.md). 정확한 신규 입력·응답·권한·버전 계약: [체크리스트·플래너 계약](task-planner-contract.md).
실제 DB 반영·데이터 보존·실서버 검증: [복구 기록](../development/database-recovery-2026-10-03.md).
ChatController의 18개 경로는 CHAT_ENABLED=true일 때 등록됩니다. [채팅 계약](../chat/api/catalog.md) · [Redis 목록](../chat/redis/api-catalog.md). SSE는 JSON envelope 대신 text/event-stream을 반환합니다.
최신 기능 목록·요청 필드·응답·검증 범위는 [2026-10-10 명세](frontend-backend-2026-10-10/README.md)를 참조합니다. 관리자 API는 JWT + ADMIN과 실제 계정 권한을 검사합니다.

| Method | 전체 경로 | 현재 상태 | 현재 인증 | 컨트롤러 |
|---|---|---|---|---|
| POST | /api/auth/signup | 서비스 연결 · 검증 범위 별도 | 공개 | AuthController |
| POST | /api/auth/login | 서비스 연결 · 검증 범위 별도 | 공개 | AuthController |
| POST | /api/auth/logout | 서비스 연결 · 검증 범위 별도 | JWT | AuthController |
| POST | /api/auth/refresh | 서비스 연결 · 검증 범위 별도 | 공개 | AuthController |
| GET | /api/auth/me | 서비스 연결 · 검증 범위 별도 | JWT | AuthController |
| GET | /api/chat/people | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/chat/rooms | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| POST | /api/chat/rooms | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/chat/rooms/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/chat/search | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| PUT | /api/chat/presence | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/chat/presence | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/chat/rooms/{id}/messages | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| POST | /api/chat/rooms/{id}/messages | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| PUT | /api/chat/rooms/{id}/read | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| PUT | /api/chat/rooms/{id}/owner | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| DELETE | /api/chat/rooms/{id}/members/me | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| POST | /api/chat/rooms/{id}/typing | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/chat/events | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/chat/mentions | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| PUT | /api/chat/mentions/{messageId}/read | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/chat/tags | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/chat/tagged-messages | 서비스 연결 · 검증 범위 별도 | JWT | ChatController |
| GET | /api/admin/users | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| GET | /api/admin/users/{id} | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| POST | /api/admin/users | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| PUT | /api/admin/users/{id} | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| DELETE | /api/admin/users/{id} | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| POST | /api/admin/users/{id}/force-logout | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| GET | /api/admin/tickets | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| PUT | /api/admin/tickets/{id} | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| GET | /api/admin/stats | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| GET | /api/admin/monitoring | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| GET | /api/admin/settings | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| PUT | /api/admin/settings | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| GET | /api/admin/audit | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| GET | /api/admin/content | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| POST | /api/admin/content | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| PUT | /api/admin/content/{id} | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| DELETE | /api/admin/content/{id} | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| GET | /api/admin/notices | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| POST | /api/admin/notices | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| PUT | /api/admin/notices/{id} | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| DELETE | /api/admin/notices/{id} | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | AdminController |
| GET | /api/diary/calendar | 서비스 연결 · 검증 범위 별도 | JWT | EventDiaryMemoController |
| GET | /api/diary/{date} | 서비스 연결 · 검증 범위 별도 | JWT | EventDiaryMemoController |
| POST | /api/diary/{date} | 서비스 연결 · 검증 범위 별도 | JWT | EventDiaryMemoController |
| DELETE | /api/diary/{date} | 서비스 연결 · 검증 범위 별도 | JWT | EventDiaryMemoController |
| GET | /api/home/summary | 서비스 연결 · 검증 범위 별도 | JWT | InsightController |
| GET | /api/stat/dashboard | 서비스 연결 · 검증 범위 별도 | JWT | InsightController |
| GET | /api/stat/category | 서비스 연결 · 검증 범위 별도 | JWT | InsightController |
| GET | /api/stat/plan-actual | 서비스 연결 · 검증 범위 별도 | JWT | InsightController |
| GET | /api/stat/focus | 서비스 연결 · 검증 범위 별도 | JWT | InsightController |
| GET | /api/reports/time-blocks | 서비스 연결 · 검증 범위 별도 | JWT | ReportController |
| POST | /api/reports/draft | 서비스 연결 · 검증 범위 별도 | JWT | ReportController |
| GET | /api/reports/{reportKey} | 서비스 연결 · 검증 범위 별도 | JWT | ReportController |
| POST | /api/reports/{reportKey} | 서비스 연결 · 검증 범위 별도 | JWT | ReportController |
| GET | /api/reports/{reportKey}/sub-reports | 서비스 연결 · 검증 범위 별도 | JWT | ReportController |
| GET | /api/settings | 서비스 연결 · 검증 범위 별도 | JWT | SettingsController |
| POST | /api/settings | 서비스 연결 · 검증 범위 별도 | JWT | SettingsController |
| GET | /api/settings/{section} | 서비스 연결 · 검증 범위 별도 | JWT | SettingsController |
| POST | /api/settings/{section} | 서비스 연결 · 검증 범위 별도 | JWT | SettingsController |
| GET | /api/share/friends | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| POST | /api/share/friends/invite | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| POST | /api/share/friends/{id}/accept | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| POST | /api/share/friends/{id}/reject | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| DELETE | /api/share/friends/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| GET | /api/share/blocks | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| PUT | /api/share/blocks/{userId} | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| DELETE | /api/share/blocks/{userId} | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| GET | /api/share/groups | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| POST | /api/share/groups | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| GET | /api/share/groups/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| PUT | /api/share/groups/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| DELETE | /api/share/groups/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| GET | /api/share/groups/{id}/members | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| POST | /api/share/groups/{id}/members | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| DELETE | /api/share/groups/{id}/members/{memberId} | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| POST | /api/share/groups/{id}/join | 서비스 연결 · 검증 범위 별도 | JWT | ShareController |
| GET | /api/user/profile | 서비스 연결 · 검증 범위 별도 | JWT | UserProfileController |
| PUT | /api/user/profile | 서비스 연결 · 검증 범위 별도 | JWT | UserProfileController |
| PUT | /api/user/password | 서비스 연결 · 검증 범위 별도 | JWT | UserProfileController |
| GET | /api/user/data/export | 서비스 연결 · 검증 범위 별도 | JWT | UserProfileController |
| GET | /api/user/sessions | 서비스 연결 · 검증 범위 별도 | JWT | UserProfileController |
| DELETE | /api/user/sessions/{id} | 서비스 연결 · 검증 범위 별도 | JWT | UserProfileController |
| DELETE | /api/user/sessions | 서비스 연결 · 검증 범위 별도 | JWT | UserProfileController |
| GET | /api/events | 서비스 연결 · 검증 범위 별도 | JWT | EventController |
| POST | /api/events | 서비스 연결 · 검증 범위 별도 | JWT | EventController |
| PUT | /api/events/{eventId} | 서비스 연결 · 검증 범위 별도 | JWT | EventController |
| DELETE | /api/events/{eventId} | 서비스 연결 · 검증 범위 별도 | JWT | EventController |
| POST | /api/events/recurring | 서비스 연결 · 검증 범위 별도 | JWT | EventController |
| PUT | /api/events/{eventId}/following | 서비스 연결 · 검증 범위 별도 | JWT | EventController |
| DELETE | /api/events/{eventId}/following | 서비스 연결 · 검증 범위 별도 | JWT | EventController |
| GET | /api/integrations/capabilities | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/insight/generate | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/memos/stt | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| GET | /api/sync/status | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/sync/{provider}/run | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/billing/checkout | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/billing/cancel | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/admin/billing/{id}/refund | 외부 제공자 경계 · 연동 대기 | JWT + ADMIN | IntegrationController |
| POST | /api/admin/billing/{id}/retry | 외부 제공자 경계 · 연동 대기 | JWT + ADMIN | IntegrationController |
| GET | /api/user/social-accounts | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/user/social-accounts/{provider}/connect | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/settings/notifications/kakao/verify | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/cofocus/rooms | 외부 제공자 경계 · 연동 대기 | JWT | IntegrationController |
| POST | /api/communities/{id}/posts/{postId}/report | 서비스 연결 · 검증 범위 별도 | JWT | ModerationController |
| GET | /api/admin/moderation | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | ModerationController |
| PUT | /api/admin/moderation/{id} | 서비스 연결 · 검증 범위 별도 | JWT + ADMIN | ModerationController |
| GET | /api/support/tickets | 서비스 연결 · 검증 범위 별도 | JWT | SupportController |
| POST | /api/support/tickets | 서비스 연결 · 검증 범위 별도 | JWT | SupportController |
| GET | /api/notices | 서비스 연결 · 검증 범위 별도 | JWT | SupportController |
| GET | /api/content | 서비스 연결 · 검증 범위 별도 | JWT | SupportController |
| GET | /api/planner/items | 서비스 연결 · 검증 범위 별도 | JWT | PlannerController |
| POST | /api/planner/items | 서비스 연결 · 검증 범위 별도 | JWT | PlannerController |
| PUT | /api/planner/items/{id} | 서비스 연결 · 검증 범위 별도 | JWT | PlannerController |
| PATCH | /api/planner/items/{id}/status | 서비스 연결 · 검증 범위 별도 | JWT | PlannerController |
| DELETE | /api/planner/items/{id} | 서비스 연결 · 검증 범위 별도 | JWT | PlannerController |
| GET | /api/planner/daily | 서비스 연결 · 검증 범위 별도 | JWT | PlannerViewController |
| GET | /api/planner/weekly | 서비스 연결 · 검증 범위 별도 | JWT | PlannerViewController |
| GET | /api/planner/monthly | 서비스 연결 · 검증 범위 별도 | JWT | PlannerViewController |
| GET | /api/planner/yearly | 서비스 연결 · 검증 범위 별도 | JWT | PlannerViewController |
| GET | /api/planner/upcoming | 서비스 연결 · 검증 범위 별도 | JWT | PlannerViewController |
| GET | /api/planner/preferences | 구현 완료 · 단위/HTTP 계약 검증 | JWT | PlannerPreferenceController |
| PUT | /api/planner/preferences | 구현 완료 · 단위/HTTP 계약 검증 | JWT | PlannerPreferenceController |
| GET | /api/attachments | 서비스 연결 · 검증 범위 별도 | JWT | AttachmentController |
| POST | /api/attachments | 서비스 연결 · 검증 범위 별도 | JWT | AttachmentController |
| GET | /api/attachments/{id}/download | 서비스 연결 · 검증 범위 별도 | JWT | AttachmentController |
| PUT | /api/attachments/{id}/retention | 서비스 연결 · 검증 범위 별도 | JWT | AttachmentController |
| DELETE | /api/attachments/{id} | 서비스 연결 · 검증 범위 별도 | JWT | AttachmentController |
| POST | /api/attachments/purge-expired | 서비스 연결 · 검증 범위 별도 | JWT | AttachmentController |
| GET | /api/contacts | 서비스 연결 · 검증 범위 별도 | JWT | ContactsController |
| GET | /api/contacts/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ContactsController |
| POST | /api/contacts | 서비스 연결 · 검증 범위 별도 | JWT | ContactsController |
| PUT | /api/contacts/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ContactsController |
| DELETE | /api/contacts/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ContactsController |
| GET | /api/planner/reviews/{date} | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| PUT | /api/planner/reviews/{date} | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| DELETE | /api/planner/reviews/{date} | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| GET | /api/money/summary | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| GET | /api/notifications | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| PUT | /api/notifications/{id}/read | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| PUT | /api/notifications/read-all | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| DELETE | /api/notifications/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| POST | /api/memos/{id}/convert-to-task | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| POST | /api/events/templates/{id}/apply | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| POST | /api/planner/templates/{id}/apply | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| GET | /api/planner/canvas | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| PUT | /api/planner/canvas | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| GET | /api/work/wbs | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| GET | /api/work/wiki/{id}/history | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| GET | /api/work/resume | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| PUT | /api/work/resume | 서비스 연결 · 검증 범위 별도 | JWT | RecordActionsController |
| GET | /api/diaries | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/diaries/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| POST | /api/diaries | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| PUT | /api/diaries/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| DELETE | /api/diaries/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/memos | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/memos/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| POST | /api/memos | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| PUT | /api/memos/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| DELETE | /api/memos/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/ddays | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/ddays/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| POST | /api/ddays | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| PUT | /api/ddays/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| DELETE | /api/ddays/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/money/entries | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/money/entries/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| POST | /api/money/entries | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| PUT | /api/money/entries/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| DELETE | /api/money/entries/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/focus/sessions | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/focus/sessions/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| POST | /api/focus/sessions | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| PUT | /api/focus/sessions/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| DELETE | /api/focus/sessions/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/events/templates | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/events/templates/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| POST | /api/events/templates | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| PUT | /api/events/templates/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| DELETE | /api/events/templates/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/planner/templates | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/planner/templates/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| POST | /api/planner/templates | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| PUT | /api/planner/templates/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| DELETE | /api/planner/templates/{id} | 서비스 연결 · 검증 범위 별도 | JWT | RecordsController |
| GET | /api/schedules | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| GET | /api/schedules/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| POST | /api/schedules | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| PUT | /api/schedules/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| DELETE | /api/schedules/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| GET | /api/routine-records | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| GET | /api/routine-records/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| POST | /api/routine-records | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| PUT | /api/routine-records/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| DELETE | /api/routine-records/{id} | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| GET | /api/schedules/occurrences | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| GET | /api/routine-records/{id}/history | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| PUT | /api/routine-records/{id}/history/{date} | 서비스 연결 · 검증 범위 별도 | JWT | ScheduleController |
| GET | /api/search | 서비스 연결 · 검증 범위 별도 | JWT | SearchController |
| GET | /api/search/tags | 서비스 연결 · 검증 범위 별도 | JWT | SearchController |
| GET | /api/routines | 서비스 연결 · 검증 범위 별도 | JWT | RoutineController |
| POST | /api/routines/quick | 서비스 연결 · 검증 범위 별도 | JWT | RoutineController |
| POST | /api/routines | 서비스 연결 · 검증 범위 별도 | JWT | RoutineController |
| PUT | /api/routines/{routineId} | 서비스 연결 · 검증 범위 별도 | JWT | RoutineController |
| DELETE | /api/routines/{routineId} | 서비스 연결 · 검증 범위 별도 | JWT | RoutineController |
| GET | /api/routines/{routineId}/history | 서비스 연결 · 검증 범위 별도 | JWT | RoutineController |
| PATCH | /api/routines/{routineId}/history/{date}/toggle | 서비스 연결 · 검증 범위 별도 | JWT | RoutineController |
| DELETE | /api/routines/{routineId}/history/{date} | 서비스 연결 · 검증 범위 별도 | JWT | RoutineController |
| GET | /api/communities | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| POST | /api/communities | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| GET | /api/communities/{id} | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| PUT | /api/communities/{id} | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| DELETE | /api/communities/{id} | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| POST | /api/communities/{id}/join | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| GET | /api/communities/{id}/members | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| POST | /api/communities/{id}/members | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| DELETE | /api/communities/{id}/members/{userId} | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| GET | /api/communities/{id}/join-requests | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| PUT | /api/communities/{id}/join-requests/{userId} | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| GET | /api/communities/{id}/posts | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| POST | /api/communities/{id}/posts | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| PUT | /api/communities/{id}/posts/{postId} | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| DELETE | /api/communities/{id}/posts/{postId} | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| GET | /api/communities/{id}/posts/{postId}/comments | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| POST | /api/communities/{id}/posts/{postId}/comments | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| PUT | /api/communities/{id}/posts/{postId}/like | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| GET | /api/communities/{id}/challenges | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| POST | /api/communities/{id}/challenges | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| POST | /api/communities/{id}/challenges/{challengeId}/join | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| PUT | /api/communities/{id}/challenges/{challengeId}/checkins/{date} | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| GET | /api/communities/{id}/challenges/{challengeId}/ranking | 서비스 연결 · 검증 범위 별도 | JWT | CommunityController |
| GET | /api/tasks | 서비스 연결 · 검증 범위 별도 | JWT | TaskController |
| GET | /api/tasks/{taskId} | 서비스 연결 · 검증 범위 별도 | JWT | TaskController |
| POST | /api/tasks | 서비스 연결 · 검증 범위 별도 | JWT | TaskController |
| PUT | /api/tasks/{taskId} | 서비스 연결 · 검증 범위 별도 | JWT | TaskController |
| DELETE | /api/tasks/{taskId} | 서비스 연결 · 검증 범위 별도 | JWT | TaskController |
| PATCH | /api/tasks/{taskId}/status | 서비스 연결 · 검증 범위 별도 | JWT | TaskController |
| POST | /api/tasks/{taskId}/duplicate | 서비스 연결 · 검증 범위 별도 | JWT | TaskController |
| GET | /api/tasks/{taskId}/assignees | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskAssigneeController |
| PUT | /api/tasks/{taskId}/assignees/{userId} | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskAssigneeController |
| DELETE | /api/tasks/{taskId}/assignees/{userId} | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskAssigneeController |
| GET | /api/tasks/{taskId}/checklist-items | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
| POST | /api/tasks/{taskId}/checklist-items | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
| PUT | /api/tasks/{taskId}/checklist-items/{itemId} | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
| PUT | /api/tasks/{taskId}/checklist-items/{itemId}/completion | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
| DELETE | /api/tasks/{taskId}/checklist-items/{itemId} | 구현 완료 · 단위/HTTP 계약 검증 | JWT | TaskChecklistController |
| POST | /api/work/portfolio-links | 서비스 연결 · 검증 범위 별도 | JWT | PortfolioLinkController |
| DELETE | /api/work/portfolio-links/{id} | 서비스 연결 · 검증 범위 별도 | JWT | PortfolioLinkController |
| GET | /api/public/portfolios/{token} | 서비스 연결 · 검증 범위 별도 | 공개 | PortfolioLinkController |
| GET | /api/work/records | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| GET | /api/work/records/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| POST | /api/work/records | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| PUT | /api/work/records/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| DELETE | /api/work/records/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| GET | /api/work/wiki | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| GET | /api/work/wiki/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| POST | /api/work/wiki | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| PUT | /api/work/wiki/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| DELETE | /api/work/wiki/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| GET | /api/work/wbs/nodes | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| GET | /api/work/wbs/nodes/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| POST | /api/work/wbs/nodes | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| PUT | /api/work/wbs/nodes/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| DELETE | /api/work/wbs/nodes/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| GET | /api/work/career/projects | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| GET | /api/work/career/projects/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| POST | /api/work/career/projects | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| PUT | /api/work/career/projects/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| DELETE | /api/work/career/projects/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| GET | /api/work/portfolio | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| GET | /api/work/portfolio/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| POST | /api/work/portfolio | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| PUT | /api/work/portfolio/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
| DELETE | /api/work/portfolio/{id} | 서비스 연결 · 검증 범위 별도 | JWT | WorkController |
