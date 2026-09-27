# 다이어리·메모·태그·멘션 API 상세 설계

2026-09-26 · 목표 /api/v1 · **서버 미구현** · 18개

[전체 목록](catalog.md) · [공통 규칙](00-conventions.md) · [오류 사전](errors.md) · [OpenAPI JSON](openapi.target.json)

## 업무 규칙

다이어리는 서버 목표 모델에서 사용자·날짜당 1개입니다. 현재 로컬 시연에서 같은 날 여러 글을 만들 수 있으므로 이관 때 합치기/선택 화면이 필요합니다. 태그 최대20개, 멘션 최대20명; 원본 조회 권한이 없는 멘션 수신자에게 본문을 노출하지 않습니다. AI/STT는 외부 전송 동의를 검사하고 초안만 반환하며 자동으로 할 일을 저장하지 않습니다.

## 빠른 이동

- [DIARY-01 일간 회고 캘린더·목록](#diary-01)
- [DIARY-02 일간 회고 상세](#diary-02)
- [DIARY-03 일간 회고 저장](#diary-03)
- [DIARY-04 일간 회고 삭제](#diary-04)
- [MEMO-01 메모 인박스](#memo-01)
- [MEMO-02 메모 작성](#memo-02)
- [MEMO-03 메모 상세](#memo-03)
- [MEMO-04 메모 수정](#memo-04)
- [MEMO-05 메모 삭제](#memo-05)
- [TAG-01 내 태그 및 사용 횟수](#tag-01)
- [TAG-02 태그에 해당하는 권한 내 글](#tag-02)
- [MENTION-01 나를 언급한 글 알림](#mention-01)
- [MENTION-02 멘션 읽음 지정](#mention-02)
- [MENTION-03 주소록 기반 멘션 후보](#mention-03)
- [AI-01 메모에서 할 일 후보 생성](#ai-01)
- [AI-02 회고 초안 작업](#ai-02)
- [AI-03 AI·STT 작업 결과](#ai-03)
- [STT-01 음성 메모 텍스트 변환](#stt-01)

<a id="diary-01"></a>
## DIARY-01 · 일간 회고 캘린더·목록

- 요청 URL: `https://api.example.test/api/v1/diaries` (예약 예시 도메인)
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
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/diaries?from=2026-09-26&to=2026-09-27 HTTP/1.1
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
| data | DiaryPage | 필수 | 하위 구조 참조  |
| data.items | Diary[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].mood | string | 필수 | 기분 허용: GREAT, GOOD, SOSO, BAD, TERRIBLE |
| data.items[].summary | string | 선택 | 하루 요약 최대 1000자 |
| data.items[].body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.items[].gratitude | string | 선택 | 감사한 일 최대 5000자 |
| data.items[].tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.items[].mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.items[].date | string (date) | 필수 | 사용자 지역 일자  |
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
        "mood": "GOOD",
        "summary": "설계를 정리했다",
        "body": "오늘의 기록 #업무",
        "gratitude": "도움을 주신 분들",
        "tags": [
          "업무"
        ],
        "mentionUserIds": [
          "01J00000000000000000000001"
        ],
        "date": "2026-09-26",
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

<a id="diary-02"></a>
## DIARY-02 · 일간 회고 상세

- 요청 URL: `https://api.example.test/api/v1/diaries/{date}` (예약 예시 도메인)
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
| path | date | string (date) | 예 | YYYY-MM-DD, 유효한 지역 달력 날짜;  |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/diaries/2026-09-26 HTTP/1.1
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
| data | Diary | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.mood | string | 필수 | 기분 허용: GREAT, GOOD, SOSO, BAD, TERRIBLE |
| data.summary | string | 선택 | 하루 요약 최대 1000자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.gratitude | string | 선택 | 감사한 일 최대 5000자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.date | string (date) | 필수 | 사용자 지역 일자  |
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
    "mood": "GOOD",
    "summary": "설계를 정리했다",
    "body": "오늘의 기록 #업무",
    "gratitude": "도움을 주신 분들",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "date": "2026-09-26",
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

<a id="diary-03"></a>
## DIARY-03 · 일간 회고 저장

- 요청 URL: `https://api.example.test/api/v1/diaries/{date}` (예약 예시 도메인)
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
| path | date | string (date) | 예 | YYYY-MM-DD, 유효한 지역 달력 날짜;  |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| mood | string | 필수 | 기분 허용: GREAT, GOOD, SOSO, BAD, TERRIBLE |
| summary | string | 선택 | 하루 요약 최대 1000자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| gratitude | string | 선택 | 감사한 일 최대 5000자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "설계 검토",
  "mood": "GOOD",
  "summary": "설계를 정리했다",
  "body": "오늘의 기록 #업무",
  "gratitude": "도움을 주신 분들",
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
PUT /api/v1/diaries/2026-09-26 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-None-Match: *
Content-Type: application/json

{
  "title": "설계 검토",
  "mood": "GOOD",
  "summary": "설계를 정리했다",
  "body": "오늘의 기록 #업무",
  "gratitude": "도움을 주신 분들",
  "tags": [
    "업무"
  ],
  "mentionUserIds": [
    "01J00000000000000000000001"
  ]
}
```

### 성공 응답

HTTP **200** (최초 생성 201, 기존 갱신 200). 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Diary | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.mood | string | 필수 | 기분 허용: GREAT, GOOD, SOSO, BAD, TERRIBLE |
| data.summary | string | 선택 | 하루 요약 최대 1000자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.gratitude | string | 선택 | 감사한 일 최대 5000자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.date | string (date) | 필수 | 사용자 지역 일자  |
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
    "mood": "GOOD",
    "summary": "설계를 정리했다",
    "body": "오늘의 기록 #업무",
    "gratitude": "도움을 주신 분들",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "date": "2026-09-26",
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

<a id="diary-04"></a>
## DIARY-04 · 일간 회고 삭제

- 요청 URL: `https://api.example.test/api/v1/diaries/{date}` (예약 예시 도메인)
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
| path | date | string (date) | 예 | YYYY-MM-DD, 유효한 지역 달력 날짜;  |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
DELETE /api/v1/diaries/2026-09-26 HTTP/1.1
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

<a id="memo-01"></a>
## MEMO-01 · 메모 인박스

- 요청 URL: `https://api.example.test/api/v1/memos` (예약 예시 도메인)
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
| query | status | string | 아니오 | 메모 상태; 허용: INBOX, ARCHIVED |
| query | q | string | 아니오 | 앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자; 최소 1자; 최대 100자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/memos HTTP/1.1
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
| data | MemoPage | 필수 | 하위 구조 참조  |
| data.items | Memo[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.items[].status | string | 선택 | 인박스 상태 허용: INBOX, ARCHIVED |
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
        "title": "설계 검토",
        "body": "오늘의 기록 #업무",
        "status": "INBOX",
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

<a id="memo-02"></a>
## MEMO-02 · 메모 작성

- 요청 URL: `https://api.example.test/api/v1/memos` (예약 예시 도메인)
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
| title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| status | string | 선택 | 인박스 상태 허용: INBOX, ARCHIVED |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "status": "INBOX",
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
POST /api/v1/memos HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "status": "INBOX",
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
| data | Memo | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.status | string | 선택 | 인박스 상태 허용: INBOX, ARCHIVED |
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
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "status": "INBOX",
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

<a id="memo-03"></a>
## MEMO-03 · 메모 상세

- 요청 URL: `https://api.example.test/api/v1/memos/{id}` (예약 예시 도메인)
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
GET /api/v1/memos/01J00000000000000000000001 HTTP/1.1
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
| data | Memo | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.status | string | 선택 | 인박스 상태 허용: INBOX, ARCHIVED |
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
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "status": "INBOX",
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

<a id="memo-04"></a>
## MEMO-04 · 메모 수정

- 요청 URL: `https://api.example.test/api/v1/memos/{id}` (예약 예시 도메인)
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
| status | string | 선택 | 인박스 상태 허용: INBOX, ARCHIVED |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "status": "INBOX",
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
PATCH /api/v1/memos/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "status": "INBOX",
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
| data | Memo | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.status | string | 선택 | 인박스 상태 허용: INBOX, ARCHIVED |
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
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "status": "INBOX",
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

<a id="memo-05"></a>
## MEMO-05 · 메모 삭제

- 요청 URL: `https://api.example.test/api/v1/memos/{id}` (예약 예시 도메인)
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
DELETE /api/v1/memos/01J00000000000000000000001 HTTP/1.1
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

<a id="tag-01"></a>
## TAG-01 · 내 태그 및 사용 횟수

- 요청 URL: `https://api.example.test/api/v1/tags` (예약 예시 도메인)
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
| query | q | string | 아니오 | 앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자; 최소 1자; 최대 100자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/tags HTTP/1.1
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
| data | TagPage | 필수 | 하위 구조 참조  |
| data.items | Tag[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].name | string | 필수 | 태그명 최소 1자; 최대 40자 |
| data.items[].count | integer | 필수 | 권한 범위 글 수 최소 0; 최대 1000000 |
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
        "name": "업무",
        "count": 3
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

<a id="tag-02"></a>
## TAG-02 · 태그에 해당하는 권한 내 글

- 요청 URL: `https://api.example.test/api/v1/tags/{tag}/posts` (예약 예시 도메인)
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
| path | tag | string | 예 | URL 인코딩한 # 없는 태그; 최소 1자; 최대 40자 |
| query | resourceTypes | string | 아니오 | 통합함 원본 종류. PLANNER,DDAY,EVENT,TASK,ROUTINE,CHALLENGE,POST,DIARY,COMMUNITY,MEMO,CHAT,WBS,WORK_RECORD. 생략하면 접근 가능한 전체 종류; 플래너 화면 필터는 PLANNER,EVENT,TASK,ROUTINE으로 확장한다.; 정규식 ^(PLANNER&#124;DDAY&#124;EVENT&#124;TASK&#124;ROUTINE&#124;CHALLENGE&#124;POST&#124;DIARY&#124;COMMUNITY&#124;MEMO&#124;CHAT&#124;WBS&#124;WORK_RECORD)(,(PLANNER&#124;DDAY&#124;EVENT&#124;TASK&#124;ROUTINE&#124;CHALLENGE&#124;POST&#124;DIARY&#124;COMMUNITY&#124;MEMO&#124;CHAT&#124;WBS&#124;WORK_RECORD))*$ |
| query | q | string | 아니오 | 앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자; 최소 1자; 최대 100자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/tags/%EC%97%85%EB%AC%B4/posts HTTP/1.1
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
| data | SearchHitPage | 필수 | 하위 구조 참조  |
| data.items | SearchHit[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].type | string | 필수 | 종류 허용: PLANNER, DDAY, EVENT, TASK, ROUTINE, CHALLENGE, POST, DIARY, COMMUNITY, MEMO, CHAT, WBS, WORK_RECORD |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].excerpt | string | 필수 | 권한 내 발췌 최대 200자 |
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
        "type": "PLANNER",
        "title": "설계 검토",
        "excerpt": "오늘의 기록"
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

<a id="mention-01"></a>
## MENTION-01 · 나를 언급한 글 알림

- 요청 URL: `https://api.example.test/api/v1/mentions` (예약 예시 도메인)
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
| query | resourceTypes | string | 아니오 | 통합함 원본 종류. PLANNER,DDAY,EVENT,TASK,ROUTINE,CHALLENGE,POST,DIARY,COMMUNITY,MEMO,CHAT,WBS,WORK_RECORD. 생략하면 접근 가능한 전체 종류; 플래너 화면 필터는 PLANNER,EVENT,TASK,ROUTINE으로 확장한다.; 정규식 ^(PLANNER&#124;DDAY&#124;EVENT&#124;TASK&#124;ROUTINE&#124;CHALLENGE&#124;POST&#124;DIARY&#124;COMMUNITY&#124;MEMO&#124;CHAT&#124;WBS&#124;WORK_RECORD)(,(PLANNER&#124;DDAY&#124;EVENT&#124;TASK&#124;ROUTINE&#124;CHALLENGE&#124;POST&#124;DIARY&#124;COMMUNITY&#124;MEMO&#124;CHAT&#124;WBS&#124;WORK_RECORD))*$ |
| query | q | string | 아니오 | 앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자; 최소 1자; 최대 100자 |
| query | unread | boolean | 아니오 | 읽지 않은 항목만 true;  |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/mentions HTTP/1.1
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
| data | MentionPage | 필수 | 하위 구조 참조  |
| data.items | Mention[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].fromUserId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].resourceType | string | 필수 | 원본 종류 허용: PLANNER, DDAY, EVENT, TASK, ROUTINE, CHALLENGE, POST, DIARY, COMMUNITY, MEMO, CHAT, WBS, WORK_RECORD |
| data.items[].resourceId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].excerpt | string | 필수 | 권한 확인 후 일부 텍스트 최대 120자 |
| data.items[].read | boolean | 필수 | 읽음  |
| data.items[].createdAt | string (date-time) | 필수 | 생성 UTC  |
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
        "fromUserId": "01J00000000000000000000001",
        "resourceType": "PLANNER",
        "resourceId": "01J00000000000000000000001",
        "excerpt": "확인 부탁드려요",
        "read": false,
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

<a id="mention-02"></a>
## MENTION-02 · 멘션 읽음 지정

- 요청 URL: `https://api.example.test/api/v1/mentions/{id}/read` (예약 예시 도메인)
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
PUT /api/v1/mentions/01J00000000000000000000001/read HTTP/1.1
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
| data | Mention | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.fromUserId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.resourceType | string | 필수 | 원본 종류 허용: PLANNER, DDAY, EVENT, TASK, ROUTINE, CHALLENGE, POST, DIARY, COMMUNITY, MEMO, CHAT, WBS, WORK_RECORD |
| data.resourceId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.excerpt | string | 필수 | 권한 확인 후 일부 텍스트 최대 120자 |
| data.read | boolean | 필수 | 읽음  |
| data.createdAt | string (date-time) | 필수 | 생성 UTC  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "fromUserId": "01J00000000000000000000001",
    "resourceType": "PLANNER",
    "resourceId": "01J00000000000000000000001",
    "excerpt": "확인 부탁드려요",
    "read": true,
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

<a id="mention-03"></a>
## MENTION-03 · 주소록 기반 멘션 후보

- 요청 URL: `https://api.example.test/api/v1/mention-candidates` (예약 예시 도메인)
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
| query | q | string | 예 | 앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자; 최소 1자; 최대 100자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/mention-candidates?q=%EA%B2%80%ED%86%A0 HTTP/1.1
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
| data | ContactCandidatePage | 필수 | 하위 구조 참조  |
| data.items | ContactCandidate[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].nickname | string | 필수 | 사용자 표시명  |
| data.items[].avatarUrl | string (uri) / null | 필수 | 프록시/허용된 아바타 URL; null 허용  |
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
        "nickname": "이서연",
        "avatarUrl": null
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

<a id="ai-01"></a>
## AI-01 · 메모에서 할 일 후보 생성

- 요청 URL: `https://api.example.test/api/v1/memos/{id}/task-suggestions` (예약 예시 도메인)
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
| sourceIds | string[] | 선택 | 본인이 허용한 원본 기록 ID 최대 100개 |
| consent | boolean | 필수 | AI 외부 전송 별도 동의  |

```json
{
  "sourceIds": [
    "01J00000000000000000000001"
  ],
  "consent": true
}
```

### 요청 예시

```http
POST /api/v1/memos/01J00000000000000000000001/task-suggestions HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "sourceIds": [
    "01J00000000000000000000001"
  ],
  "consent": true
}
```

### 성공 응답

HTTP **202**. 접수 상태이며 완료 여부는 작업 조회 API로 확인합니다. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Job | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.status | string | 필수 | 작업 상태 허용: PENDING, RUNNING, SUCCEEDED, FAILED |
| data.progress | integer | 필수 | 진행률 최소 0; 최대 100 |
| data.resultFileId | string / null | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.errorCode | string / null | 필수 | 실패 원인 코드; null 허용  |
| data.expiresAt | string (date-time) / null | 필수 | 결과 만료; null 허용  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "status": "PENDING",
    "progress": 0,
    "resultFileId": null,
    "errorCode": null,
    "expiresAt": null
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
| 503 | UPSTREAM_UNAVAILABLE | 메일·푸시·AI·외부 캘린더 일시 장애 | 작업 상태 조회; 서버는 outbox 재시도, 중복 제출 금지 |

<a id="ai-02"></a>
## AI-02 · 회고 초안 작업

- 요청 URL: `https://api.example.test/api/v1/diaries/{date}/suggestions` (예약 예시 도메인)
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
| path | date | string (date) | 예 | YYYY-MM-DD, 유효한 지역 달력 날짜;  |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| sourceIds | string[] | 선택 | 본인이 허용한 원본 기록 ID 최대 100개 |
| consent | boolean | 필수 | AI 외부 전송 별도 동의  |

```json
{
  "sourceIds": [
    "01J00000000000000000000001"
  ],
  "consent": true
}
```

### 요청 예시

```http
POST /api/v1/diaries/2026-09-26/suggestions HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "sourceIds": [
    "01J00000000000000000000001"
  ],
  "consent": true
}
```

### 성공 응답

HTTP **202**. 접수 상태이며 완료 여부는 작업 조회 API로 확인합니다. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Job | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.status | string | 필수 | 작업 상태 허용: PENDING, RUNNING, SUCCEEDED, FAILED |
| data.progress | integer | 필수 | 진행률 최소 0; 최대 100 |
| data.resultFileId | string / null | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.errorCode | string / null | 필수 | 실패 원인 코드; null 허용  |
| data.expiresAt | string (date-time) / null | 필수 | 결과 만료; null 허용  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "status": "PENDING",
    "progress": 0,
    "resultFileId": null,
    "errorCode": null,
    "expiresAt": null
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
| 503 | UPSTREAM_UNAVAILABLE | 메일·푸시·AI·외부 캘린더 일시 장애 | 작업 상태 조회; 서버는 outbox 재시도, 중복 제출 금지 |

<a id="ai-03"></a>
## AI-03 · AI·STT 작업 결과

- 요청 URL: `https://api.example.test/api/v1/ai-jobs/{id}` (예약 예시 도메인)
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
GET /api/v1/ai-jobs/01J00000000000000000000001 HTTP/1.1
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
| data | Suggestion | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.status | string | 필수 | 처리 상태 허용: PENDING, RUNNING, SUCCEEDED, FAILED |
| data.drafts | string[] | 필수 | 자동 저장되지 않는 후보 최대 20개 |
| data.errorCode | string / null | 필수 | 실패 코드; null 허용  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "status": "PENDING",
    "drafts": [
      "오늘 일정 검토"
    ],
    "errorCode": null
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

<a id="stt-01"></a>
## STT-01 · 음성 메모 텍스트 변환

- 요청 URL: `https://api.example.test/api/v1/memos/{id}/transcriptions` (예약 예시 도메인)
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
| voiceFileId | string | 필수 | VOICE 목적 및 CLEAN 파일 최소 1자; 최대 128자 |
| consent | boolean | 필수 | STT 처리 동의  |

```json
{
  "voiceFileId": "01J00000000000000000000001",
  "consent": true
}
```

### 요청 예시

```http
POST /api/v1/memos/01J00000000000000000000001/transcriptions HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "voiceFileId": "01J00000000000000000000001",
  "consent": true
}
```

### 성공 응답

HTTP **202**. 접수 상태이며 완료 여부는 작업 조회 API로 확인합니다. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Job | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.status | string | 필수 | 작업 상태 허용: PENDING, RUNNING, SUCCEEDED, FAILED |
| data.progress | integer | 필수 | 진행률 최소 0; 최대 100 |
| data.resultFileId | string / null | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.errorCode | string / null | 필수 | 실패 원인 코드; null 허용  |
| data.expiresAt | string (date-time) / null | 필수 | 결과 만료; null 허용  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "status": "PENDING",
    "progress": 0,
    "resultFileId": null,
    "errorCode": null,
    "expiresAt": null
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
| 503 | UPSTREAM_UNAVAILABLE | 메일·푸시·AI·외부 캘린더 일시 장애 | 작업 상태 조회; 서버는 outbox 재시도, 중복 제출 금지 |
