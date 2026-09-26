# WBS·근무·휴가·이직 API 상세 설계

2026-09-26 · 목표 /api/v1 · **서버 미구현** · 10개

[전체 목록](catalog.md) · [공통 규칙](00-conventions.md) · [오류 사전](errors.md) · [OpenAPI JSON](openapi.target.json)

## 업무 규칙

WBS parentId는 같은 사용자 내에서만 허용하고 순환·깊이20 초과를 422로 거절합니다. 상위 공수/진척은 서버 롤업이며 직접 수정은 409. 자식이 있는 작업 삭제는 HAS_CHILDREN 409로 막고 먼저 하위 작업을 정리합니다. 근무 기록은 공수 집계에서 제외합니다. 반차는 같은 지역 날짜·0.5일, 연차는 0.5일 단위, 외근/출장은 장소, 이직은 toCompany/jobRole 필수입니다. 유형 변경 시 무관한 상세값을 제거합니다. 승인 상태는 HR 결재 연동이 아닌 개인 기록입니다.

## 빠른 이동

- [WBS-01 WBS 계층 조회](#wbs-01)
- [WBS-02 WBS 작업 추가](#wbs-02)
- [WBS-03 WBS 상세](#wbs-03)
- [WBS-04 WBS 기간·담당·공수 수정](#wbs-04)
- [WBS-05 말단 WBS 작업 삭제](#wbs-05)
- [WORK-01 근무·휴가·커리어 목록](#work-01)
- [WORK-02 연차·반차·외근·출장·이직 작성](#work-02)
- [WORK-03 업무 기록 상세](#work-03)
- [WORK-04 업무 기록 수정](#work-04)
- [WORK-05 업무 기록 삭제](#work-05)

<a id="wbs-01"></a>
## WBS-01 · WBS 계층 조회

- 요청 URL: `https://api.example.test/api/v1/work/wbs` (예약 예시 도메인)
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
| query | parentId | string | 아니오 | 부모 WBS ID; 최소 1자; 최대 128자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/work/wbs HTTP/1.1
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
| data | WbsPage | 필수 | 하위 구조 참조  |
| data.items | Wbs[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].parentId | string / null | 선택 | 부모 작업; 같은 소유자, 순환 금지; null 허용  |
| data.items[].ownerLabel | string | 선택 | 담당자 표시명; 접근권한 부여와 무관 최대 80자 |
| data.items[].effortMd | number | 선택 | 말단 작업 공수 최소 0; 최대 100000 |
| data.items[].progress | integer | 선택 | 말단 진척 % 최소 0; 최대 100 |
| data.items[].startDate | string (date) / null | 선택 | 시작 날짜; null 허용  |
| data.items[].endDate | string (date) / null | 선택 | 종료 날짜; 시작 이후/같은 날; null 허용  |
| data.items[].body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.items[].tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.items[].mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.items[].rollupMd | number | 필수 | 하위 공수 합  |
| data.items[].rollupProgress | integer | 필수 | 공수 가중 진척 최소 0; 최대 100 |
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
        "parentId": null,
        "ownerLabel": "김지수",
        "effortMd": 2.5,
        "progress": 30,
        "startDate": null,
        "endDate": null,
        "body": "오늘의 기록 #업무",
        "tags": [
          "업무"
        ],
        "mentionUserIds": [
          "01J00000000000000000000001"
        ],
        "rollupMd": 2.5,
        "rollupProgress": 30,
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |

<a id="wbs-02"></a>
## WBS-02 · WBS 작업 추가

- 요청 URL: `https://api.example.test/api/v1/work/wbs` (예약 예시 도메인)
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
| parentId | string / null | 선택 | 부모 작업; 같은 소유자, 순환 금지; null 허용  |
| ownerLabel | string | 선택 | 담당자 표시명; 접근권한 부여와 무관 최대 80자 |
| effortMd | number | 선택 | 말단 작업 공수 최소 0; 최대 100000 |
| progress | integer | 선택 | 말단 진척 % 최소 0; 최대 100 |
| startDate | string (date) / null | 선택 | 시작 날짜; null 허용  |
| endDate | string (date) / null | 선택 | 종료 날짜; 시작 이후/같은 날; null 허용  |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "설계 검토",
  "parentId": null,
  "ownerLabel": "김지수",
  "effortMd": 2.5,
  "progress": 30,
  "startDate": null,
  "endDate": null,
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
POST /api/v1/work/wbs HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "title": "설계 검토",
  "parentId": null,
  "ownerLabel": "김지수",
  "effortMd": 2.5,
  "progress": 30,
  "startDate": null,
  "endDate": null,
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
| data | Wbs | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.parentId | string / null | 선택 | 부모 작업; 같은 소유자, 순환 금지; null 허용  |
| data.ownerLabel | string | 선택 | 담당자 표시명; 접근권한 부여와 무관 최대 80자 |
| data.effortMd | number | 선택 | 말단 작업 공수 최소 0; 최대 100000 |
| data.progress | integer | 선택 | 말단 진척 % 최소 0; 최대 100 |
| data.startDate | string (date) / null | 선택 | 시작 날짜; null 허용  |
| data.endDate | string (date) / null | 선택 | 종료 날짜; 시작 이후/같은 날; null 허용  |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.rollupMd | number | 필수 | 하위 공수 합  |
| data.rollupProgress | integer | 필수 | 공수 가중 진척 최소 0; 최대 100 |
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
    "parentId": null,
    "ownerLabel": "김지수",
    "effortMd": 2.5,
    "progress": 30,
    "startDate": null,
    "endDate": null,
    "body": "오늘의 기록 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "rollupMd": 2.5,
    "rollupProgress": 30,
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |

<a id="wbs-03"></a>
## WBS-03 · WBS 상세

- 요청 URL: `https://api.example.test/api/v1/work/wbs/{id}` (예약 예시 도메인)
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
GET /api/v1/work/wbs/01J00000000000000000000001 HTTP/1.1
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
| data | Wbs | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.parentId | string / null | 선택 | 부모 작업; 같은 소유자, 순환 금지; null 허용  |
| data.ownerLabel | string | 선택 | 담당자 표시명; 접근권한 부여와 무관 최대 80자 |
| data.effortMd | number | 선택 | 말단 작업 공수 최소 0; 최대 100000 |
| data.progress | integer | 선택 | 말단 진척 % 최소 0; 최대 100 |
| data.startDate | string (date) / null | 선택 | 시작 날짜; null 허용  |
| data.endDate | string (date) / null | 선택 | 종료 날짜; 시작 이후/같은 날; null 허용  |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.rollupMd | number | 필수 | 하위 공수 합  |
| data.rollupProgress | integer | 필수 | 공수 가중 진척 최소 0; 최대 100 |
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
    "parentId": null,
    "ownerLabel": "김지수",
    "effortMd": 2.5,
    "progress": 30,
    "startDate": null,
    "endDate": null,
    "body": "오늘의 기록 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "rollupMd": 2.5,
    "rollupProgress": 30,
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |

<a id="wbs-04"></a>
## WBS-04 · WBS 기간·담당·공수 수정

- 요청 URL: `https://api.example.test/api/v1/work/wbs/{id}` (예약 예시 도메인)
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
| parentId | string / null | 선택 | 부모 작업; 같은 소유자, 순환 금지; null 허용  |
| ownerLabel | string | 선택 | 담당자 표시명; 접근권한 부여와 무관 최대 80자 |
| effortMd | number | 선택 | 말단 작업 공수 최소 0; 최대 100000 |
| progress | integer | 선택 | 말단 진척 % 최소 0; 최대 100 |
| startDate | string (date) / null | 선택 | 시작 날짜; null 허용  |
| endDate | string (date) / null | 선택 | 종료 날짜; 시작 이후/같은 날; null 허용  |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "설계 검토",
  "parentId": null,
  "ownerLabel": "김지수",
  "effortMd": 2.5,
  "progress": 30,
  "startDate": null,
  "endDate": null,
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
PATCH /api/v1/work/wbs/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "title": "설계 검토",
  "parentId": null,
  "ownerLabel": "김지수",
  "effortMd": 2.5,
  "progress": 30,
  "startDate": null,
  "endDate": null,
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
| data | Wbs | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.parentId | string / null | 선택 | 부모 작업; 같은 소유자, 순환 금지; null 허용  |
| data.ownerLabel | string | 선택 | 담당자 표시명; 접근권한 부여와 무관 최대 80자 |
| data.effortMd | number | 선택 | 말단 작업 공수 최소 0; 최대 100000 |
| data.progress | integer | 선택 | 말단 진척 % 최소 0; 최대 100 |
| data.startDate | string (date) / null | 선택 | 시작 날짜; null 허용  |
| data.endDate | string (date) / null | 선택 | 종료 날짜; 시작 이후/같은 날; null 허용  |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.rollupMd | number | 필수 | 하위 공수 합  |
| data.rollupProgress | integer | 필수 | 공수 가중 진척 최소 0; 최대 100 |
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
    "parentId": null,
    "ownerLabel": "김지수",
    "effortMd": 2.5,
    "progress": 30,
    "startDate": null,
    "endDate": null,
    "body": "오늘의 기록 #업무",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "rollupMd": 2.5,
    "rollupProgress": 30,
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |

<a id="wbs-05"></a>
## WBS-05 · 말단 WBS 작업 삭제

- 요청 URL: `https://api.example.test/api/v1/work/wbs/{id}` (예약 예시 도메인)
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
DELETE /api/v1/work/wbs/01J00000000000000000000001 HTTP/1.1
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |

<a id="work-01"></a>
## WORK-01 · 근무·휴가·커리어 목록

- 요청 URL: `https://api.example.test/api/v1/work/records` (예약 예시 도메인)
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
| query | type | string | 아니오 | 업무 기록 종류; 허용: ANNUAL_LEAVE, HALF_DAY, OFFSITE, BUSINESS_TRIP, JOB_CHANGE, OTHER |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/work/records?from=2026-09-26&to=2026-09-27 HTTP/1.1
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
| data | WorkRecordPage | 필수 | 하위 구조 참조  |
| data.items | WorkRecord[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].type | string | 필수 | 개인 업무 기록 종류 허용: ANNUAL_LEAVE, HALF_DAY, OFFSITE, BUSINESS_TRIP, JOB_CHANGE, OTHER |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].ownerLabel | string | 필수 | 담당자 최소 1자; 최대 80자 |
| data.items[].wbsId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.items[].startAt | string (date-time) | 필수 | 시작 UTC  |
| data.items[].endAt | string (date-time) | 필수 | 종료 UTC  |
| data.items[].timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.items[].status | string | 선택 | 메모용 상태; 실제 HR 결재 아님 허용: PLANNED, REQUESTED, APPROVED, IN_PROGRESS, DONE, CANCELED |
| data.items[].halfDay | string / null | 선택 | 반차 구분; null 허용  |
| data.items[].leaveDays | number | 선택 | 연차 0.5 단위; 반차는 0.5, 휴일 자동 산정 없음 최소 0; 최대 365 |
| data.items[].location | string | 선택 | 외근/출장 장소 최대 255자 |
| data.items[].partner | string | 선택 | 방문처/담당자 최대 200자 |
| data.items[].transport | string | 선택 | 교통/숙박 최대 255자 |
| data.items[].expenseKrw | integer | 선택 | 예상 경비; KRW 정수 최소 0; 최대 100000000 |
| data.items[].fromCompany | string | 선택 | 이전 회사 최대 200자 |
| data.items[].toCompany | string | 선택 | 이직 회사 최대 200자 |
| data.items[].jobRole | string | 선택 | 직무/직급 최대 100자 |
| data.items[].handover | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
        "type": "ANNUAL_LEAVE",
        "title": "연차 사용",
        "ownerLabel": "김지수",
        "startAt": "2026-09-26T00:00:00Z",
        "endAt": "2026-09-26T09:00:00Z",
        "timezone": "Asia/Seoul",
        "status": "PLANNED",
        "leaveDays": 1,
        "body": "개인 일정 #휴가",
        "tags": [
          "휴가"
        ],
        "mentionUserIds": [],
        "id": "01J00000000000000000000001",
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |

<a id="work-02"></a>
## WORK-02 · 연차·반차·외근·출장·이직 작성

- 요청 URL: `https://api.example.test/api/v1/work/records` (예약 예시 도메인)
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
| type | string | 필수 | 개인 업무 기록 종류 허용: ANNUAL_LEAVE, HALF_DAY, OFFSITE, BUSINESS_TRIP, JOB_CHANGE, OTHER |
| title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| ownerLabel | string | 필수 | 담당자 최소 1자; 최대 80자 |
| wbsId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| startAt | string (date-time) | 필수 | 시작 UTC  |
| endAt | string (date-time) | 필수 | 종료 UTC  |
| timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| status | string | 선택 | 메모용 상태; 실제 HR 결재 아님 허용: PLANNED, REQUESTED, APPROVED, IN_PROGRESS, DONE, CANCELED |
| halfDay | string / null | 선택 | 반차 구분; null 허용  |
| leaveDays | number | 선택 | 연차 0.5 단위; 반차는 0.5, 휴일 자동 산정 없음 최소 0; 최대 365 |
| location | string | 선택 | 외근/출장 장소 최대 255자 |
| partner | string | 선택 | 방문처/담당자 최대 200자 |
| transport | string | 선택 | 교통/숙박 최대 255자 |
| expenseKrw | integer | 선택 | 예상 경비; KRW 정수 최소 0; 최대 100000000 |
| fromCompany | string | 선택 | 이전 회사 최대 200자 |
| toCompany | string | 선택 | 이직 회사 최대 200자 |
| jobRole | string | 선택 | 직무/직급 최대 100자 |
| handover | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "type": "ANNUAL_LEAVE",
  "title": "연차 사용",
  "ownerLabel": "김지수",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T09:00:00Z",
  "timezone": "Asia/Seoul",
  "status": "PLANNED",
  "leaveDays": 1,
  "body": "개인 일정 #휴가",
  "tags": [
    "휴가"
  ],
  "mentionUserIds": []
}
```

### 요청 예시

```http
POST /api/v1/work/records HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "type": "ANNUAL_LEAVE",
  "title": "연차 사용",
  "ownerLabel": "김지수",
  "startAt": "2026-09-26T00:00:00Z",
  "endAt": "2026-09-26T09:00:00Z",
  "timezone": "Asia/Seoul",
  "status": "PLANNED",
  "leaveDays": 1,
  "body": "개인 일정 #휴가",
  "tags": [
    "휴가"
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
| data | WorkRecord | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.type | string | 필수 | 개인 업무 기록 종류 허용: ANNUAL_LEAVE, HALF_DAY, OFFSITE, BUSINESS_TRIP, JOB_CHANGE, OTHER |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.ownerLabel | string | 필수 | 담당자 최소 1자; 최대 80자 |
| data.wbsId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.startAt | string (date-time) | 필수 | 시작 UTC  |
| data.endAt | string (date-time) | 필수 | 종료 UTC  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.status | string | 선택 | 메모용 상태; 실제 HR 결재 아님 허용: PLANNED, REQUESTED, APPROVED, IN_PROGRESS, DONE, CANCELED |
| data.halfDay | string / null | 선택 | 반차 구분; null 허용  |
| data.leaveDays | number | 선택 | 연차 0.5 단위; 반차는 0.5, 휴일 자동 산정 없음 최소 0; 최대 365 |
| data.location | string | 선택 | 외근/출장 장소 최대 255자 |
| data.partner | string | 선택 | 방문처/담당자 최대 200자 |
| data.transport | string | 선택 | 교통/숙박 최대 255자 |
| data.expenseKrw | integer | 선택 | 예상 경비; KRW 정수 최소 0; 최대 100000000 |
| data.fromCompany | string | 선택 | 이전 회사 최대 200자 |
| data.toCompany | string | 선택 | 이직 회사 최대 200자 |
| data.jobRole | string | 선택 | 직무/직급 최대 100자 |
| data.handover | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
    "type": "ANNUAL_LEAVE",
    "title": "연차 사용",
    "ownerLabel": "김지수",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T09:00:00Z",
    "timezone": "Asia/Seoul",
    "status": "PLANNED",
    "leaveDays": 1,
    "body": "개인 일정 #휴가",
    "tags": [
      "휴가"
    ],
    "mentionUserIds": [],
    "id": "01J00000000000000000000001",
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |

<a id="work-03"></a>
## WORK-03 · 업무 기록 상세

- 요청 URL: `https://api.example.test/api/v1/work/records/{id}` (예약 예시 도메인)
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
GET /api/v1/work/records/01J00000000000000000000001 HTTP/1.1
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
| data | WorkRecord | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.type | string | 필수 | 개인 업무 기록 종류 허용: ANNUAL_LEAVE, HALF_DAY, OFFSITE, BUSINESS_TRIP, JOB_CHANGE, OTHER |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.ownerLabel | string | 필수 | 담당자 최소 1자; 최대 80자 |
| data.wbsId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.startAt | string (date-time) | 필수 | 시작 UTC  |
| data.endAt | string (date-time) | 필수 | 종료 UTC  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.status | string | 선택 | 메모용 상태; 실제 HR 결재 아님 허용: PLANNED, REQUESTED, APPROVED, IN_PROGRESS, DONE, CANCELED |
| data.halfDay | string / null | 선택 | 반차 구분; null 허용  |
| data.leaveDays | number | 선택 | 연차 0.5 단위; 반차는 0.5, 휴일 자동 산정 없음 최소 0; 최대 365 |
| data.location | string | 선택 | 외근/출장 장소 최대 255자 |
| data.partner | string | 선택 | 방문처/담당자 최대 200자 |
| data.transport | string | 선택 | 교통/숙박 최대 255자 |
| data.expenseKrw | integer | 선택 | 예상 경비; KRW 정수 최소 0; 최대 100000000 |
| data.fromCompany | string | 선택 | 이전 회사 최대 200자 |
| data.toCompany | string | 선택 | 이직 회사 최대 200자 |
| data.jobRole | string | 선택 | 직무/직급 최대 100자 |
| data.handover | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
    "type": "ANNUAL_LEAVE",
    "title": "연차 사용",
    "ownerLabel": "김지수",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T09:00:00Z",
    "timezone": "Asia/Seoul",
    "status": "PLANNED",
    "leaveDays": 1,
    "body": "개인 일정 #휴가",
    "tags": [
      "휴가"
    ],
    "mentionUserIds": [],
    "id": "01J00000000000000000000001",
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |

<a id="work-04"></a>
## WORK-04 · 업무 기록 수정

- 요청 URL: `https://api.example.test/api/v1/work/records/{id}` (예약 예시 도메인)
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
| type | string | 선택 | 개인 업무 기록 종류 허용: ANNUAL_LEAVE, HALF_DAY, OFFSITE, BUSINESS_TRIP, JOB_CHANGE, OTHER |
| title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| ownerLabel | string | 선택 | 담당자 최소 1자; 최대 80자 |
| wbsId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| startAt | string (date-time) | 선택 | 시작 UTC  |
| endAt | string (date-time) | 선택 | 종료 UTC  |
| timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| status | string | 선택 | 메모용 상태; 실제 HR 결재 아님 허용: PLANNED, REQUESTED, APPROVED, IN_PROGRESS, DONE, CANCELED |
| halfDay | string / null | 선택 | 반차 구분; null 허용  |
| leaveDays | number | 선택 | 연차 0.5 단위; 반차는 0.5, 휴일 자동 산정 없음 최소 0; 최대 365 |
| location | string | 선택 | 외근/출장 장소 최대 255자 |
| partner | string | 선택 | 방문처/담당자 최대 200자 |
| transport | string | 선택 | 교통/숙박 최대 255자 |
| expenseKrw | integer | 선택 | 예상 경비; KRW 정수 최소 0; 최대 100000000 |
| fromCompany | string | 선택 | 이전 회사 최대 200자 |
| toCompany | string | 선택 | 이직 회사 최대 200자 |
| jobRole | string | 선택 | 직무/직급 최대 100자 |
| handover | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "연차 사용 일정 변경",
  "body": "변경 사유 #휴가"
}
```

### 요청 예시

```http
PATCH /api/v1/work/records/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "title": "연차 사용 일정 변경",
  "body": "변경 사유 #휴가"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | WorkRecord | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.type | string | 필수 | 개인 업무 기록 종류 허용: ANNUAL_LEAVE, HALF_DAY, OFFSITE, BUSINESS_TRIP, JOB_CHANGE, OTHER |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.ownerLabel | string | 필수 | 담당자 최소 1자; 최대 80자 |
| data.wbsId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.startAt | string (date-time) | 필수 | 시작 UTC  |
| data.endAt | string (date-time) | 필수 | 종료 UTC  |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.status | string | 선택 | 메모용 상태; 실제 HR 결재 아님 허용: PLANNED, REQUESTED, APPROVED, IN_PROGRESS, DONE, CANCELED |
| data.halfDay | string / null | 선택 | 반차 구분; null 허용  |
| data.leaveDays | number | 선택 | 연차 0.5 단위; 반차는 0.5, 휴일 자동 산정 없음 최소 0; 최대 365 |
| data.location | string | 선택 | 외근/출장 장소 최대 255자 |
| data.partner | string | 선택 | 방문처/담당자 최대 200자 |
| data.transport | string | 선택 | 교통/숙박 최대 255자 |
| data.expenseKrw | integer | 선택 | 예상 경비; KRW 정수 최소 0; 최대 100000000 |
| data.fromCompany | string | 선택 | 이전 회사 최대 200자 |
| data.toCompany | string | 선택 | 이직 회사 최대 200자 |
| data.jobRole | string | 선택 | 직무/직급 최대 100자 |
| data.handover | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
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
    "type": "ANNUAL_LEAVE",
    "title": "연차 사용",
    "ownerLabel": "김지수",
    "startAt": "2026-09-26T00:00:00Z",
    "endAt": "2026-09-26T09:00:00Z",
    "timezone": "Asia/Seoul",
    "status": "PLANNED",
    "leaveDays": 1,
    "body": "개인 일정 #휴가",
    "tags": [
      "휴가"
    ],
    "mentionUserIds": [],
    "id": "01J00000000000000000000001",
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |

<a id="work-05"></a>
## WORK-05 · 업무 기록 삭제

- 요청 URL: `https://api.example.test/api/v1/work/records/{id}` (예약 예시 도메인)
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
DELETE /api/v1/work/records/01J00000000000000000000001 HTTP/1.1
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
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
