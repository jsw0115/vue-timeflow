# Timeflow API 목록서

기준일: 2026-09-25. 대상: Vue 웹 / Capacitor Android·iOS / Electron PC, Spring Boot, MariaDB.
이 문서는 **구현할 API의 범위와 우선순위**다. 실제 매핑 현황은 [현재 API 목록](current-api-inventory.md), 계약은 [API 설계서](api-design.md), 기존 DTO는 [현재 API 명세](api-specification.md)를 따른다.

## 상태와 버전

- 현재 `/api`: 소스 자동 목록에서 서비스 연결 / 계약 stub / 공용 메모리 시연으로 구분. 서비스 연결도 운영 검증 완료를 뜻하지 않는다.
- 아래 `/api/v1`: 이번에 설계한 **목표 API**이며 아직 서버에 구현되지 않았다. 기존 앱과 호환되는 전환 기간을 두고 도입한다.
- P0: MVP 필수. P1: 협업·신뢰성·확장. P2: 커뮤니티·AI 등.
- 인증 A: 공개, U: 로그인 사용자 + 리소스 소유권, G: 로그인 + 공유/그룹 권한, O: 관리자 역할 + 감사 로그.
- CRUD 약어를 쓰지 않고 메서드를 명시한다. `{id}`는 리소스 ID; 목록 GET은 특별한 설명이 없으면 cursor/limit 사용.

## P0: 계정·홈·기록

모든 경로의 앞부분은 `/api/v1`이다.

| ID | Method | 경로 | 주요 요청 → 결과 | 권한 |
|---|---|---|---|---|
| AUTH-01 | POST | /auth/signup | email, nickname, password, consents → userId | A |
| AUTH-02 | POST | /auth/login | email, password, deviceId → 인증 세션 | A |
| AUTH-03 | POST | /auth/refresh | refresh credential → 회전된 인증 세션 | A |
| AUTH-04 | POST | /auth/logout | 현재 세션 → 204 | U |
| AUTH-05 | POST | /auth/password-reset-requests | email → 존재 여부와 무관하게 202 | A |
| AUTH-06 | POST | /auth/password-resets | token, newPassword → 204, 기존 세션 폐기 | A |
| AUTH-07 | GET | /me | 없음 → 프로필·온보딩 상태 | U |
| AUTH-08 | PATCH | /me | nickname, timezone → 프로필 | U |
| AUTH-09 | PUT | /me/onboarding | mode J/P/B, timezone, startScreen → 설정 | U |
| HOME-01 | GET | /home/summary | date, timezone → 오늘 일정·완료수·실제시간 | U |
| HOME-02 | GET | /notifications | unread, cursor, limit → 알림 목록 | U |
| HOME-03 | PUT | /notifications/{id}/read | read=true → 알림 상태 | U |
| HOME-04 | POST | /notifications/read-all | before → 읽음 처리 수 | U |
| PLAN-01 | GET | /planner/items | from,to,types,statuses,categoryIds,q,timezone,cursor,limit → 통합 기록 | U/G |
| PLAN-02 | GET | /planner/summary | from,to,timezone → 유형별·날짜별 합계 | U/G |
| EVENT-01 | GET | /events/{id} | occurrenceDate 선택 → 일정 상세 | U/G |
| EVENT-02 | POST | /events | EventWrite → 일정 | U |
| EVENT-03 | PATCH | /events/{id} | 변경 필드, If-Match → 일정 | U/G |
| EVENT-04 | DELETE | /events/{id} | If-Match → 204, 휴지통 이동 | U/G |
| TASK-01 | GET | /tasks | dueFrom,dueTo,status,categoryId,cursor → 할 일 목록 | U |
| TASK-02 | GET | /tasks/{id} | 없음 → 상세·이월 이력 | U/G |
| TASK-03 | POST | /tasks | TaskWrite → 할 일 | U |
| TASK-04 | PATCH | /tasks/{id} | 변경 필드, If-Match → 할 일 | U/G |
| TASK-05 | PUT | /tasks/{id}/status | status, If-Match → 목표 상태 | U/G |
| TASK-06 | DELETE | /tasks/{id} | If-Match → 204 | U |
| TASK-07 | POST | /tasks/{id}/duplicates | due, Idempotency-Key → 새 할 일 | U |
| TASK-08 | GET | /tasks/{id}/rollovers | cursor → 자동 이월 내역 | U |
| ROUTINE-01 | GET | /routines | active,date → 루틴 | U |
| ROUTINE-02 | POST | /routines | RoutineWrite → 루틴 | U |
| ROUTINE-03 | GET | /routines/{id} | 없음 → 상세 | U |
| ROUTINE-04 | PATCH | /routines/{id} | 변경 필드, If-Match → 루틴 | U |
| ROUTINE-05 | DELETE | /routines/{id} | If-Match → 204 | U |
| ROUTINE-06 | PUT | /routines/{id}/logs/{date} | status DONE/MISSED/SKIP, version → 날짜별 기록 | U |
| ROUTINE-07 | GET | /routines/{id}/history | from,to → 수행일·달성률 | U |
| DIARY-01 | GET | /diaries | from,to,cursor → 캘린더/목록 요약 | U |
| DIARY-02 | GET | /diaries/{date} | 없음 → 일간 회고 | U |
| DIARY-03 | PUT | /diaries/{date} | mood,summary,body,gratitude → 저장 | U |
| DIARY-04 | DELETE | /diaries/{date} | If-Match → 204 | U |
| MEMO-01 | GET | /memos | status,q,cursor → 인박스 | U |
| MEMO-02 | POST | /memos | title,body,tags → 메모 | U |
| MEMO-03 | GET | /memos/{id} | 없음 → 메모 | U |
| MEMO-04 | PATCH | /memos/{id} | title,body,status,tags, If-Match → 메모 | U |
| MEMO-05 | DELETE | /memos/{id} | If-Match → 204 | U |
| TIME-01 | GET | /time-entries | from,to,type,timezone → PLAN/ACTUAL 블록 | U |
| TIME-02 | POST | /time-entries | TimeEntryWrite → 실제/계획 블록 | U |
| TIME-03 | PATCH | /time-entries/{id} | 변경 필드, If-Match → 블록 | U |
| TIME-04 | DELETE | /time-entries/{id} | If-Match → 204 | U |
| DDAY-01 | GET | /ddays | cursor → D-Day 목록 | U |
| DDAY-02 | POST | /ddays | title,targetDate,repeatYearly → D-Day | U |
| DDAY-03 | PATCH | /ddays/{id} | 변경 필드 → D-Day | U |
| DDAY-04 | DELETE | /ddays/{id} | 없음 → 204 | U |
| STAT-01 | GET | /statistics/overview | from,to,timezone → 할 일/루틴/회고 집계 | U |
| STAT-02 | GET | /statistics/plan-actual | from,to,timezone,groupBy → 시간 비교 | U |
| SET-01 | GET | /me/settings | 없음 → 설정 | U |
| SET-02 | PATCH | /me/settings | mode,startScreen,defaultVisibility,notifications → 설정 | U |
| SET-03 | GET | /categories | scope → 시스템+내 카테고리 | U |
| SET-04 | POST | /categories | name,color,scope,parentId → 카테고리 | U |
| SET-05 | PATCH | /categories/{id} | 변경 필드 → 카테고리 | U |
| SET-06 | DELETE | /categories/{id} | 없음 → 204, 과거 기록 스냅샷 유지 | U |

## P1: 추가 권장 기능 및 공유

| ID | Method | 경로 | 목적·핵심 계약 | 권한 |
|---|---|---|---|---|
| SYNC-01 | GET | /sync/changes | opaque cursor,limit → 변경·삭제 tombstone·nextCursor | U |
| SYNC-02 | POST | /sync/mutations | 최대 50개 clientMutationId,baseVersion,operation → 개별 결과 | U |
| SESSION-01 | GET | /me/sessions | 로그인된 기기·최근 사용시각; 토큰 원문 제외 | U |
| SESSION-02 | DELETE | /me/sessions/{id} | 분실 기기 세션 취소 | U |
| DEVICE-01 | PUT | /me/devices/{deviceId} | platform,pushToken,appVersion → 등록/갱신 | U |
| DEVICE-02 | DELETE | /me/devices/{deviceId} | 푸시 토큰과 기기 연결 해제 | U |
| SEARCH-01 | GET | /search | q,types,from,to,cursor → 권한 범위 통합 검색 | U/G |
| TRASH-01 | GET | /trash | type,cursor → 삭제 기록 | U |
| TRASH-02 | POST | /trash/{type}/{id}/restore | retention 내 복구, 충돌 시 409 | U |
| REPEAT-01 | POST | /events/series | RRULE,timezone,until 또는 count → 반복 시리즈 | U |
| REPEAT-02 | PATCH | /events/{id}/occurrences/{occurrenceKey} | scope SINGLE/FUTURE → 회차 변경 | U/G |
| REPEAT-03 | DELETE | /events/{id}/occurrences/{occurrenceKey} | scope SINGLE/FUTURE → 회차 취소 | U/G |
| POLICY-01 | GET | /me/task-rollover-policy | 규칙·최근 실행 | U |
| POLICY-02 | PUT | /me/task-rollover-policy | enabled,target NEXT_DAY/NEXT_WORKDAY,maxCount → 규칙 | U |
| SHARE-01 | GET | /friends | status,cursor → 관계 | U |
| SHARE-02 | POST | /friend-invitations | recipientId → 초대 | U |
| SHARE-03 | PUT | /friend-invitations/{id}/response | ACCEPT/REJECT → 관계 | U |
| SHARE-04 | DELETE | /friends/{id} | 관계 해제 | U |
| GROUP-01 | GET | /calendar-groups | 가입 그룹 목록 | G |
| GROUP-02 | POST | /calendar-groups | name → 그룹 | U |
| GROUP-03 | PATCH | /calendar-groups/{id} | name,note → 그룹 | G owner |
| GROUP-04 | DELETE | /calendar-groups/{id} | 그룹 삭제 | G owner |
| GROUP-05 | GET | /calendar-groups/{id}/members | 그룹 멤버 | G |
| GROUP-06 | POST | /calendar-groups/{id}/invitations | recipientId,role → 초대 | G owner |
| GROUP-07 | PUT | /calendar-groups/{id}/members/{userId} | role VIEWER/EDITOR → 권한 | G owner |
| GROUP-08 | DELETE | /calendar-groups/{id}/members/{userId} | 멤버 제거 | G owner |
| ACL-01 | GET | /events/{id}/shares | 공유 대상 목록 | G owner |
| ACL-02 | PUT | /events/{id}/shares/{userId} | role,editScope,deleteScope → 공유 권한 | G owner |
| ACL-03 | DELETE | /events/{id}/shares/{userId} | 공유 철회 및 캐시 무효화 | G owner |
| BLOCK-01 | PUT | /me/blocks/{userId} | 차단·관련 공유 제한 | U |
| EXPORT-01 | POST | /data-jobs | type EXPORT/IMPORT,format,fileId → jobId(202) | U |
| EXPORT-02 | GET | /data-jobs/{id} | 처리상태·만료 다운로드 링크 | U |
| FILE-01 | POST | /uploads | MIME,size,purpose → 제한된 업로드 URL | U |
| FILE-02 | POST | /uploads/{id}/complete | 검사 대기/완료 상태 | U |
| OAUTH-01 | POST | /auth/oauth/{provider}/exchange | authorizationCode,codeVerifier,state → 세션 | A |
| ADMIN-01 | GET | /admin/users | q,status,cursor → 사용자 관리 요약 | O |
| ADMIN-02 | PATCH | /admin/users/{id}/status | status,reason → 변경·감사 기록 | O |
| ADMIN-03 | GET | /admin/audit-logs | from,to,actorId,cursor → 비밀정보 제외 로그 | O |

## P2: 제품 확장

| ID | Method | 경로 | 목적·제약 | 권한 |
|---|---|---|---|---|
| AI-01 | POST | /memos/{id}/task-suggestions | AI/규칙 기반 할 일 초안, 자동 저장 금지 | U |
| AI-02 | POST | /diaries/{date}/suggestions | 허용한 기록으로 회고 초안(202) | U |
| AI-03 | GET | /ai-jobs/{id} | 작업 상태·초안 | U |
| STT-01 | POST | /memos/{id}/transcriptions | 검사 완료 voiceFileId → 작업(202) | U |
| FOCUS-01 | POST | /focus-sessions | goal,duration → 집중 세션 | U |
| FOCUS-02 | PUT | /focus-sessions/{id}/completion | actualEnd → 완료; 이중 타임블록 방지 | U |
| COMMUNITY-01 | GET | /community/posts | cursor → 공개·가입 범위 게시글 | U |
| COMMUNITY-02 | POST | /community/posts | 기록 선택·공개 미리보기 확정 → 사본 게시 | U |
| COMMUNITY-03 | DELETE | /community/posts/{id} | 본인/관리자 삭제 | U/O |
| RANK-01 | GET | /community/rankings | period,groupId → 동의한 사용자만 순위 | G |
| STICKER-01 | GET | /me/achievements | period → 달성 스티커 이력 | U |
| CHAT-01 | GET | /chat/rooms/{id}/messages | cursor → 멤버만 메시지 | G |
| CHAT-02 | POST | /chat/rooms/{id}/messages | text 또는 권한 확인된 recordRef → 메시지 | G |
| CALSYNC-01 | POST | /calendar-connections | provider,authorizationCode → 암호화 연동정보 | U |
| CALSYNC-02 | POST | /calendar-connections/{id}/sync-jobs | Idempotency-Key → 작업(202) | U |
| REPORT-01 | POST | /reports/jobs | from,to,template → 보고서 생성(202) | U |
| REPORT-02 | GET | /reports/{id} | 권한 범위 보고서 | U/G |

기존 UI에 있는 주소록·머니로그·WBS·위키·구독 결제는 원래 MVP 밖의 추가 화면이다. 이번 목록의 서비스 구현 대상으로 확정하지 않으며 별도 도메인 요구사항 합의 후 추가한다. 화면이 있다는 이유만으로 실제 결제·개인정보 보관 API를 열지 않는다.
