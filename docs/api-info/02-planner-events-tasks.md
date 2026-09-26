# 플래너·일정·할 일 API 상세 설계

2026-09-26 · 목표 /api/v1 · **서버 미구현** · 24개

[전체 목록](catalog.md) · [공통 규칙](00-conventions.md) · [오류 사전](errors.md) · [OpenAPI JSON](openapi.target.json)

## 업무 규칙

통합 일정 필터는 필드 간 AND, 같은 CSV 필드 내 OR입니다. EVENT는 기간 겹침, TASK는 due, ROUTINE은 날짜별 예정 회차로 조회합니다. PATCH는 누락 필드 유지, 허용된 null만 제거; 저장 전 기존 값과 합쳐 검증합니다. 종일/시간 일정 필드는 혼용하지 않습니다. 반복 RRULE은 무한 전개 금지, 지원 범위 밖 문법은 422. 시작·종료의 지역 시각이 DST 모호/누락 시 명시적인 UTC offset 확인을 요구합니다.

## 빠른 이동

- [PLAN-01 일정 탭 통합 필터 조회](#plan-01)
- [PLAN-02 필터 적용 전체 기간 집계](#plan-02)
- [EVENT-01 일정 상세](#event-01)
- [EVENT-02 일정 생성](#event-02)
- [EVENT-03 일정 부분 수정](#event-03)
- [EVENT-04 일정 휴지통 이동](#event-04)
- [EVENT-05 일정 목록](#event-05)
- [REPEAT-01 반복 일정 생성](#repeat-01)
- [REPEAT-02 반복 회차 수정](#repeat-02)
- [REPEAT-03 반복 회차 취소](#repeat-03)
- [TASK-01 할 일 목록](#task-01)
- [TASK-02 할 일 상세](#task-02)
- [TASK-03 할 일 작성](#task-03)
- [TASK-04 할 일 부분 수정](#task-04)
- [TASK-05 할 일 목표 상태 지정](#task-05)
- [TASK-06 할 일 삭제](#task-06)
- [TASK-07 할 일 복제](#task-07)
- [TASK-08 자동 이월 이력](#task-08)
- [POLICY-01 자동 이월 정책 조회](#policy-01)
- [POLICY-02 자동 이월 정책 저장](#policy-02)
- [DDAY-01 D-Day 목록](#dday-01)
- [DDAY-02 D-Day 생성](#dday-02)
- [DDAY-03 D-Day 수정](#dday-03)
- [DDAY-04 D-Day 삭제](#dday-04)

<a id="plan-01"></a>
## PLAN-01 · 일정 탭 통합 필터 조회

- 요청 URL: `https://api.example.test/api/v1/planner/items` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| query | from | string (date) | 예 | 조회 시작 지역 날짜 포함; to와 함께 지정, 범위 최대 93일;  |
| query | to | string (date) | 예 | 조회 종료 지역 날짜 미포함;  |
| query | types | string | 아니오 | 쉼표 구분 ENUM, 중복 불가; 기본 EVENT,TASK,ROUTINE; 정규식 ^(EVENT&#124;TASK&#124;ROUTINE)(,(EVENT&#124;TASK&#124;ROUTINE))*$ |
| query | statuses | string | 아니오 | 쉼표 구분: PENDING,IN_PROGRESS,DONE,SKIPPED,CANCELED;  |
| query | categoryIds | string | 아니오 | 쉼표 구분 소유/공유 가능한 카테고리 ID 최대20개;  |
| query | q | string | 아니오 | 앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자; 최소 1자; 최대 100자 |
| query | timezone | string | 아니오 | 유효한 IANA ZoneId; 사용자 설정 기본값; 최대 64자 |
| query | includeUndated | boolean | 아니오 | 기한 없는 할 일 포함; 기본 false |
| query | scope | string | 아니오 | 조회 범위; 허용: OWN, SHARED, ALL; 기본 OWN |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/planner/items?from=2026-09-26&to=2026-09-27 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | PlannerItemPage | 필수 | 하위 구조 참조  |
| data.items | PlannerItem[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].key | string | 필수 | 유형/ID/발생일 복합 UI key  |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].type | string | 필수 | 필터 유형 허용: EVENT, TASK, ROUTINE |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].date | string (date) | 필수 | 표시 지역 날짜  |
| data.items[].startAt | string (date-time) / null | 필수 | 시작 UTC; null 허용  |
| data.items[].endAt | string (date-time) / null | 필수 | 종료 UTC; null 허용  |
| data.items[].status | string | 필수 | 통합 상태 허용: PENDING, IN_PROGRESS, DONE, SKIPPED, CANCELED |
| data.items[].sourceStatus | string | 필수 | 원본 도메인 상태  |
| data.items[].category | Category / null | 필수 | Category; null 허용  |
| data.items[].permissions | Permission | 필수 | 하위 구조 참조  |
| data.items[].permissions.canRead | boolean | 필수 | 조회  |
| data.items[].permissions.canEdit | boolean | 필수 | 수정  |
| data.items[].permissions.canDelete | boolean | 필수 | 삭제  |
| data.items[].version | integer | 필수 | 버전 최소 1; 최대 1000000 |
| data.nextCursor | string / null | 필수 | 다음 페이지 커서; 마지막 null; null 허용  |
| data.hasNext | boolean | 필수 | 다음 페이지 여부  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "key": "TASK:01J00000000000000000000001:2026-09-26",
        "id": "01J00000000000000000000001",
        "type": "EVENT",
        "title": "설계 검토",
        "date": "2026-09-26",
        "startAt": null,
        "endAt": null,
        "status": "PENDING",
        "sourceStatus": "TODO",
        "category": null,
        "permissions": {
          "canRead": true,
          "canEdit": true,
          "canDelete": true
        },
        "version": 1
      }
    ],
    "nextCursor": null,
    "hasNext": false
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |

<a id="plan-02"></a>
## PLAN-02 · 필터 적용 전체 기간 집계

- 요청 URL: `https://api.example.test/api/v1/planner/summary` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| query | from | string (date) | 예 | 조회 시작 지역 날짜 포함; to와 함께 지정, 범위 최대 93일;  |
| query | to | string (date) | 예 | 조회 종료 지역 날짜 미포함;  |
| query | types | string | 아니오 | 쉼표 구분 ENUM, 중복 불가; 기본 EVENT,TASK,ROUTINE; 정규식 ^(EVENT&#124;TASK&#124;ROUTINE)(,(EVENT&#124;TASK&#124;ROUTINE))*$ |
| query | statuses | string | 아니오 | 쉼표 구분: PENDING,IN_PROGRESS,DONE,SKIPPED,CANCELED;  |
| query | categoryIds | string | 아니오 | 쉼표 구분 소유/공유 가능한 카테고리 ID 최대20개;  |
| query | q | string | 아니오 | 앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자; 최소 1자; 최대 100자 |
| query | timezone | string | 아니오 | 유효한 IANA ZoneId; 사용자 설정 기본값; 최대 64자 |
| query | includeUndated | boolean | 아니오 | 기한 없는 할 일 포함; 기본 false |
| query | scope | string | 아니오 | 조회 범위; 허용: OWN, SHARED, ALL; 기본 OWN |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/planner/summary?from=2026-09-26&to=2026-09-27 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | DaySummary[] | 필수 | 기간 내 집계 배열 최대 366개 |
| data[].date | string (date) | 필수 | 지역 날짜  |
| data[].events | integer | 필수 | 일정 수 최소 0; 최대 1000000 |
| data[].tasks | integer | 필수 | 할 일 수 최소 0; 최대 1000000 |
| data[].routines | integer | 필수 | 예정 루틴 수 최소 0; 최대 1000000 |
| data[].completed | integer | 필수 | 할 일/루틴 완료 수 최소 0; 최대 1000000 |
| data[].actualMinutes | integer | 필수 | 실제 기록 분 최소 0; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-09-26",
      "events": 2,
      "tasks": 3,
      "routines": 2,
      "completed": 1,
      "actualMinutes": 60
    }
  ],
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |

<a id="event-01"></a>
## EVENT-01 · 일정 상세

- 요청 URL: `https://api.example.test/api/v1/events/{id}` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |
| query | occurrenceDate | string (date) | 아니오 | 시리즈에서 조회할 지역 발생일;  |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/events/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Event | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.allDay | boolean | 필수 | false: startAt/endAt, true: startDate/endDateExclusive  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| data.endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| data.startDate | string (date) | 선택 | 종일 시작 날짜  |
| data.endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.location | string | 선택 | 장소 최대 255자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| data.attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "title": "설계 검토 수정",
    "allDay": false,
    "timezone": "Asia/Seoul",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T02:00:00Z",
    "body": "API 계약 확인 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [],
    "id": "1",
    "version": 2,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |

<a id="event-02"></a>
## EVENT-02 · 일정 생성

- 요청 URL: `https://api.example.test/api/v1/events` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| Idempotency-Key | 필수 | 24시간 동안 동일 key+본문=동일 결과; 예 00000000-0000-4000-8000-000000000001 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| allDay | boolean | 필수 | false: startAt/endAt, true: startDate/endDateExclusive  |
| timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| startDate | string (date) | 선택 | 종일 시작 날짜  |
| endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| location | string | 선택 | 장소 최대 255자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "설계 검토",
  "allDay": false,
  "timezone": "Asia/Seoul",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T01:00:00Z",
  "body": "API 계약 확인 #업무",
  "tags": [
    "업무"
  ],
  "mentionUserIds": []
}
```

### 요청 예시

```http
POST /api/v1/events HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "title": "설계 검토",
  "allDay": false,
  "timezone": "Asia/Seoul",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T01:00:00Z",
  "body": "API 계약 확인 #업무",
  "tags": [
    "업무"
  ],
  "mentionUserIds": []
}
```

### 성공 응답

HTTP **201**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Event | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.allDay | boolean | 필수 | false: startAt/endAt, true: startDate/endDateExclusive  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| data.endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| data.startDate | string (date) | 선택 | 종일 시작 날짜  |
| data.endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.location | string | 선택 | 장소 최대 255자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| data.attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "title": "설계 검토 수정",
    "allDay": false,
    "timezone": "Asia/Seoul",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T02:00:00Z",
    "body": "API 계약 확인 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [],
    "id": "1",
    "version": 2,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 409 | IDEMPOTENCY_CONFLICT | 같은 멱등키에 다른 요청 본문 | 동일 요청은 원래 키, 새 의도는 새 UUID 사용 |

<a id="event-03"></a>
## EVENT-03 · 일정 부분 수정

- 요청 URL: `https://api.example.test/api/v1/events/{id}` (예약 예시 도메인)
- HTTP 메서드: **PATCH**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| If-Match | 필수 | GET 응답 ETag; 양쪽 따옴표 포함; 예 "1" |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| allDay | boolean | 선택 | false: startAt/endAt, true: startDate/endDateExclusive  |
| timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| startDate | string (date) | 선택 | 종일 시작 날짜  |
| endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| location | string | 선택 | 장소 최대 255자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "설계 검토 수정",
  "endAt": "2026-09-26T02:00:00Z"
}
```

### 요청 예시

```http
PATCH /api/v1/events/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "title": "설계 검토 수정",
  "endAt": "2026-09-26T02:00:00Z"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Event | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.allDay | boolean | 필수 | false: startAt/endAt, true: startDate/endDateExclusive  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| data.endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| data.startDate | string (date) | 선택 | 종일 시작 날짜  |
| data.endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.location | string | 선택 | 장소 최대 255자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| data.attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "title": "설계 검토 수정",
    "allDay": false,
    "timezone": "Asia/Seoul",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T02:00:00Z",
    "body": "API 계약 확인 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [],
    "id": "1",
    "version": 2,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |

<a id="event-04"></a>
## EVENT-04 · 일정 휴지통 이동

- 요청 URL: `https://api.example.test/api/v1/events/{id}` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| If-Match | 필수 | GET 응답 ETag; 양쪽 따옴표 포함; 예 "1" |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
DELETE /api/v1/events/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
```

### 성공 응답

HTTP **204**. 응답 본문 없음. JSON 파싱하지 않습니다.

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |

<a id="event-05"></a>
## EVENT-05 · 일정 목록

- 요청 URL: `https://api.example.test/api/v1/events` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| query | from | string (date) | 예 | 조회 시작 지역 날짜 포함; to와 함께 지정, 범위 최대 93일;  |
| query | to | string (date) | 예 | 조회 종료 지역 날짜 미포함;  |
| query | categoryId | string | 아니오 | 본인에게 접근 가능한 카테고리; 최소 1자; 최대 128자 |
| query | q | string | 아니오 | 앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자; 최소 1자; 최대 100자 |
| query | timezone | string | 아니오 | 유효한 IANA ZoneId; 사용자 설정 기본값; 최대 64자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/events?from=2026-09-26&to=2026-09-27 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | EventPage | 필수 | 하위 구조 참조  |
| data.items | Event[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].allDay | boolean | 필수 | false: startAt/endAt, true: startDate/endDateExclusive  |
| data.items[].timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.items[].startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| data.items[].endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| data.items[].startDate | string (date) | 선택 | 종일 시작 날짜  |
| data.items[].endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| data.items[].categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.items[].location | string | 선택 | 장소 최대 255자 |
| data.items[].body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.items[].visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| data.items[].attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| data.items[].tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.items[].mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.items[].version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.items[].createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.items[].updatedAt | string (date-time) | 필수 | 수정 UTC  |
| data.nextCursor | string / null | 필수 | 다음 페이지 커서; 마지막 null; null 허용  |
| data.hasNext | boolean | 필수 | 다음 페이지 여부  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "title": "설계 검토 수정",
        "allDay": false,
        "timezone": "Asia/Seoul",
        "startAt": "2026-09-26T00:00:00Z",
        "endAt": "2026-09-26T02:00:00Z",
        "body": "API 계약 확인 #업무",
        "tags": [
          "업무"
        ],
        "mentionUserIds": [],
        "id": "1",
        "version": 2,
        "createdAt": "2026-09-26T00:00:00Z",
        "updatedAt": "2026-09-26T00:00:00Z"
      }
    ],
    "nextCursor": null,
    "hasNext": false
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |

<a id="repeat-01"></a>
## REPEAT-01 · 반복 일정 생성

- 요청 URL: `https://api.example.test/api/v1/events/series` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| Idempotency-Key | 필수 | 24시간 동안 동일 key+본문=동일 결과; 예 00000000-0000-4000-8000-000000000001 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| allDay | boolean | 필수 | false: startAt/endAt, true: startDate/endDateExclusive  |
| timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| startDate | string (date) | 선택 | 종일 시작 날짜  |
| endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| location | string | 선택 | 장소 최대 255자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| rrule | string | 필수 | 지원 RFC5545 하위집합; FREQ DAILY/WEEKLY/MONTHLY 최대 512자 |

```json
{
  "title": "설계 검토",
  "allDay": false,
  "timezone": "Asia/Seoul",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T01:00:00Z",
  "body": "API 계약 확인 #업무",
  "tags": [
    "업무"
  ],
  "mentionUserIds": [],
  "rrule": "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=12"
}
```

### 요청 예시

```http
POST /api/v1/events/series HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "title": "설계 검토",
  "allDay": false,
  "timezone": "Asia/Seoul",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T01:00:00Z",
  "body": "API 계약 확인 #업무",
  "tags": [
    "업무"
  ],
  "mentionUserIds": [],
  "rrule": "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=12"
}
```

### 성공 응답

HTTP **201**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Event | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.allDay | boolean | 필수 | false: startAt/endAt, true: startDate/endDateExclusive  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| data.endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| data.startDate | string (date) | 선택 | 종일 시작 날짜  |
| data.endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.location | string | 선택 | 장소 최대 255자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| data.attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "title": "설계 검토 수정",
    "allDay": false,
    "timezone": "Asia/Seoul",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T02:00:00Z",
    "body": "API 계약 확인 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [],
    "id": "1",
    "version": 2,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 409 | IDEMPOTENCY_CONFLICT | 같은 멱등키에 다른 요청 본문 | 동일 요청은 원래 키, 새 의도는 새 UUID 사용 |

<a id="repeat-02"></a>
## REPEAT-02 · 반복 회차 수정

- 요청 URL: `https://api.example.test/api/v1/events/{id}/occurrences/{occurrenceKey}` (예약 예시 도메인)
- HTTP 메서드: **PATCH**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| If-Match | 필수 | GET 응답 ETag; 양쪽 따옴표 포함; 예 "1" |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |
| path | occurrenceKey | string | 예 | 서버가 반환한 지역 회차+offset 불투명 키; 최소 1자; 최대 128자 |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| scope | string | 필수 | 변경 범위 허용: SINGLE, FUTURE |
| changes | EventPatch | 필수 | 하위 구조 참조  |
| changes.title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| changes.allDay | boolean | 선택 | false: startAt/endAt, true: startDate/endDateExclusive  |
| changes.timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| changes.startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| changes.endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| changes.startDate | string (date) | 선택 | 종일 시작 날짜  |
| changes.endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| changes.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| changes.location | string | 선택 | 장소 최대 255자 |
| changes.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| changes.visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| changes.attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| changes.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| changes.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "scope": "SINGLE",
  "changes": {
    "title": "설계 검토 수정",
    "endAt": "2026-09-26T02:00:00Z"
  }
}
```

### 요청 예시

```http
PATCH /api/v1/events/01J00000000000000000000001/occurrences/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "scope": "SINGLE",
  "changes": {
    "title": "설계 검토 수정",
    "endAt": "2026-09-26T02:00:00Z"
  }
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Event | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.allDay | boolean | 필수 | false: startAt/endAt, true: startDate/endDateExclusive  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.startAt | string (date-time) | 선택 | 시간 일정 시작 UTC  |
| data.endAt | string (date-time) | 선택 | 시간 일정 종료 UTC; 시작보다 이후  |
| data.startDate | string (date) | 선택 | 종일 시작 날짜  |
| data.endDateExclusive | string (date) | 선택 | 종일 종료일 미포함  |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.location | string | 선택 | 장소 최대 255자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.visibility | string | 선택 | 공개 범위 허용: PRIVATE, SHARED, PUBLIC |
| data.attendeeIds | string[] | 선택 | 동의/권한 검증된 사용자 최대 100개; 중복 불가 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "title": "설계 검토 수정",
    "allDay": false,
    "timezone": "Asia/Seoul",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T02:00:00Z",
    "body": "API 계약 확인 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [],
    "id": "1",
    "version": 2,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |

<a id="repeat-03"></a>
## REPEAT-03 · 반복 회차 취소

- 요청 URL: `https://api.example.test/api/v1/events/{id}/occurrences/{occurrenceKey}` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| If-Match | 필수 | GET 응답 ETag; 양쪽 따옴표 포함; 예 "1" |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |
| path | occurrenceKey | string | 예 | 서버가 반환한 지역 회차+offset 불투명 키; 최소 1자; 최대 128자 |
| query | scope | string | 예 | 반복 일정 처리 범위; 허용: SINGLE, FUTURE |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
DELETE /api/v1/events/01J00000000000000000000001/occurrences/01J00000000000000000000001?scope=SINGLE HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
```

### 성공 응답

HTTP **204**. 응답 본문 없음. JSON 파싱하지 않습니다.

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |

<a id="task-01"></a>
## TASK-01 · 할 일 목록

- 요청 URL: `https://api.example.test/api/v1/tasks` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| query | dueFrom | string (date) | 아니오 | 기한 시작 포함;  |
| query | dueTo | string (date) | 아니오 | 기한 종료 미포함;  |
| query | status | string | 아니오 | 할 일 상태; 허용: TODO, DOING, DONE, CANCELED |
| query | categoryId | string | 아니오 | 본인에게 접근 가능한 카테고리; 최소 1자; 최대 128자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/tasks HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | TaskPage | 필수 | 하위 구조 참조  |
| data.items | Task[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.items[].due | string (date) / null | 선택 | 기한; null은 기한 없음; null 허용  |
| data.items[].priority | string | 선택 | 우선순위 허용: LOW, MEDIUM, HIGH |
| data.items[].energyLevel | string | 선택 | 필요 에너지 허용: LOW, MEDIUM, HIGH |
| data.items[].durationMin | integer | 선택 | 예상 진행 분 최소 1; 최대 1440 |
| data.items[].categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.items[].tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.items[].mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.items[].status | string | 필수 | 목표 상태 허용: TODO, DOING, DONE, CANCELED |
| data.items[].version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.items[].createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.items[].updatedAt | string (date-time) | 필수 | 수정 UTC  |
| data.nextCursor | string / null | 필수 | 다음 페이지 커서; 마지막 null; null 허용  |
| data.hasNext | boolean | 필수 | 다음 페이지 여부  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "01J00000000000000000000001",
        "title": "설계 검토",
        "body": "오늘의 기록 #업무",
        "due": null,
        "priority": "MEDIUM",
        "energyLevel": "MEDIUM",
        "durationMin": 30,
        "categoryId": null,
        "tags": [
          "업무"
        ],
        "mentionUserIds": [
          "01J00000000000000000000001"
        ],
        "status": "TODO",
        "version": 1,
        "createdAt": "2026-09-26T00:00:00Z",
        "updatedAt": "2026-09-26T00:00:00Z"
      }
    ],
    "nextCursor": null,
    "hasNext": false
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |

<a id="task-02"></a>
## TASK-02 · 할 일 상세

- 요청 URL: `https://api.example.test/api/v1/tasks/{id}` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/tasks/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Task | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.due | string (date) / null | 선택 | 기한; null은 기한 없음; null 허용  |
| data.priority | string | 선택 | 우선순위 허용: LOW, MEDIUM, HIGH |
| data.energyLevel | string | 선택 | 필요 에너지 허용: LOW, MEDIUM, HIGH |
| data.durationMin | integer | 선택 | 예상 진행 분 최소 1; 최대 1440 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.status | string | 필수 | 목표 상태 허용: TODO, DOING, DONE, CANCELED |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "due": null,
    "priority": "MEDIUM",
    "energyLevel": "MEDIUM",
    "durationMin": 30,
    "categoryId": null,
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "status": "TODO",
    "version": 1,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |

<a id="task-03"></a>
## TASK-03 · 할 일 작성

- 요청 URL: `https://api.example.test/api/v1/tasks` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| Idempotency-Key | 필수 | 24시간 동안 동일 key+본문=동일 결과; 예 00000000-0000-4000-8000-000000000001 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| due | string (date) / null | 선택 | 기한; null은 기한 없음; null 허용  |
| priority | string | 선택 | 우선순위 허용: LOW, MEDIUM, HIGH |
| energyLevel | string | 선택 | 필요 에너지 허용: LOW, MEDIUM, HIGH |
| durationMin | integer | 선택 | 예상 진행 분 최소 1; 최대 1440 |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "due": null,
  "priority": "MEDIUM",
  "energyLevel": "MEDIUM",
  "durationMin": 30,
  "categoryId": null,
  "tags": [
    "업무"
  ],
  "mentionUserIds": [
    "01J00000000000000000000001"
  ]
}
```

### 요청 예시

```http
POST /api/v1/tasks HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "due": null,
  "priority": "MEDIUM",
  "energyLevel": "MEDIUM",
  "durationMin": 30,
  "categoryId": null,
  "tags": [
    "업무"
  ],
  "mentionUserIds": [
    "01J00000000000000000000001"
  ]
}
```

### 성공 응답

HTTP **201**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Task | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.due | string (date) / null | 선택 | 기한; null은 기한 없음; null 허용  |
| data.priority | string | 선택 | 우선순위 허용: LOW, MEDIUM, HIGH |
| data.energyLevel | string | 선택 | 필요 에너지 허용: LOW, MEDIUM, HIGH |
| data.durationMin | integer | 선택 | 예상 진행 분 최소 1; 최대 1440 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.status | string | 필수 | 목표 상태 허용: TODO, DOING, DONE, CANCELED |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "due": null,
    "priority": "MEDIUM",
    "energyLevel": "MEDIUM",
    "durationMin": 30,
    "categoryId": null,
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "status": "TODO",
    "version": 1,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 409 | IDEMPOTENCY_CONFLICT | 같은 멱등키에 다른 요청 본문 | 동일 요청은 원래 키, 새 의도는 새 UUID 사용 |

<a id="task-04"></a>
## TASK-04 · 할 일 부분 수정

- 요청 URL: `https://api.example.test/api/v1/tasks/{id}` (예약 예시 도메인)
- HTTP 메서드: **PATCH**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| If-Match | 필수 | GET 응답 ETag; 양쪽 따옴표 포함; 예 "1" |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| due | string (date) / null | 선택 | 기한; null은 기한 없음; null 허용  |
| priority | string | 선택 | 우선순위 허용: LOW, MEDIUM, HIGH |
| energyLevel | string | 선택 | 필요 에너지 허용: LOW, MEDIUM, HIGH |
| durationMin | integer | 선택 | 예상 진행 분 최소 1; 최대 1440 |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "due": null,
  "priority": "MEDIUM",
  "energyLevel": "MEDIUM",
  "durationMin": 30,
  "categoryId": null,
  "tags": [
    "업무"
  ],
  "mentionUserIds": [
    "01J00000000000000000000001"
  ]
}
```

### 요청 예시

```http
PATCH /api/v1/tasks/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "due": null,
  "priority": "MEDIUM",
  "energyLevel": "MEDIUM",
  "durationMin": 30,
  "categoryId": null,
  "tags": [
    "업무"
  ],
  "mentionUserIds": [
    "01J00000000000000000000001"
  ]
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Task | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.due | string (date) / null | 선택 | 기한; null은 기한 없음; null 허용  |
| data.priority | string | 선택 | 우선순위 허용: LOW, MEDIUM, HIGH |
| data.energyLevel | string | 선택 | 필요 에너지 허용: LOW, MEDIUM, HIGH |
| data.durationMin | integer | 선택 | 예상 진행 분 최소 1; 최대 1440 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.status | string | 필수 | 목표 상태 허용: TODO, DOING, DONE, CANCELED |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "due": null,
    "priority": "MEDIUM",
    "energyLevel": "MEDIUM",
    "durationMin": 30,
    "categoryId": null,
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "status": "TODO",
    "version": 1,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |

<a id="task-05"></a>
## TASK-05 · 할 일 목표 상태 지정

- 요청 URL: `https://api.example.test/api/v1/tasks/{id}/status` (예약 예시 도메인)
- HTTP 메서드: **PUT**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| If-Match | 필수 | GET 응답 ETag; 양쪽 따옴표 포함; 예 "1" |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| status | string | 필수 | 토글이 아닌 목표 상태 허용: TODO, DOING, DONE, CANCELED |

```json
{
  "status": "DONE"
}
```

### 요청 예시

```http
PUT /api/v1/tasks/01J00000000000000000000001/status HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "status": "DONE"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Task | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.due | string (date) / null | 선택 | 기한; null은 기한 없음; null 허용  |
| data.priority | string | 선택 | 우선순위 허용: LOW, MEDIUM, HIGH |
| data.energyLevel | string | 선택 | 필요 에너지 허용: LOW, MEDIUM, HIGH |
| data.durationMin | integer | 선택 | 예상 진행 분 최소 1; 최대 1440 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.status | string | 필수 | 목표 상태 허용: TODO, DOING, DONE, CANCELED |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "due": null,
    "priority": "MEDIUM",
    "energyLevel": "MEDIUM",
    "durationMin": 30,
    "categoryId": null,
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "status": "DONE",
    "version": 1,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |

<a id="task-06"></a>
## TASK-06 · 할 일 삭제

- 요청 URL: `https://api.example.test/api/v1/tasks/{id}` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| If-Match | 필수 | GET 응답 ETag; 양쪽 따옴표 포함; 예 "1" |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
DELETE /api/v1/tasks/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
```

### 성공 응답

HTTP **204**. 응답 본문 없음. JSON 파싱하지 않습니다.

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |

<a id="task-07"></a>
## TASK-07 · 할 일 복제

- 요청 URL: `https://api.example.test/api/v1/tasks/{id}/duplicates` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| Idempotency-Key | 필수 | 24시간 동안 동일 key+본문=동일 결과; 예 00000000-0000-4000-8000-000000000001 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| due | string (date) / null | 선택 | 복제한 작업의 새 기한; null 허용  |

```json
{
  "due": null
}
```

### 요청 예시

```http
POST /api/v1/tasks/01J00000000000000000000001/duplicates HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "due": null
}
```

### 성공 응답

HTTP **201**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Task | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.due | string (date) / null | 선택 | 기한; null은 기한 없음; null 허용  |
| data.priority | string | 선택 | 우선순위 허용: LOW, MEDIUM, HIGH |
| data.energyLevel | string | 선택 | 필요 에너지 허용: LOW, MEDIUM, HIGH |
| data.durationMin | integer | 선택 | 예상 진행 분 최소 1; 최대 1440 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.status | string | 필수 | 목표 상태 허용: TODO, DOING, DONE, CANCELED |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "due": null,
    "priority": "MEDIUM",
    "energyLevel": "MEDIUM",
    "durationMin": 30,
    "categoryId": null,
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "status": "TODO",
    "version": 1,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 409 | IDEMPOTENCY_CONFLICT | 같은 멱등키에 다른 요청 본문 | 동일 요청은 원래 키, 새 의도는 새 UUID 사용 |

<a id="task-08"></a>
## TASK-08 · 자동 이월 이력

- 요청 URL: `https://api.example.test/api/v1/tasks/{id}/rollovers` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/tasks/01J00000000000000000000001/rollovers HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | RolloverPage | 필수 | 하위 구조 참조  |
| data.items | Rollover[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].taskId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].fromDate | string (date) | 필수 | 이전 기한  |
| data.items[].toDate | string (date) | 필수 | 새 기한  |
| data.items[].reason | string | 필수 | 이월 사유  |
| data.items[].at | string (date-time) | 필수 | 처리 UTC  |
| data.nextCursor | string / null | 필수 | 다음 페이지 커서; 마지막 null; null 허용  |
| data.hasNext | boolean | 필수 | 다음 페이지 여부  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "01J00000000000000000000001",
        "taskId": "01J00000000000000000000001",
        "fromDate": "2026-09-26",
        "toDate": "2026-09-27",
        "reason": "미완료 자동 이월",
        "at": "2026-09-26T00:00:00Z"
      }
    ],
    "nextCursor": null,
    "hasNext": false
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |

<a id="policy-01"></a>
## POLICY-01 · 자동 이월 정책 조회

- 요청 URL: `https://api.example.test/api/v1/me/task-rollover-policy` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/me/task-rollover-policy HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | RolloverPolicy | 필수 | 하위 구조 참조  |
| data.enabled | boolean | 필수 | 사용 여부  |
| data.target | string | 필수 | 이월일 정책 허용: NEXT_DAY, NEXT_WORKDAY |
| data.maxCount | integer | 필수 | 최대 이월 횟수 최소 1; 최대 365 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "target": "NEXT_DAY",
    "maxCount": 7
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |

<a id="policy-02"></a>
## POLICY-02 · 자동 이월 정책 저장

- 요청 URL: `https://api.example.test/api/v1/me/task-rollover-policy` (예약 예시 도메인)
- HTTP 메서드: **PUT**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| enabled | boolean | 필수 | 사용 여부  |
| target | string | 필수 | 이월일 정책 허용: NEXT_DAY, NEXT_WORKDAY |
| maxCount | integer | 필수 | 최대 이월 횟수 최소 1; 최대 365 |

```json
{
  "enabled": true,
  "target": "NEXT_DAY",
  "maxCount": 7
}
```

### 요청 예시

```http
PUT /api/v1/me/task-rollover-policy HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "enabled": true,
  "target": "NEXT_DAY",
  "maxCount": 7
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | RolloverPolicy | 필수 | 하위 구조 참조  |
| data.enabled | boolean | 필수 | 사용 여부  |
| data.target | string | 필수 | 이월일 정책 허용: NEXT_DAY, NEXT_WORKDAY |
| data.maxCount | integer | 필수 | 최대 이월 횟수 최소 1; 최대 365 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "target": "NEXT_DAY",
    "maxCount": 7
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |

<a id="dday-01"></a>
## DDAY-01 · D-Day 목록

- 요청 URL: `https://api.example.test/api/v1/ddays` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/ddays HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | DdayPage | 필수 | 하위 구조 참조  |
| data.items | Dday[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].targetDate | string (date) | 필수 | 기준 날짜  |
| data.items[].repeatYearly | boolean | 선택 | 매년 반복  |
| data.items[].timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.items[].daysRemaining | integer | 필수 | 사용자 날짜와 기준 날짜 차이  |
| data.items[].version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.items[].createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.items[].updatedAt | string (date-time) | 필수 | 수정 UTC  |
| data.nextCursor | string / null | 필수 | 다음 페이지 커서; 마지막 null; null 허용  |
| data.hasNext | boolean | 필수 | 다음 페이지 여부  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "01J00000000000000000000001",
        "title": "설계 검토",
        "targetDate": "2026-09-26",
        "repeatYearly": false,
        "timezone": "Asia/Seoul",
        "daysRemaining": 7,
        "version": 1,
        "createdAt": "2026-09-26T00:00:00Z",
        "updatedAt": "2026-09-26T00:00:00Z"
      }
    ],
    "nextCursor": null,
    "hasNext": false
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |

<a id="dday-02"></a>
## DDAY-02 · D-Day 생성

- 요청 URL: `https://api.example.test/api/v1/ddays` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| Idempotency-Key | 필수 | 24시간 동안 동일 key+본문=동일 결과; 예 00000000-0000-4000-8000-000000000001 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| targetDate | string (date) | 필수 | 기준 날짜  |
| repeatYearly | boolean | 선택 | 매년 반복  |
| timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |

```json
{
  "title": "설계 검토",
  "targetDate": "2026-09-26",
  "repeatYearly": false,
  "timezone": "Asia/Seoul"
}
```

### 요청 예시

```http
POST /api/v1/ddays HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "title": "설계 검토",
  "targetDate": "2026-09-26",
  "repeatYearly": false,
  "timezone": "Asia/Seoul"
}
```

### 성공 응답

HTTP **201**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Dday | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.targetDate | string (date) | 필수 | 기준 날짜  |
| data.repeatYearly | boolean | 선택 | 매년 반복  |
| data.timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.daysRemaining | integer | 필수 | 사용자 날짜와 기준 날짜 차이  |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "targetDate": "2026-09-26",
    "repeatYearly": false,
    "timezone": "Asia/Seoul",
    "daysRemaining": 7,
    "version": 1,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 409 | IDEMPOTENCY_CONFLICT | 같은 멱등키에 다른 요청 본문 | 동일 요청은 원래 키, 새 의도는 새 UUID 사용 |

<a id="dday-03"></a>
## DDAY-03 · D-Day 수정

- 요청 URL: `https://api.example.test/api/v1/ddays/{id}` (예약 예시 도메인)
- HTTP 메서드: **PATCH**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| If-Match | 필수 | GET 응답 ETag; 양쪽 따옴표 포함; 예 "1" |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| targetDate | string (date) | 선택 | 기준 날짜  |
| repeatYearly | boolean | 선택 | 매년 반복  |
| timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |

```json
{
  "title": "설계 검토",
  "targetDate": "2026-09-26",
  "repeatYearly": false,
  "timezone": "Asia/Seoul"
}
```

### 요청 예시

```http
PATCH /api/v1/ddays/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "title": "설계 검토",
  "targetDate": "2026-09-26",
  "repeatYearly": false,
  "timezone": "Asia/Seoul"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Dday | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.targetDate | string (date) | 필수 | 기준 날짜  |
| data.repeatYearly | boolean | 선택 | 매년 반복  |
| data.timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.daysRemaining | integer | 필수 | 사용자 날짜와 기준 날짜 차이  |
| data.version | integer | 필수 | 낙관적 잠금 버전; ETag와 동일 최소 1; 최대 1000000 |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| data.updatedAt | string (date-time) | 필수 | 수정 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "targetDate": "2026-09-26",
    "repeatYearly": false,
    "timezone": "Asia/Seoul",
    "daysRemaining": 7,
    "version": 1,
    "createdAt": "2026-09-26T00:00:00Z",
    "updatedAt": "2026-09-26T00:00:00Z"
  },
  "message": null,
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |

<a id="dday-04"></a>
## DDAY-04 · D-Day 삭제

- 요청 URL: `https://api.example.test/api/v1/ddays/{id}` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| If-Match | 필수 | GET 응답 ETag; 양쪽 따옴표 포함; 예 "1" |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
DELETE /api/v1/ddays/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
```

### 성공 응답

HTTP **204**. 응답 본문 없음. JSON 파싱하지 않습니다.

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |
