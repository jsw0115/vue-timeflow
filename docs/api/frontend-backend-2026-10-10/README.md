# 프런트엔드 기능 기준 API와 백엔드 구현.

기준일은 2026-10-10이다. 현재 Vue 라우트, `frontend/src/store/`, 통합 작성 폼과 기존 Spring 컨트롤러를 대조했다. 기존 Java 17 / Spring Boot / Gradle / MySQL 구조를 유지하면서 개인 기록, 업무, 소셜, 설정, 관리자 기능을 구현했다. 기존 계약의 빈 응답 stub 52개와 공유 메모리 플래너를 실제 처리 소스로 교체했다.

컨트롤러에 선언된 HTTP 매핑은 **277개**다. 이 중 **13개는 외부 제공자 경계**이며 실행 요청은 503을 반환한다. 채팅 경로는 `CHAT_ENABLED=true`에서 등록된다. 설정 `{section}` 경로는 허용된 섹션으로만 사용한다. 매핑 개수는 전체 화면 연결 또는 모든 API의 운영 DB 검증 완료를 의미하지 않는다.

- [전체 API 목록](catalog.md).
- [각 API의 요청 필드·파라미터·권한·HTTP 상태](specification.md).
- [OpenAPI 3.1 JSON](openapi.json). Swagger Editor 등에서 불러올 수 있다.
- [소스 대조용 operations JSON](operations.json).
- [테스트 명령·결과·검증 범위](verification.md).
- [외부 제공자 연동 규약](integrations.md).
- [계획](plan.md), [체크리스트](checklist.md), [작업 맥락](context-notes.md).

기존 `docs/api-info/current-contract.md`의 2026-10-03 목록 및 `/api/v1` 목표 설계는 과거 자료다. 이번 구현은 실제 `/api` 경로를 사용한다. 프런트엔드 store를 서버 요청으로 전환하는 작업은 이번 변경에 포함하지 않았다.

## 화면·기능과 API 매핑.

| 프런트엔드 근거 | 필요한 서버 처리 | API 경로 | 기능별 백엔드 소스 |
|---|---|---|---|
| `store/postComposer.js`, `components/PostComposer.vue`, `EventDateFields.vue`, `RepeatSettings.vue` | 다일 일정·요일/월/연 반복 | `/schedules`, `/schedules/occurrences` | `records/ScheduleController`, `ScheduleService`, `feature/RecurrenceRule` |
| 통합 작성의 할 일·루틴, `store/postIndex.js` | 할 일·체크리스트·담당자, 목표가 있는 루틴·완료 이력 | `/tasks`, `/tasks/{taskId}/checklist-items`, `/tasks/{taskId}/assignees`, `/routine-records`, `/routine-records/{id}/history` | 기존 `task/`, `records/ScheduleController` |
| `store/writing.js`, `views/diary/` | 메모·일기 CRUD, 월별 일기 수, 메모를 할 일로 전환 | `/memos`, `/memos/{id}/convert-to-task`, `/diaries`, `/diary/calendar` | `records/RecordsController`, `RecordActionsController`, `contract/EventDiaryMemoController` |
| `store/ddays.js`, `store/money.js`, `views/focus/FocusView.vue` | D-Day, 수입·지출, 집중 세션 | `/ddays`, `/money/entries`, `/money/summary`, `/focus/sessions` | `records/RecordsController`, `RecordService` |
| `store/plannerReviews.js`, `plannerPreferences.js`, `canvas.js`, `views/planner/` | 개인 플래너, 기본 뷰, 회고, 캔버스, 템플릿 적용 | `/planner/items`, `/planner/preferences`, `/planner/reviews/{date}`, `/planner/canvas`, `/planner/templates`, `/events/templates` | `planner/`, `records/RecordActionsController` |
| `store/workRecords.js`, `wiki.js`, `views/work/WbsView.vue` | 업무 유형별 기록, 계층형 WBS와 가중 진행률, 위키 이력 | `/work/records`, `/work/wbs`, `/work/wbs/nodes`, `/work/wiki`, `/work/wiki/{id}/history` | `work/WorkController`, `WorkService` |
| `views/work/CareerDocsView.vue`, `store/workPrivacy.js` | 경력 프로젝트·이력서·포트폴리오, 선택 항목 공개 링크 | `/work/career/projects`, `/work/resume`, `/work/portfolio`, `/work/portfolio-links`, `/public/portfolios/{token}` | `work/WorkController`, `PortfolioLinkController` |
| `views/work/WorkReportView.vue`, `LaborReportView.vue` | 시간 블록 조회, 규칙 기반 초안, 리포트 저장 | `/reports/time-blocks`, `/reports/draft`, `/reports/{reportKey}`, `/reports/{reportKey}/sub-reports` | `contract/ReportController`, `records/InsightService` |
| `store/people.js`, `sharePermissions.js`, `views/share/` | 친구 요청·수락·거절, 차단, 공유 그룹·초대 수락 | `/share/friends`, `/share/blocks`, `/share/groups` | `contract/ShareController`, `social/SocialService` |
| `store/communities.js`, `communityPosts.js`, `views/community/` | 공개/비공개 커뮤니티, 가입 승인·정원, 게시글·댓글·좋아요·신고, 챌린지·인증·랭킹 | `/communities` 및 하위 경로, `/admin/moderation` | `social/CommunityController`, `ModerationController`, `SocialService` |
| `store/attachments.js`, `mediaShare.js`, `views/share/SharedFilesView.vue` | 파일 바이트 저장·권한 검사·다운로드·보관 기간 | `/attachments` 및 하위 경로 | `records/AttachmentController` |
| `store/dashboard.js`, `statsPortlets.js`, 검색 모달·워커 | 실제 기록 통계·홈 요약·개인 검색·태그 | `/home/summary`, `/stat/dashboard`, `/stat/category`, `/stat/plan-actual`, `/stat/focus`, `/search`, `/search/tags` | `contract/InsightController`, `records/InsightService`, `SearchController` |
| `store/contacts.js`, 알림 화면 | 연락처·알림 읽음·삭제 | `/contacts`, `/notifications` | `records/ContactsController`, `RecordActionsController` |
| `store/appearance.js`, `modeProfiles.js`, `automations.js`, `aiSettings.js`, `views/settings/` | 설정 JSON 저장, 실제 계정 프로필·비밀번호·세션·내보내기 | `/settings/{section}`, `/user/profile`, `/user/password`, `/user/sessions`, `/user/data/export` | `contract/SettingsController`, `UserProfileController`, `operations/SettingsService` |
| `store/adminOps.js`, `views/admin/`, 고객 지원 | 관리자 사용자·콘텐츠·공지·문의 답변·감사·신고 처리·시스템 지표 | `/admin/users`, `/admin/content`, `/admin/notices`, `/admin/tickets`, `/admin/audit`, `/admin/moderation`, `/support/tickets`, `/notices`, `/content` | `contract/AdminController`, `operations/AdminService`, `SupportController` |
| `features/chat/` | 방·메시지·검색·읽음·실시간 이벤트 | `/chat` 하위 경로 | 기존 `chat/`. [기존 채팅 계약](../../chat/api/catalog.md) |
| AI·음성·외부 캘린더·결제·소셜 로그인·알림톡·공동 집중 영상 | 제공자 상태 조회·연동 실행 경계 | `/integrations/capabilities`, `/insight/generate`, `/memos/stt`, `/sync`, `/billing`, `/user/social-accounts`, `/cofocus/rooms` | `integration/IntegrationController`. [연동 규약](integrations.md) |

위 경로에는 `/api` 접두사가 붙는다. 기존 `/events`, `/routines`, `/planner/daily|weekly|monthly|yearly|upcoming` 등도 유지한다. **새 `/schedules`, `/routine-records`와 기존 `/events`, `/routines`는 다른 저장 모델이며 자동 동기화하지 않는다.** 새 작성 흐름은 새 모델을 사용해야 한다. 홈·통계·개인 검색은 두 모델을 함께 조회하므로 같은 기록을 양쪽에 중복 저장하면 중복 집계될 수 있다.

테마 렌더링, 폼 스타일, 검색 UI, 드래그, 로컬 프리뷰, 문서/PDF 렌더링처럼 브라우저에서 수행하는 기능은 별도 서버 실행 API가 필요하지 않다. 서버에는 필요한 설정·원본 데이터를 저장한다. 설정 저장만으로 자동화 실행·예약 알림 발송·외부 동기화를 수행하지 않는다.

## 공통 계약.

- Base URL은 기본 `http://localhost:8080/api`다. `Content-Type: application/json`을 사용하고 multipart·파일·SSE는 예외다.
- 공개 회원가입·로그인·refresh·포트폴리오 링크 조회 외에는 `Authorization: Bearer <accessToken>`이 필요하다. 사용자 ID는 JWT에서 결정하며 개인 데이터의 owner를 본문으로 지정할 수 없다.
- `/admin/**`는 Spring Security와 서비스에서 현재 DB 계정의 ACTIVE·ADMIN 권한을 검사한다. 개인 ID를 타인이 조회/변경하면 404, 회원/역할 부족은 403이다.
- 일반 성공은 `{ "success": true, "data": ..., "message": null }`, 오류는 `{ "success": false, "data": null, "message": "설명" }`이다. 오류 JSON에 ErrorCode 이름은 없다. 삭제 204는 본문이 없다. 파일 다운로드는 바이트, 채팅 SSE는 `text/event-stream`이다.
- 일반 생성은 201, 조회/수정은 200, 삭제는 204다. 날짜별 저장·설정 등 개별 API의 실제 성공 상태는 상세 명세를 따른다.
- 400은 입력 오류, 401은 인증 없음·만료·폐기, 403은 권한 부족, 404는 없음·타인 데이터·만료 링크, 409는 버전/상태/정원 충돌, 503은 제공자 미설정이다. 서버의 예상하지 못한 오류는 500이다. 업로드 크기 초과는 multipart 처리에서 413으로 거부될 수 있다.
- 새로운 목록 응답은 `{items,page,size,total}`이며 page는 0부터, size는 1~100, 기본 20이다. 명시된 API만 `from/to/q/category` 필터를 받는다. 기존 API의 배열·커서 페이지 응답은 그대로 유지한다.
- 날짜는 유효한 `YYYY-MM-DD`, 시간은 `HH:mm`, 실제 순간은 offset이 있는 ISO timestamp다. 자동 기본 날짜·가입 마감·체크인 제한은 Asia/Seoul 기준이다. 개인 기록의 벽시계 시간은 UTC 순간으로 자동 변환하지 않는다.
- 새로운 개인/업무 CRUD 응답은 payload와 `id/version/createdAt/updatedAt`을 포함한다. 생성 버전은 1이다. PUT은 부분 patch가 아니라 본문 교체이므로 필수 필드를 모두 보내야 한다. PUT 본문의 `version`, DELETE query의 `version`은 현재 값이 필요하다. 성공 수정 시 증가하며 오래된 버전은 409다.
- 날짜별 일기/회고·설정·캔버스·이력서 최초 저장에는 version을 생략할 수 있다. 기존 행 변경에는 현재 버전이 필요하다. 미저장 설정·캔버스·이력서 조회는 version 0이며, 회고 미저장 조회는 404다.
- 일반 문자열은 200자, 본문·인수인계는 20,000자, 배열은 500개, feature payload는 128 KiB까지다. 허용되지 않은 입력 필드는 400으로 거부한다. 중첩 JSON은 깊이 8·객체 100필드 제한이다. 조건별 제약은 FeatureInput과 아래 규약을 적용한다.

## 작성·기록 규약.

새 일정은 `title/startDate/endDate/startTime/endTime`이 필수이며 종료가 시작 이후여야 한다. 최대 기간은 366일이다. `attendeeIds`는 메타데이터로만 저장하고 공유 권한을 부여하지 않는다. `/schedules/occurrences?from=...&to=...`는 반복 규칙을 적용하고 다일 일정의 겹치는 회차도 반환한다. `sourceId`는 원본 ID, `occurrenceKey`는 `<id>:<시작일>`이다. 회차를 수정하는 별도 예외 API는 없고 원본 시리즈를 수정한다.

`recurrence`는 `{frequency,interval,weekdays,endMode,until,count}`다. frequency는 `none/daily/weekly/monthly/yearly`, interval은 1~99, 요일은 일요일 0~토요일 6이다. none 외에는 interval/endMode가 필요하다. weekly는 weekdays가 필요하고 endMode는 `never/until/count`다. until은 시작일 이상, count는 1~999다. 존재하지 않는 월말·윤년 날짜는 다음 유효 회차로 건너뛰며 count는 유효 회차 수다. 최대 조회 구간은 양 끝 포함 367일이다.

새 루틴은 `title/startDate/time/duration/days/goal`이 필수다. goal은 `{count:1~9999,unit}`이고 duration은 1~1440분, days는 요일 숫자 배열이다. 유효 recurrence가 있으면 그 규칙을 적용하고 없거나 none이면 days로 반복한다. paused면 예정 회차가 없다. `/history/{date}`의 `{completed:true|false}`는 같은 값의 반복 요청에 대해 같은 결과를 반환한다. 이미 저장한 값을 변경할 때는 version이 필요하다. 미래 또는 예정되지 않은 날짜는 400이다. history의 rate/streak/best는 **요청한 구간 안의 예정 회차**를 기준으로 한다. 과거 로그는 루틴 원본 변경 뒤에도 저장되어 있지만 현재 회차 규칙 밖의 로그는 집계하지 않는다.

일기는 `/diaries`에서 날짜당 여러 건을 만들 수 있다. `/diary/{date}` POST는 날짜를 ID로 쓰는 호환 저장이며 URL 날짜가 본문보다 우선한다. 같은 날짜의 별도 ID 일기를 덮어쓰지 않는다. 해당 날짜 DELETE도 날짜 키 행 하나만 삭제한다. `/diary/calendar`는 날짜별 실제 일기 개수다. 메모 날짜를 생략하면 오늘이 저장되며 할 일 전환은 메모 버전 확인·Task 생성·메모 삭제가 하나의 트랜잭션이다.

머니로그는 KRW 정수다. `type=in`이면 양수, `out`이면 음수, 0은 거부한다. 요약의 expense는 양수, balance는 income-expense다. 페이지 크기와 관계없이 전체 필터 구간을 집계한다. 집중 기록은 mode `pomodoro/stopwatch/free`, duration 1~1440분, startedAt 필수, endedAt은 시작 이후다. 집중 통계는 완료 세션의 실제 timestamp 차이를 분으로 집계한다.

템플릿 적용은 실제 일정 또는 플래너 항목을 생성한다. 이벤트 템플릿은 같은 날짜 내에 끝나야 하고 반복/알람 필드는 저장 메타데이터이며 적용 시 반복 시리즈나 알람 작업을 만들지 않는다. 플래너 캔버스는 개인 singleton이며 컬럼/카드 ID 중복, 없는 컬럼 참조, 잘못된 우선순위·체크리스트를 거부한다. 카드의 assignee/plannerBlock은 참조 메타데이터이고 타인 기록을 변경하지 않는다. 기존 `/planner/items`의 수정은 version 방식이 아닌 마지막 쓰기가 우선한다.

홈/통계는 기존 일정·할 일, 새로운 일정 회차, 개인 플래너와 완료 집중 세션의 실데이터를 사용한다. 계획 시간은 일정 회차와 ACTUAL이 아닌 플래너 항목의 합계, 실제 시간은 ACTUAL 플래너 항목의 합계다. 같은 시간 블록을 일정과 플래너에 이중 저장한 경우 자동 중복 제거하지 않는다. 루틴의 예정 시간과 업무 휴가 시간은 이 합계에 자동 가산하지 않는다. `/reports/draft`는 조회한 시간 블록을 텍스트로 조합하는 규칙 기반 초안이며 AI 호출은 아니다.

## 업무·공개 범위.

업무 기록의 type은 `연차/반차/외근/출장/이직`이다. 공통 필수는 title/type/owner/startDate/endDate/startTime/endTime이며 시간 역전을 거부한다. owner는 화면의 담당 표시 문자열이고 데이터 소유자는 JWT 사용자다. 반차는 같은 날짜·오전/오후, 연차는 0.5일 단위 leaveDays, 외근/출장은 location, 출장은 expense, 이직은 toCompany/role이 필요하다.

WBS 부모는 같은 사용자의 노드여야 하며 순환·100단계 초과 계층은 거부한다. leaf의 md·progress로 상위 노드의 가중 진행률을 계산하며 부모 md는 별도로 합산하지 않는다. md 합계 0이면 가중 진행률도 0이다. 노드 삭제 시 하위 노드도 삭제한다. 위키 수정 시 이전 payload를 서버 이력으로 보관하고 이력 자체의 수정/삭제는 거부한다. 부모 문서 삭제 시 자식을 상위 부모로 올린다.

업무 기록·위키·WBS·경력·이력서는 항상 사용자 범위다. 친구·커뮤니티·첨부 권한으로 노출하지 않는다. 포트폴리오 공개는 `/work/portfolio-links`에 본인이 소유한 itemIds를 명시하는 방식이다. 32바이트 랜덤 토큰을 한 번 반환하고 DB에는 SHA-256 해시를 저장한다. 7일 후 만료하며 DELETE로 즉시 폐기할 수 있다. 공개 조회는 선택한 PORTFOLIO payload만 반환하며 경력·이력서·업무 기록은 포함하지 않는다. 선택 항목을 삭제하면 링크 응답에서 빠지고 계정이 정지/삭제되면 링크는 404다. `portfolioVisibility=link` 설정만으로 링크가 발급되지 않는다.

## 소셜·관리자·파일 규약.

친구 초대는 서버가 발신자를 결정한다. 수신자만 accept/reject할 수 있고 같은 쌍의 중복 초대는 409다. 차단하면 친구 관계와 자신이 소유한 공유 그룹의 대상 회원 관계를 제거한다. 커뮤니티 차단은 게시글·댓글·랭킹 조회 필터이며 회원을 자동 추방하지 않는다.

그룹은 초대 수락 후 ACTIVE 회원만 상세·회원·파일을 조회한다. 커뮤니티 public은 인증 사용자에게 메타데이터를 제공하고 private은 회원/초대 정보가 없으면 숨긴다. 글·댓글·좋아요·챌린지는 ACTIVE 회원에게만 허용한다. 그룹/커뮤니티 생성자는 owner이며 관리·초대·승인·삭제 권한을 가진다. viewer/editor는 현재 모두 일반 회원 기능을 사용하며 owner 권한을 갖지 않는다. owner는 공간 삭제로만 탈퇴할 수 있다. 정원은 owner 포함 2~500명이며 승인 때도 검사한다.

게시글은 작성자만 수정하고 작성자 또는 공간 owner가 삭제할 수 있다. authorId/name은 서버가 설정한다. 목록의 likes/comments/liked는 실제 관계/댓글에서 조회한다. liked와 챌린지 날짜 인증은 값 설정·중복 인증에 대해 멱등이다. 인증은 챌린지 기간 내 비미래 날짜만 가능하며 랭킹은 인증 일수만 집계하고 개인 업무 정보를 포함하지 않는다. 신고 처리는 현재 ADMIN만 가능하고 REMOVE는 실제 게시글을 삭제하며 감사 기록을 남긴다.

첨부는 multipart로 실제 바이트를 저장한다. 파일당 1바이트~10 MiB, retentionDays는 0~365이고 0은 무기한이다. domain은 memo/diary/event/personal만 허용하며 업무 파일 공유는 거부한다. 개인 파일은 owner, 그룹 파일은 owner 또는 ACTIVE 그룹 회원이 다운로드할 수 있다. 차단 관계의 타인 파일은 숨긴다. 삭제·보관 기간 변경은 owner만 가능하고 만료 파일을 다시 활성화하지 않는다. purge-expired는 본인 소유의 만료 파일만 실제 삭제한다. 다운로드는 attachment/octet-stream/no-store로 응답한다. 파일 목록에는 만료 메타데이터가 남을 수 있지만 만료 파일 바이트는 404다.

관리자 사용자 정지/삭제·역할 변경·강제 로그아웃은 refresh와 이미 발급된 access token을 무효화한다. 자기 ADMIN 권한 제거·자기 삭제는 거부한다. 비밀번호 변경도 전체 토큰을 폐기한다. 비밀번호는 기존 정책인 8~72자·공백 금지·영문/숫자/특수문자 중 2종 이상을 적용한다. 세션 하나 삭제는 해당 refresh token을 폐기하며 access token은 TTL까지 유지될 수 있다. 전체 세션 삭제는 auth_version으로 즉시 무효화한다.

## 설정·검색·내보내기.

설정 section은 `general/categories/notifications/share-visibility/theme-sticker/appearance/mode-profiles/form-style/dashboard/stats-portlets/automation/ai/work-privacy/security/widgets/integrations`만 허용한다. 본문은 `{value:object|array,version?}`다. 중첩 위치에서도 apiKey/password/secret/cardNumber/accessToken/refreshToken 필드를 거부한다. 2FA 활성화는 제공자 미설정 상태에서 503이다. UI 설정과 관리자 설정 저장은 서버 작업 스케줄·인프라 제한을 적용하는 명령이 아니다.

프로필은 실제 users의 nickname/timeZone을 수정하고 intro/mode는 개인 설정으로 저장한다. 개인 검색은 본인의 새로운 기록·업무·레거시 할 일·루틴과 현재 ±1년의 레거시 일정을 조회한다. 별도의 채팅 검색은 기존 채팅 API를 이용한다. 커뮤니티 전체 내용은 개인 검색에 포함하지 않는다. 태그는 본문/제목 해시태그와 일기·메모의 tags 배열에서 추출한다.

`/user/data/export`는 프로필과 본인 소유의 feature_record JSON을 반환한다. 기존 task/event/routine/planner 테이블과 파일 바이트, 시스템 소유 커뮤니티 데이터는 포함하지 않는다. 전체 계정 백업 또는 PDF/Excel 렌더링 API로 취급하지 않는다.

## 저장 구조·실행·검증 한계.

`db/workspace/V6__frontend_feature_records.sql`은 feature_record/member/friend/block/file 테이블, planner_item.user_id, users.auth_version을 추가한다. 이전 소유자 없는 planner 행은 숨기며 임의로 사용자에게 귀속하지 않는다. 실제 로컬 DB에는 이번 작업에서 migration을 실행하지 않았다. 기존 DB 백업·Flyway 이력 확인 뒤 정상 기동 과정에서 적용해야 한다. Flyway clean은 비활성화 상태를 유지한다.

feature_record는 사용자·종류·ID 복합키와 검증된 JSON payload를 사용한다. 서비스가 트랜잭션과 버전 비교를 수행하며 타인 owner로 저장하지 않는다. 목록/집계는 현재 사용자의 기록을 읽은 뒤 메모리에서 필터링한다. 소규모 현재 기능을 위한 구현이며 대량 데이터에서는 전용 정규화 테이블·SQL 필터·페이지 처리로 전환해야 한다. 파일 바이트도 DB에 저장하므로 추후 스토리지 제공자가 결정되면 저장 어댑터를 교체한다. 별도 예약 purge·외부 알림 워커는 없다.

기존 backend `.env` 예시와 application.yml의 DB/JWT/CORS 구성을 사용한다. 비밀값은 커밋하지 않는다. Windows 실행은 다음과 같다.

```powershell
cd backend
.\gradlew.bat bootRun
```

실행용 JAR은 `backend/build/libs/`에 생성한다. Java 테스트는 H2와 mock 계정 저장소를 사용하는 범위 테스트, 기존 서비스 단위 테스트, MockMvc 계약 테스트다. 운영 MySQL·Redis·외부 제공자 E2E 검증 또는 모든 277개 route의 HTTP 검증을 주장하지 않는다. 정확한 통과 명령과 테스트 개수는 [검증 기록](verification.md)에 남긴다.

문서 재생성과 대조 명령은 다음과 같다.

```powershell
cd frontend
node scripts/frontend-api-contract.mjs
node scripts/frontend-api-contract.mjs --check
npm run docs:api
node scripts/api-inventory.mjs --check
node --test tests/frontend-api-contract.test.mjs
```

상세 문서와 OpenAPI는 소스에서 생성한다. 새 Map 본문이 계약 없이 추가되거나 OpenAPI 참조가 누락되면 생성기가 실패한다. 개별 필드의 조건부 정책은 이 규약과 FeatureInput을 함께 확인한다.
