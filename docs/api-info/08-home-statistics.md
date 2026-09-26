# 홈·통계·알림 API 상세 설계

2026-09-26 · 목표 /api/v1 · **서버 미구현** · 6개

[전체 목록](catalog.md) · [공통 규칙](00-conventions.md) · [오류 사전](errors.md) · [OpenAPI JSON](openapi.target.json)

## 업무 규칙

알림은 멱등한 읽음 지정이며 토글이 아닙니다. read-all은 before 경계까지 한정합니다. 통계 분모가 0이면 rate=null이고 미래 날짜·SKIP은 분모에서 제외합니다. 같은 시간대·동일 기간 단위로 전일/전주를 비교합니다. 화면의 데모 값은 실제 집계 성공으로 간주하지 않습니다.

## 빠른 이동

- [HOME-01 오늘 요약](#home-01)
- [HOME-02 알림 인박스](#home-02)
- [HOME-03 알림 읽음 지정](#home-03)
- [HOME-04 지정 시각 이전 알림 읽음](#home-04)
- [STAT-01 달성률 통합 통계](#stat-01)
- [STAT-02 계획·실제 시간 비교](#stat-02)

<a id="home-01"></a>
## HOME-01 · 오늘 요약

- 요청 URL: `https://api.example.test/api/v1/home/summary` (예약 예시 도메인)
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
| query | date | string (date) | 아니오 | 지역 날짜; 생략하면 사용자 기준 오늘;  |
| query | timezone | string | 아니오 | 유효한 IANA ZoneId; 사용자 설정 기본값; 최대 64자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/home/summary HTTP/1.1
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
| data | DaySummary | 필수 | 하위 구조 참조  |
| data.date | string (date) | 필수 | 지역 날짜  |
| data.events | integer | 필수 | 일정 수 최소 0; 최대 1000000 |
| data.tasks | integer | 필수 | 할 일 수 최소 0; 최대 1000000 |
| data.routines | integer | 필수 | 예정 루틴 수 최소 0; 최대 1000000 |
| data.completed | integer | 필수 | 할 일/루틴 완료 수 최소 0; 최대 1000000 |
| data.actualMinutes | integer | 필수 | 실제 기록 분 최소 0; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "date": "2026-09-26",
    "events": 2,
    "tasks": 3,
    "routines": 2,
    "completed": 1,
    "actualMinutes": 60
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

<a id="home-02"></a>
## HOME-02 · 알림 인박스

- 요청 URL: `https://api.example.test/api/v1/notifications` (예약 예시 도메인)
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
| query | unread | boolean | 아니오 | 읽지 않은 항목만 true;  |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/notifications HTTP/1.1
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
| data | NotificationPage | 필수 | 하위 구조 참조  |
| data.items | Notification[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].type | string | 필수 | 알림 유형  |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].body | string | 필수 | 민감정보 제외 안내 최대 500자 |
| data.items[].read | boolean | 필수 | 읽음  |
| data.items[].resourceType | string | 필수 | 내부 허용된 종류  |
| data.items[].resourceId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].createdAt | string (date-time) | 필수 | 생성  |
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
        "type": "ROUTINE_REMINDER",
        "title": "설계 검토",
        "body": "루틴을 확인해보세요",
        "read": false,
        "resourceType": "ROUTINE",
        "resourceId": "01J00000000000000000000001",
        "createdAt": "2026-09-26T00:00:00Z"
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

<a id="home-03"></a>
## HOME-03 · 알림 읽음 지정

- 요청 URL: `https://api.example.test/api/v1/notifications/{id}/read` (예약 예시 도메인)
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

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| read | boolean | 필수 | 읽음 상태  |

```json
{
  "read": true
}
```

### 요청 예시

```http
PUT /api/v1/notifications/01J00000000000000000000001/read HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "read": true
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Notification | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.type | string | 필수 | 알림 유형  |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 필수 | 민감정보 제외 안내 최대 500자 |
| data.read | boolean | 필수 | 읽음  |
| data.resourceType | string | 필수 | 내부 허용된 종류  |
| data.resourceId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.createdAt | string (date-time) | 필수 | 생성  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "type": "ROUTINE_REMINDER",
    "title": "설계 검토",
    "body": "루틴을 확인해보세요",
    "read": true,
    "resourceType": "ROUTINE",
    "resourceId": "01J00000000000000000000001",
    "createdAt": "2026-09-26T00:00:00Z"
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

<a id="home-04"></a>
## HOME-04 · 지정 시각 이전 알림 읽음

- 요청 URL: `https://api.example.test/api/v1/notifications/read-all` (예약 예시 도메인)
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
| before | string (date-time) | 필수 | 이 시각 이전의 알림만 처리  |

```json
{
  "before": "2026-09-26T00:00:00Z"
}
```

### 요청 예시

```http
POST /api/v1/notifications/read-all HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "before": "2026-09-26T00:00:00Z"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | CountResult | 필수 | 하위 구조 참조  |
| data.count | integer | 필수 | 처리된 개수 최소 0; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "count": 3
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

<a id="stat-01"></a>
## STAT-01 · 달성률 통합 통계

- 요청 URL: `https://api.example.test/api/v1/statistics/overview` (예약 예시 도메인)
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
| query | timezone | string | 아니오 | 유효한 IANA ZoneId; 사용자 설정 기본값; 최대 64자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/statistics/overview?from=2026-09-26&to=2026-09-27 HTTP/1.1
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
| data | Statistics | 필수 | 하위 구조 참조  |
| data.from | string (date) | 필수 | 포함 시작일  |
| data.to | string (date) | 필수 | 미포함 종료일  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.tasks | Rate | 필수 | 하위 구조 참조  |
| data.tasks.done | integer | 필수 | 완료 최소 0; 최대 1000000 |
| data.tasks.eligible | integer | 필수 | 분모 최소 0; 최대 1000000 |
| data.tasks.rate | number / null | 필수 | 0~100; 분모 0이면 null; null 허용  |
| data.routines | Rate | 필수 | 하위 구조 참조  |
| data.routines.done | integer | 필수 | 완료 최소 0; 최대 1000000 |
| data.routines.eligible | integer | 필수 | 분모 최소 0; 최대 1000000 |
| data.routines.rate | number / null | 필수 | 0~100; 분모 0이면 null; null 허용  |
| data.diaries | Rate | 필수 | 하위 구조 참조  |
| data.diaries.done | integer | 필수 | 완료 최소 0; 최대 1000000 |
| data.diaries.eligible | integer | 필수 | 분모 최소 0; 최대 1000000 |
| data.diaries.rate | number / null | 필수 | 0~100; 분모 0이면 null; null 허용  |
| data.actualMinutes | integer | 필수 | ACTUAL 분 최소 0; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "from": "2026-09-26",
    "to": "2026-09-27",
    "timezone": "Asia/Seoul",
    "tasks": {
      "done": 2,
      "eligible": 3,
      "rate": 66.67
    },
    "routines": {
      "done": 2,
      "eligible": 3,
      "rate": 66.67
    },
    "diaries": {
      "done": 2,
      "eligible": 3,
      "rate": 66.67
    },
    "actualMinutes": 60
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

<a id="stat-02"></a>
## STAT-02 · 계획·실제 시간 비교

- 요청 URL: `https://api.example.test/api/v1/statistics/plan-actual` (예약 예시 도메인)
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
| query | timezone | string | 아니오 | 유효한 IANA ZoneId; 사용자 설정 기본값; 최대 64자 |
| query | groupBy | string | 아니오 | 통계 그룹; 허용: DAY, WEEK, MONTH, CATEGORY; 기본 DAY |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/statistics/plan-actual?from=2026-09-26&to=2026-09-27 HTTP/1.1
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
| data | TimeComparison[] | 필수 | 기간 내 집계 배열 최대 366개 |
| data[].key | string | 필수 | groupBy에 따른 집계 키  |
| data[].planMinutes | integer | 필수 | 계획 분 최소 0; 최대 1000000 |
| data[].actualMinutes | integer | 필수 | 실제 분 최소 0; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": [
    {
      "key": "2026-09-26",
      "planMinutes": 120,
      "actualMinutes": 100
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
