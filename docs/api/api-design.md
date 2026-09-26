# Timeflow API 설계서

기준일 2026-09-25 · 상태: 구현 전 목표 계약. [API 목록서](api-catalog.md)의 /api/v1을 설계한다.
기존 /api의 실제 요청 형식은 [현재 API 명세](api-specification.md)에서 별도로 관리한다.

## 1. 구조와 전환

Vue 웹·Capacitor·Electron은 같은 API와 도메인 모델을 사용한다. 화면 폭은 클라이언트 책임이다. 모바일 전용 URL이나 모바일용 DB를 만들지 않는다. Spring Boot 모듈(auth, planner, event, task, routine, diary, memo, statistics, settings, share)은 하나의 MariaDB와 트랜잭션 관리자를 공유한다. controller → application service → repository 순서이며 컨트롤러에서 엔티티를 직접 반환하지 않는다.

현재 /api는 유지하고 새 계약을 /api/v1으로 제공한다. v1 계약 테스트·사용자별 데이터 이관·클라이언트 전환 완료 뒤 기존 API 종료일을 공지한다. 엔드포인트만 만들어 200 성공 stub을 반환하는 구현은 완료로 취급하지 않는다.

## 2. 공통 계약

- JSON UTF-8. 제목 1~200자, 메모/회고 본문 최대 50,000자, 검색어 1~100자. 잘못된 enum/필드는 400. HTML은 저장하더라도 렌더 시 정화한다.
- path ID는 opaque string으로 취급한다. 기존 events BIGINT는 v1 DTO에서 decimal string으로 직렬화해 JS 정밀도 손실을 막는다. 신규 ID는 ULID. 기존 DB PK를 일괄 변경하지 않는다.
- 실제 시각은 ISO-8601 UTC (예: 2026-09-25T00:00:00Z), 날짜는 YYYY-MM-DD, timezone은 검증된 IANA ZoneId. 종일 일정은 endDateExclusive를 사용한다.
- GET 날짜 범위는 [from,to), 기본 최대 93일. 연간 요약은 별도 집계로 최대 366일 허용. limit 기본 30, 1~100.
- 목록은 (sortDate, type, id) 정렬 + opaque cursor. cursor는 사용자·필터 해시에 묶는다. from/to/timezone이 달라지면 cursor 재사용 400.
- JWT의 subject로 소유자를 결정한다. body의 userId/role/ownerId는 일반 쓰기 DTO에서 받지 않는다.
- 200 조회/수정, 201 생성+Location, 202 비동기 작업, 204 삭제(본문 없음). 400 형식, 401 인증, 403 기능 권한, 404 없음 또는 다른 사람의 비공개 기록, 409 도메인 충돌, 412 버전 충돌, 413 크기, 415 형식, 422 유효하지 않은 시간관계, 429 빈도 초과, 500 내부 오류.
- 오류 응답에 SQL·파일경로·스택·토큰을 넣지 않는다. 요청 추적 ID로 서버 로그와 연결한다.

성공 목록:
~~~json
{
  "success": true,
  "data": {
    "items": [],
    "nextCursor": null,
    "hasNext": false
  },
  "message": null,
  "meta": { "requestId": "req-example", "serverTime": "2026-09-25T01:00:00Z" }
}
~~~

실패:
~~~json
{
  "success": false,
  "data": null,
  "message": "기록이 변경되었습니다. 최신 내용을 확인해주세요.",
  "error": { "code": "VERSION_CONFLICT", "fields": [] },
  "meta": { "requestId": "req-example" }
}
~~~

## 3. 인증·세션

signup: email, nickname, password, consents[{type,version,accepted}]. 이메일 정규화 후 UNIQUE, 비밀번호는 해시 저장. 서비스에서 길이와 취약 비밀번호 정책 검증. 동의 문서 버전/시각을 기록한다.

login: email/password/deviceId. accessToken(15분)과 user{id,nickname,role}, expiresIn, sessionId를 반환한다. 브라우저 refresh는 HttpOnly+Secure cookie로 두고 refresh/logout에 Origin/CSRF 검증을 적용한다. 네이티브는 별도 서버 허용 클라이언트 흐름에서 refresh를 전달하고 OS 보안 저장소에 보관한다. query parameter의 platform 값만으로 세션 정책을 완화하지 않는다.

refresh: refresh rotation, 해시 저장, 재사용 탐지 시 해당 토큰 계열 폐기. logout은 현재 세션을 폐기하고 여러 번 호출해도 204. 분실 기기 폐기는 세션 ID와 소유자를 함께 확인한다. accessToken의 즉시 차단이 필요하면 session version 검사 또는 폐기 캐시가 필요하다.

비밀번호 재설정 요청은 항상 202로 이메일 존재 여부를 감춘다. 단회 토큰은 해시만 저장하고 15분 만료; 변경 완료와 토큰 소비·세션 폐기를 하나의 트랜잭션으로 처리한다. 로그인·가입·이메일 발송에 IP+계정별 제한과 Retry-After를 제공한다.

현재 코드는 JSON refreshToken 방식을 사용한다. 위 cookie 흐름은 신규 v1 설계이며 이미 구현된 것으로 간주하지 않는다.

## 4. 통합 일정 탭 — 핵심 요구사항

GET /api/v1/planner/items

| 파라미터 | 형식 | 규칙 |
|---|---|---|
| from / to | local date | 필수; to 제외; 최대 93일 |
| types | CSV enum | EVENT,TASK,ROUTINE; 생략 시 모두; 빈 목록·알 수 없는 값은 400 |
| categoryIds | CSV ID | 최대 20개; 같은 필드 안 OR |
| statuses | CSV enum | PENDING,IN_PROGRESS,DONE,SKIPPED,CANCELED |
| q | string | 제목 검색, 최대 100자 |
| timezone | IANA | 기본 내 설정; 날짜를 UTC 경계로 변환 |
| includeUndated | boolean | 기본 false; TASK 기한 없는 항목만 선택적으로 포함 |
| cursor / limit | string / int | 사용자·필터와 결합한 안정적 페이지 |
| scope | OWN/SHARED/ALL | 기본 OWN; 권한 없는 공유는 결과에서 제외 |

필터 간 AND, types/categoryIds/statuses 각 필드 내부 OR. 목록·일간·주간·월간은 동일 쿼리 모델을 사용한다. TASK는 due, EVENT는 기간 겹침, ROUTINE은 해당 날짜에 예정된 occurrence를 반환한다. 루틴 원본 ID만으로 UI key를 만들지 않는다.

~~~http
GET /api/v1/planner/items?from=2026-09-25&to=2026-09-26&types=EVENT,TASK&statuses=PENDING&timezone=Asia%2FSeoul&limit=30
Authorization: Bearer <access-token>
~~~

~~~json
{
  "success": true,
  "data": {
    "items": [{
      "key": "TASK:01KEXAMPLE:2026-09-25",
      "id": "01KEXAMPLE",
      "type": "TASK",
      "title": "API 검토",
      "date": "2026-09-25",
      "startAt": null,
      "endAt": null,
      "status": "PENDING",
      "sourceStatus": "TODO",
      "category": { "id": "01CAT", "name": "업무", "color": "#2f5d46" },
      "version": 3,
      "permissions": { "canRead": true, "canEdit": true, "canDelete": true }
    }],
    "nextCursor": null,
    "hasNext": false
  },
  "message": null
}
~~~

정규화: TASK TODO→PENDING, DOING→IN_PROGRESS, DONE→DONE, CANCELED→CANCELED. ROUTINE 미기록→PENDING, done→DONE, missed→PENDING(사유 원본 유지), skip→SKIPPED. EVENT 예정→PENDING, 취소→CANCELED이며 종료시각이 지났다고 실제 수행으로 자동 판정하지 않는다.
통합 항목 수정은 각 리소스 API로 보낸다. 조회 전용 aggregate에 쓰기 API를 억지로 결합하지 않는다.
GET /planner/summary는 같은 필터를 적용하되 페이지네이션 전 전체 집계를 반환한다.

## 5. 일정·할 일·루틴·회고 쓰기

| DTO | 필수 | 선택 / 검증 |
|---|---|---|
| EventWrite | title, allDay, timezone | 시간 일정 startAt/endAt 필수, endAt>startAt; 종일은 startDate/endDateExclusive. categoryId, location≤255, note, visibility 기본 PRIVATE |
| TaskWrite | title | due, priority LOW/MEDIUM/HIGH, energyLevel, durationMin 1~1440 기본30, categoryId, note |
| RoutineWrite | name, atTime HH:mm, timezone, weekdays | weekdays MON~SUN 중 1~7개 중복불가, active=true, categoryId, reminderMinutes 0~10080 |
| DiaryWrite | mood | GREAT/GOOD/SOSO/BAD/TERRIBLE, summary≤1000, body, gratitude; (owner,date) UNIQUE |
| MemoWrite | body 또는 title | status INBOX/ARCHIVED, tags≤20, text/voice 구분; 음성은 검사 완료 파일만 |
| DdayWrite | title,targetDate | repeatYearly=false, timezone 내 설정; 2/29 기념일은 비윤년 2/28 정책 명시 |
| TimeEntryWrite | type,title,startAt,endAt,timezone | type PLAN/ACTUAL, endAt>startAt, 단일 블록 최대24h, categoryId,eventId,note |

PATCH는 빠진 필드=유지, null=허용된 필드만 제거. PUT은 전체 교체/목표 상태 지정. 생성 응답은 id, version=1, createdAt, updatedAt, 입력 필드를 반환한다. 변경은 version 증가와 ETag 반환. 본인 소유가 아닌 categoryId/eventId/attachmentId 참조도 404로 거절한다.

PUT /tasks/{id}/status:
~~~json
{ "status": "DONE" }
~~~
If-Match: "3" 사용, 최신 버전 불일치 412. 상태 재전송은 같은 결과를 반환한다. TODO/DOING/DONE/CANCELED 간 전이는 본인 또는 허용된 editor만 가능하며 완료시각을 서버에서 관리한다.

PUT /routines/{id}/logs/{date}는 {status:"DONE"}를 upsert한다. (routineId,date) UNIQUE와 낙관적 잠금을 사용한다. SKIP은 예정 횟수 분모에서 제외하고, 미기록은 마감 전 대기/마감 후 미수행으로 계산한다. 원본 루틴 삭제 시 통계 이력을 보존하도록 soft delete한다.

다이어리 최초 PUT에는 If-None-Match: *를 사용하고 기존 자료는 If-Match를 사용한다. 동일 날짜 중복 생성은 409. Task 자동 이월은 사용자 타임존의 자정 이후 작업이며 (taskId,원래due,정책version) UNIQUE로 중복 실행을 막는다. 취소·완료·기한없음은 제외한다.

반복 일정은 로컬 회차 시각+timezone+시리즈 ID를 키로 사용한다. DST 중복 시각은 offset을 함께 보존하고 존재하지 않는 시각은 명시적 정책으로 처리한다. 무한 반복을 DB에 전부 생성하지 않고 조회 범위 내로 확장한다. 현재 일자별 materialization과는 별도 마이그레이션이 필요하다.

## 6. 실제 시간·통계

TIME 쓰기는 [startAt,endAt). 자정 경계 집계는 표시 타임존에서 날짜별로 분할하되 원본 블록은 유지한다. 겹치는 ACTUAL은 기본 409 TIME_OVERLAP과 충돌 ID만 반환하고 사용자가 시간을 조정한다. PLAN 겹침은 허용하되 경고한다.

달성률: done / eligible ×100. 분모 0이면 rate=null, UI는 '기록 없음'. TASK는 해당 기간 기한 기준, ROUTINE은 예정 회차 기준, 다이어리는 기록한 날짜/관찰한 날짜 기준. PLAN/ACTUAL 시간 비교와 할 일 완료율을 혼합하지 않는다. 주·월 비교는 같은 타임존과 같은 관찰 범위를 적용하고 아직 오지 않은 날짜는 분모에서 제외한다.
집계 캐시 키는 userId+기간+필터+timezone. 수정·삭제·공유 철회 시 무효화한다.

## 7. 중복 요청·오프라인·충돌

생성/복제/작업 API는 Idempotency-Key(UUID)를 받는다. (userId,method,path,key) UNIQUE, 요청 body hash와 결과를 24시간 보관한다. 같은 key+같은 body는 최초 결과, 같은 key+다른 body는 409. 동시 요청도 DB unique 제약으로 단일 처리한다.

동기화 POST /sync/mutations:
~~~json
{
  "deviceId": "device-example",
  "mutations": [{
    "clientMutationId": "uuid-example",
    "type": "TASK",
    "id": "01KEXAMPLE",
    "baseVersion": 3,
    "operation": "SET_STATUS",
    "payload": { "status": "DONE" }
  }]
}
~~~
HTTP 200 내부에 mutation별 APPLIED/CONFLICT/REJECTED, entity/version/error를 반환한다. batch 전체 원자성을 주장하지 않는다. 충돌 시 서버 값과 내 변경을 보여주고 자동 덮어쓰지 않는다. 각 mutation 권한을 다시 검사한다.

GET /sync/changes는 사용자별 단조 증가 revision 기준이며 tombstone을 포함한다. 보관 기간(30일) 밖 cursor는 410 SYNC_RESET_REQUIRED, 클라이언트는 전체 새로고침. 클라이언트 시각을 cursor로 사용하지 않는다. 네이티브 오프라인 저장 데이터와 토큰은 로그아웃 시 계정별로 정리한다.

## 8. 공유·추가 기능

viewer는 읽기만, editor는 정책에서 허용한 single/future만, owner는 공유 관리 가능. role/editScope/deleteScope를 클라이언트가 조작해도 서버 정책 상한을 넘을 수 없다. 공유 권한은 목록·상세·검색·통계·첨부 다운로드·채팅 recordRef 모두에 적용한다.

친구 초대 수락은 초대받은 사용자만 가능. 그룹 owner 마지막 1명 제거는 409. 차단은 새 초대·DM을 막고 필요한 공유 권한을 철회한다. 공개 게시 전 선택 항목과 민감한 일정 위치를 미리 보여준다. 커뮤니티는 원본 개인 회고에 대한 무제한 live link가 아닌 확정된 사본을 기본으로 한다.

권장 추가 기능: 분실 기기 세션 해제, 휴지통/복구, 로컬 임시저장, 오프라인 재시도, 충돌 해결, 접근성, 데이터 내보내기, 자동 이월 내역, 수신 동의 기반 랭킹. 도입 순서는 [추가 기능 설계](../product/api-enhancements.md) 참고.

파일: 크기·MIME allowlist 검증, 무작위 storage key, 바이러스 검사 완료 전 사용 금지. 사용자 제공 외부 URL을 서버가 직접 fetch하지 않는다(SSRF 방지). 업로드/다운로드 서명 URL은 짧게 만료하고 소유권 검사를 선행한다.
AI/STT는 명시적 동의한 기록만 전달하며 결과는 초안으로 보관한다. 사용자가 승인하기 전 일정·할 일을 자동 생성하지 않는다. 원문과 토큰을 로그에 남기지 않는다.

## 9. DB/작업 설계

현재 V1에 존재하는 users/events/task/routine/routine_log/diary/memo/time_entry 등을 활용하되 실제 컬럼 정합성 검토가 선행되어야 한다.
v1 구현 시 추가 migration: version·soft delete, routine timezone, event UTC/allDay, user_pref.mode, D-Day, notification, consent, reset_token, device_session, idempotency_record, change_log, task_rollover_log, outbox_event. 현재 V1을 이미 적용한 DB에서는 파일을 수정하거나 repair로 차이를 숨기지 않고 V2 이상으로 배포한다.

권장 인덱스: events(owner, start_utc, id), task(user_id,due,st,id), routine_log(routine_id,dt) UNIQUE, diary(user_id,dt) UNIQUE, time_entry(user_id,start_utc,end_utc), change_log(user_id,revision), notification(user_id,read_at,created_at,id). 실제 JPA 컬럼명과 정합성을 맞춘 migration만 실행한다.
Outbox는 도메인 변경과 같은 트랜잭션으로 저장; 알림/통계 소비자는 eventId 중복 방지. 외부 메일·AI 호출은 DB 트랜잭션 밖에서 실행한다.

## 10. 보안·수용 조건

- 다른 사용자 ID로 목록/상세/수정/삭제/첨부가 노출되지 않는 교차 계정 테스트.
- 관리자 API에는 ADMIN 검사와 reason·actor·대상·시각 감사 기록. 현재 SecurityConfig는 JWT 인증만 검사하므로 보완 필요.
- 현재 PlannerService 공용 메모리 데이터는 실제 사용자 API로 사용 금지. 영속화와 사용자 구분 이후 전환.
- 원시 리프레시 토큰·DB 비밀번호·JWT secret을 클라이언트 번들, git, 로그에 포함하지 않는다.
- CORS는 정확한 출처 allowlist. cookie 인증 흐름에는 CSRF 검증. 개발 프록시는 CORS 인증 우회가 아니다.
- 테스트: 인증 누락401, IDOR404, admin403, 잘못된 입력400/422, 버전412, 멱등키409, 중복 회차 unique, UTC/DST/윤일, max limit, 중복 요청/재시도, 공유 철회 즉시 반영.
- OpenAPI에서 enum/required/status/example/securityScheme를 명시하고 컨트롤러와 계약 테스트로 비교한다.

이번 작업은 설계 문서와 로컬 화면 실행 기능 반영이다. 위 목표 API 전체를 구현하거나 운영 보안 문제 전체를 수정했다고 주장하지 않는다.
