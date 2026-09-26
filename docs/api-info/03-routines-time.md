# 루틴·타임바·집중 API 상세 설계

2026-09-26 · 목표 /api/v1 · **서버 미구현** · 13개

[전체 목록](catalog.md) · [공통 규칙](00-conventions.md) · [오류 사전](errors.md) · [OpenAPI JSON](openapi.target.json)

## 업무 규칙

루틴은 1~1440분, 요일 중복 불가입니다. 로그 생성 If-None-Match: *, 수정 If-Match를 구분합니다. ACTUAL 겹침은 409, PLAN 겹침은 허용합니다. 실제 블록은 최대24시간이며 날짜별 통계에서만 자정 경계를 분할합니다. 집중 완료 재전송으로 타임바가 중복 생성되지 않도록 focus_session_id UNIQUE를 둡니다.

## 빠른 이동

- [ROUTINE-01 루틴 목록](#routine-01)
- [ROUTINE-02 루틴 만들기](#routine-02)
- [ROUTINE-03 루틴 상세](#routine-03)
- [ROUTINE-04 루틴 수정](#routine-04)
- [ROUTINE-05 루틴 삭제](#routine-05)
- [ROUTINE-06 날짜별 목표 달성 상태](#routine-06)
- [ROUTINE-07 루틴 달성 이력](#routine-07)
- [TIME-01 계획·실제 시간 블록](#time-01)
- [TIME-02 시간 블록 생성](#time-02)
- [TIME-03 시간 블록 수정](#time-03)
- [TIME-04 시간 블록 삭제](#time-04)
- [FOCUS-01 집중 시작](#focus-01)
- [FOCUS-02 집중 종료 및 타임바 연결](#focus-02)

<a id="routine-01"></a>
## ROUTINE-01 · 루틴 목록

- 요청 URL: `https://api.example.test/api/v1/routines` (예약 예시 도메인)
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
| query | active | boolean | 아니오 | 활성 루틴만 true;  |
| query | date | string (date) | 아니오 | 지역 날짜; 생략하면 사용자 기준 오늘;  |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/routines HTTP/1.1
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
| data | RoutinePage | 필수 | 하위 구조 참조  |
| data.items | Routine[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].name | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].atTime | string | 필수 | 사용자 지역 시각 HH:mm 정규식 ^([01][0-9]&#124;2[0-3]):[0-5][0-9]$ |
| data.items[].timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.items[].weekdays | string[] | 필수 | 반복 요일; 중복 불가 최대 7개; 중복 불가 |
| data.items[].durationMin | integer | 필수 | 진행 분 최소 1; 최대 1440 |
| data.items[].active | boolean | 선택 | 활성  |
| data.items[].notifyEnabled | boolean | 선택 | 알림 설정  |
| data.items[].reminderMinutes | integer | 선택 | 시작 전 알림 분 최소 0; 최대 1440 |
| data.items[].goalCount | integer | 선택 | 목표 수량 최소 1; 최대 9999 |
| data.items[].goalUnit | string | 선택 | 목표 단위 최소 1자; 최대 20자 |
| data.items[].categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.items[].body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
        "id": "01J00000000000000000000001",
        "name": "설계 검토",
        "atTime": "09:00",
        "timezone": "Asia/Seoul",
        "weekdays": [
          "MON"
        ],
        "durationMin": 30,
        "active": true,
        "notifyEnabled": true,
        "reminderMinutes": 10,
        "goalCount": 1,
        "goalUnit": "회",
        "categoryId": null,
        "body": "오늘의 기록 #업무",
        "tags": [
          "업무"
        ],
        "mentionUserIds": [
          "01J00000000000000000000001"
        ],
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

<a id="routine-02"></a>
## ROUTINE-02 · 루틴 만들기

- 요청 URL: `https://api.example.test/api/v1/routines` (예약 예시 도메인)
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
| name | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| atTime | string | 필수 | 사용자 지역 시각 HH:mm 정규식 ^([01][0-9]&#124;2[0-3]):[0-5][0-9]$ |
| timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| weekdays | string[] | 필수 | 반복 요일; 중복 불가 최대 7개; 중복 불가 |
| durationMin | integer | 필수 | 진행 분 최소 1; 최대 1440 |
| active | boolean | 선택 | 활성  |
| notifyEnabled | boolean | 선택 | 알림 설정  |
| reminderMinutes | integer | 선택 | 시작 전 알림 분 최소 0; 최대 1440 |
| goalCount | integer | 선택 | 목표 수량 최소 1; 최대 9999 |
| goalUnit | string | 선택 | 목표 단위 최소 1자; 최대 20자 |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "name": "설계 검토",
  "atTime": "09:00",
  "timezone": "Asia/Seoul",
  "weekdays": [
    "MON"
  ],
  "durationMin": 30,
  "active": true,
  "notifyEnabled": true,
  "reminderMinutes": 10,
  "goalCount": 1,
  "goalUnit": "회",
  "categoryId": null,
  "body": "오늘의 기록 #업무",
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
POST /api/v1/routines HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "name": "설계 검토",
  "atTime": "09:00",
  "timezone": "Asia/Seoul",
  "weekdays": [
    "MON"
  ],
  "durationMin": 30,
  "active": true,
  "notifyEnabled": true,
  "reminderMinutes": 10,
  "goalCount": 1,
  "goalUnit": "회",
  "categoryId": null,
  "body": "오늘의 기록 #업무",
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
| data | Routine | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.name | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.atTime | string | 필수 | 사용자 지역 시각 HH:mm 정규식 ^([01][0-9]&#124;2[0-3]):[0-5][0-9]$ |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.weekdays | string[] | 필수 | 반복 요일; 중복 불가 최대 7개; 중복 불가 |
| data.durationMin | integer | 필수 | 진행 분 최소 1; 최대 1440 |
| data.active | boolean | 선택 | 활성  |
| data.notifyEnabled | boolean | 선택 | 알림 설정  |
| data.reminderMinutes | integer | 선택 | 시작 전 알림 분 최소 0; 최대 1440 |
| data.goalCount | integer | 선택 | 목표 수량 최소 1; 최대 9999 |
| data.goalUnit | string | 선택 | 목표 단위 최소 1자; 최대 20자 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
    "id": "01J00000000000000000000001",
    "name": "설계 검토",
    "atTime": "09:00",
    "timezone": "Asia/Seoul",
    "weekdays": [
      "MON"
    ],
    "durationMin": 30,
    "active": true,
    "notifyEnabled": true,
    "reminderMinutes": 10,
    "goalCount": 1,
    "goalUnit": "회",
    "categoryId": null,
    "body": "오늘의 기록 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
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

<a id="routine-03"></a>
## ROUTINE-03 · 루틴 상세

- 요청 URL: `https://api.example.test/api/v1/routines/{id}` (예약 예시 도메인)
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
GET /api/v1/routines/01J00000000000000000000001 HTTP/1.1
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
| data | Routine | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.name | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.atTime | string | 필수 | 사용자 지역 시각 HH:mm 정규식 ^([01][0-9]&#124;2[0-3]):[0-5][0-9]$ |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.weekdays | string[] | 필수 | 반복 요일; 중복 불가 최대 7개; 중복 불가 |
| data.durationMin | integer | 필수 | 진행 분 최소 1; 최대 1440 |
| data.active | boolean | 선택 | 활성  |
| data.notifyEnabled | boolean | 선택 | 알림 설정  |
| data.reminderMinutes | integer | 선택 | 시작 전 알림 분 최소 0; 최대 1440 |
| data.goalCount | integer | 선택 | 목표 수량 최소 1; 최대 9999 |
| data.goalUnit | string | 선택 | 목표 단위 최소 1자; 최대 20자 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
    "id": "01J00000000000000000000001",
    "name": "설계 검토",
    "atTime": "09:00",
    "timezone": "Asia/Seoul",
    "weekdays": [
      "MON"
    ],
    "durationMin": 30,
    "active": true,
    "notifyEnabled": true,
    "reminderMinutes": 10,
    "goalCount": 1,
    "goalUnit": "회",
    "categoryId": null,
    "body": "오늘의 기록 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
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

<a id="routine-04"></a>
## ROUTINE-04 · 루틴 수정

- 요청 URL: `https://api.example.test/api/v1/routines/{id}` (예약 예시 도메인)
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
| name | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| atTime | string | 선택 | 사용자 지역 시각 HH:mm 정규식 ^([01][0-9]&#124;2[0-3]):[0-5][0-9]$ |
| timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| weekdays | string[] | 선택 | 반복 요일; 중복 불가 최대 7개; 중복 불가 |
| durationMin | integer | 선택 | 진행 분 최소 1; 최대 1440 |
| active | boolean | 선택 | 활성  |
| notifyEnabled | boolean | 선택 | 알림 설정  |
| reminderMinutes | integer | 선택 | 시작 전 알림 분 최소 0; 최대 1440 |
| goalCount | integer | 선택 | 목표 수량 최소 1; 최대 9999 |
| goalUnit | string | 선택 | 목표 단위 최소 1자; 최대 20자 |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "name": "설계 검토",
  "atTime": "09:00",
  "timezone": "Asia/Seoul",
  "weekdays": [
    "MON"
  ],
  "durationMin": 30,
  "active": true,
  "notifyEnabled": true,
  "reminderMinutes": 10,
  "goalCount": 1,
  "goalUnit": "회",
  "categoryId": null,
  "body": "오늘의 기록 #업무",
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
PATCH /api/v1/routines/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "name": "설계 검토",
  "atTime": "09:00",
  "timezone": "Asia/Seoul",
  "weekdays": [
    "MON"
  ],
  "durationMin": 30,
  "active": true,
  "notifyEnabled": true,
  "reminderMinutes": 10,
  "goalCount": 1,
  "goalUnit": "회",
  "categoryId": null,
  "body": "오늘의 기록 #업무",
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
| data | Routine | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.name | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.atTime | string | 필수 | 사용자 지역 시각 HH:mm 정규식 ^([01][0-9]&#124;2[0-3]):[0-5][0-9]$ |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.weekdays | string[] | 필수 | 반복 요일; 중복 불가 최대 7개; 중복 불가 |
| data.durationMin | integer | 필수 | 진행 분 최소 1; 최대 1440 |
| data.active | boolean | 선택 | 활성  |
| data.notifyEnabled | boolean | 선택 | 알림 설정  |
| data.reminderMinutes | integer | 선택 | 시작 전 알림 분 최소 0; 최대 1440 |
| data.goalCount | integer | 선택 | 목표 수량 최소 1; 최대 9999 |
| data.goalUnit | string | 선택 | 목표 단위 최소 1자; 최대 20자 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
    "id": "01J00000000000000000000001",
    "name": "설계 검토",
    "atTime": "09:00",
    "timezone": "Asia/Seoul",
    "weekdays": [
      "MON"
    ],
    "durationMin": 30,
    "active": true,
    "notifyEnabled": true,
    "reminderMinutes": 10,
    "goalCount": 1,
    "goalUnit": "회",
    "categoryId": null,
    "body": "오늘의 기록 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
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

<a id="routine-05"></a>
## ROUTINE-05 · 루틴 삭제

- 요청 URL: `https://api.example.test/api/v1/routines/{id}` (예약 예시 도메인)
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
DELETE /api/v1/routines/01J00000000000000000000001 HTTP/1.1
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

<a id="routine-06"></a>
## ROUTINE-06 · 날짜별 목표 달성 상태

- 요청 URL: `https://api.example.test/api/v1/routines/{id}/logs/{date}` (예약 예시 도메인)
- HTTP 메서드: **PUT**
- 인증·인가: JWT + 본인/공유/멤버십 권한
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Authorization | 필수 | Bearer &lt;access-token&gt; |
| Content-Type | 필수 | application/json; charset=utf-8 |
| If-Match | 조건부 | 기존 수정 시 필수; 두 조건 헤더 중 정확히 하나; 예 "1" |
| If-None-Match | 조건부 | 신규 저장 시 *; 두 헤더 동시 전송 금지; 예 * |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | id | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |
| path | date | string (date) | 예 | YYYY-MM-DD, 유효한 지역 달력 날짜;  |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| status | string | 필수 | 날짜별 목표 상태 허용: DONE, MISSED, SKIP |

```json
{
  "status": "DONE"
}
```

### 요청 예시

```http
PUT /api/v1/routines/01J00000000000000000000001/logs/2026-09-26 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-None-Match: *
Content-Type: application/json

{
  "status": "DONE"
}
```

### 성공 응답

HTTP **200** (최초 생성 201, 기존 갱신 200). 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | RoutineLog | 필수 | 하위 구조 참조  |
| data.routineId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.date | string (date) | 필수 | 발생 지역 날짜  |
| data.status | string | 필수 | 날짜별 목표 상태 허용: DONE, MISSED, SKIP |
| data.version | integer | 필수 | 기록 버전 최소 1; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "routineId": "01J00000000000000000000001",
    "date": "2026-09-26",
    "status": "DONE",
    "version": 1
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

<a id="routine-07"></a>
## ROUTINE-07 · 루틴 달성 이력

- 요청 URL: `https://api.example.test/api/v1/routines/{id}/history` (예약 예시 도메인)
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
| query | from | string (date) | 예 | 조회 시작 지역 날짜 포함; to와 함께 지정, 범위 최대 93일;  |
| query | to | string (date) | 예 | 조회 종료 지역 날짜 미포함;  |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/routines/01J00000000000000000000001/history?from=2026-09-26&to=2026-09-27 HTTP/1.1
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
| data | RoutineHistory | 필수 | 하위 구조 참조  |
| data.routineId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.entries | RoutineLog[] | 필수 | 날짜별 이력 최대 366개 |
| data.entries[].routineId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.entries[].date | string (date) | 필수 | 발생 지역 날짜  |
| data.entries[].status | string | 필수 | 날짜별 목표 상태 허용: DONE, MISSED, SKIP |
| data.entries[].version | integer | 필수 | 기록 버전 최소 1; 최대 1000000 |
| data.doneCount | integer | 필수 | 완료 횟수 최소 0; 최대 1000000 |
| data.eligibleCount | integer | 필수 | SKIP과 미래 제외 예정 횟수 최소 0; 최대 1000000 |
| data.rate | number / null | 필수 | 백분율; 분모 0이면 null; null 허용  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "routineId": "01J00000000000000000000001",
    "entries": [
      {
        "routineId": "01J00000000000000000000001",
        "date": "2026-09-26",
        "status": "DONE",
        "version": 1
      }
    ],
    "doneCount": 1,
    "eligibleCount": 2,
    "rate": null
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

<a id="time-01"></a>
## TIME-01 · 계획·실제 시간 블록

- 요청 URL: `https://api.example.test/api/v1/time-entries` (예약 예시 도메인)
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
| query | type | string | 아니오 | 타임바 구분; 허용: PLAN, ACTUAL |
| query | timezone | string | 아니오 | 유효한 IANA ZoneId; 사용자 설정 기본값; 최대 64자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/time-entries?from=2026-09-26&to=2026-09-27 HTTP/1.1
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
| data | TimeEntryPage | 필수 | 하위 구조 참조  |
| data.items | TimeEntry[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].type | string | 필수 | 계획/실제 허용: PLAN, ACTUAL |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].startAt | string (date-time) | 필수 | 시작 UTC  |
| data.items[].endAt | string (date-time) | 필수 | 종료 UTC; 최대 24시간  |
| data.items[].timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.items[].categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.items[].eventId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.items[].body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
        "id": "01J00000000000000000000001",
        "type": "ACTUAL",
        "title": "설계 검토",
        "startAt": "2026-09-26T00:00:00Z",
        "endAt": "2026-09-26T01:00:00Z",
        "timezone": "Asia/Seoul",
        "categoryId": null,
        "eventId": null,
        "body": "오늘의 기록 #업무",
        "tags": [
          "업무"
        ],
        "mentionUserIds": [
          "01J00000000000000000000001"
        ],
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

<a id="time-02"></a>
## TIME-02 · 시간 블록 생성

- 요청 URL: `https://api.example.test/api/v1/time-entries` (예약 예시 도메인)
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
| type | string | 필수 | 계획/실제 허용: PLAN, ACTUAL |
| title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| startAt | string (date-time) | 필수 | 시작 UTC  |
| endAt | string (date-time) | 필수 | 종료 UTC; 최대 24시간  |
| timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| eventId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "type": "ACTUAL",
  "title": "설계 검토",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T01:00:00Z",
  "timezone": "Asia/Seoul",
  "categoryId": null,
  "eventId": null,
  "body": "오늘의 기록 #업무",
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
POST /api/v1/time-entries HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "type": "ACTUAL",
  "title": "설계 검토",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T01:00:00Z",
  "timezone": "Asia/Seoul",
  "categoryId": null,
  "eventId": null,
  "body": "오늘의 기록 #업무",
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
| data | TimeEntry | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.type | string | 필수 | 계획/실제 허용: PLAN, ACTUAL |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.startAt | string (date-time) | 필수 | 시작 UTC  |
| data.endAt | string (date-time) | 필수 | 종료 UTC; 최대 24시간  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.eventId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
    "id": "01J00000000000000000000001",
    "type": "ACTUAL",
    "title": "설계 검토",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T01:00:00Z",
    "timezone": "Asia/Seoul",
    "categoryId": null,
    "eventId": null,
    "body": "오늘의 기록 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
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
| 409 | TIME_OVERLAP | ACTUAL 블록이 기존 실제 시간과 겹침 | 허용된 충돌 ID의 시간을 조회하고 조정 |

<a id="time-03"></a>
## TIME-03 · 시간 블록 수정

- 요청 URL: `https://api.example.test/api/v1/time-entries/{id}` (예약 예시 도메인)
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
| type | string | 선택 | 계획/실제 허용: PLAN, ACTUAL |
| title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| startAt | string (date-time) | 선택 | 시작 UTC  |
| endAt | string (date-time) | 선택 | 종료 UTC; 최대 24시간  |
| timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| eventId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "type": "ACTUAL",
  "title": "설계 검토",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T01:00:00Z",
  "timezone": "Asia/Seoul",
  "categoryId": null,
  "eventId": null,
  "body": "오늘의 기록 #업무",
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
PATCH /api/v1/time-entries/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "type": "ACTUAL",
  "title": "설계 검토",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T01:00:00Z",
  "timezone": "Asia/Seoul",
  "categoryId": null,
  "eventId": null,
  "body": "오늘의 기록 #업무",
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
| data | TimeEntry | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.type | string | 필수 | 계획/실제 허용: PLAN, ACTUAL |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.startAt | string (date-time) | 필수 | 시작 UTC  |
| data.endAt | string (date-time) | 필수 | 종료 UTC; 최대 24시간  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.eventId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
    "id": "01J00000000000000000000001",
    "type": "ACTUAL",
    "title": "설계 검토",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T01:00:00Z",
    "timezone": "Asia/Seoul",
    "categoryId": null,
    "eventId": null,
    "body": "오늘의 기록 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
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
| 409 | TIME_OVERLAP | ACTUAL 블록이 기존 실제 시간과 겹침 | 허용된 충돌 ID의 시간을 조회하고 조정 |

<a id="time-04"></a>
## TIME-04 · 시간 블록 삭제

- 요청 URL: `https://api.example.test/api/v1/time-entries/{id}` (예약 예시 도메인)
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
DELETE /api/v1/time-entries/01J00000000000000000000001 HTTP/1.1
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
| 409 | TIME_OVERLAP | ACTUAL 블록이 기존 실제 시간과 겹침 | 허용된 충돌 ID의 시간을 조회하고 조정 |

<a id="focus-01"></a>
## FOCUS-01 · 집중 시작

- 요청 URL: `https://api.example.test/api/v1/focus-sessions` (예약 예시 도메인)
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
| goal | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| durationMin | integer | 필수 | 계획 집중 분 최소 1; 최대 1440 |
| categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |

```json
{
  "goal": "설계 검토",
  "durationMin": 25,
  "categoryId": null
}
```

### 요청 예시

```http
POST /api/v1/focus-sessions HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "goal": "설계 검토",
  "durationMin": 25,
  "categoryId": null
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
| data | FocusSession | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.goal | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.durationMin | integer | 필수 | 계획 집중 분 최소 1; 최대 1440 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.status | string | 필수 | 세션 상태 허용: RUNNING, COMPLETED, CANCELED |
| data.startedAt | string (date-time) | 필수 | 서버 시작 시각  |
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
    "goal": "설계 검토",
    "durationMin": 25,
    "categoryId": null,
    "status": "RUNNING",
    "startedAt": "2026-09-26T00:00:00Z",
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

<a id="focus-02"></a>
## FOCUS-02 · 집중 종료 및 타임바 연결

- 요청 URL: `https://api.example.test/api/v1/focus-sessions/{id}/completion` (예약 예시 도메인)
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
| actualEnd | string (date-time) | 필수 | 실제 종료 시각; 서버 허용 오차 내  |

```json
{
  "actualEnd": "2026-09-26T00:00:00Z"
}
```

### 요청 예시

```http
PUT /api/v1/focus-sessions/01J00000000000000000000001/completion HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "actualEnd": "2026-09-26T00:00:00Z"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | FocusSession | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.goal | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.durationMin | integer | 필수 | 계획 집중 분 최소 1; 최대 1440 |
| data.categoryId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.status | string | 필수 | 세션 상태 허용: RUNNING, COMPLETED, CANCELED |
| data.startedAt | string (date-time) | 필수 | 서버 시작 시각  |
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
    "goal": "설계 검토",
    "durationMin": 25,
    "categoryId": null,
    "status": "COMPLETED",
    "startedAt": "2026-09-26T00:00:00Z",
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
