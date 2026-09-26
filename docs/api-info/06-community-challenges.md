# 커뮤니티·챌린지 API 상세 설계

2026-09-26 · 목표 /api/v1 · **서버 미구현** · 24개

[전체 목록](catalog.md) · [공통 규칙](00-conventions.md) · [오류 사전](errors.md) · [OpenAPI JSON](openapi.target.json)

## 업무 규칙

생성자는 커뮤니티 OWNER입니다. 가입 대기자는 챌린지를 만들 수 없으며 가입 여부는 저장 트랜잭션에서 재확인합니다. 정원 초과 가입은 409. private 커뮤니티는 초대/가입 권한 없는 사용자에게 숨깁니다. 챌린지 시작일은 사용자 기준 오늘부터30일 이내, 기간3~100일. 일일 인증은 챌린지 시간대의 오늘만, (challenge,user,date) UNIQUE로 멱등 처리합니다. 진행 중인 챌린지 기간 변경은 409. 방장 탈퇴는 소유권 이전 전 OWNER_REQUIRED 409. 랭킹은 별도 공개 동의한 회원만 집계합니다.

## 빠른 이동

- [COMMUNITY-01 커뮤니티 게시글 목록](#community-01)
- [COMMUNITY-02 공유 미리보기 확정 후 사본 게시](#community-02)
- [COMMUNITY-03 본인·운영자 게시글 삭제](#community-03)
- [COMMUNITY-04 커뮤니티 검색·내 가입 목록](#community-04)
- [COMMUNITY-05 커뮤니티 생성](#community-05)
- [COMMUNITY-06 커뮤니티 상세](#community-06)
- [COMMUNITY-07 방장 커뮤니티 설정 수정](#community-07)
- [COMMUNITY-08 방장 커뮤니티 삭제](#community-08)
- [COMMUNITY-09 가입 또는 승인 신청](#community-09)
- [COMMUNITY-10 가입 신청 승인·거절](#community-10)
- [COMMUNITY-11 커뮤니티 탈퇴](#community-11)
- [COMMUNITY-12 승인 멤버·신청자 조회](#community-12)
- [COMMUNITY-13 내 게시글 수정](#community-13)
- [COMMUNITY-14 게시글 상세](#community-14)
- [CHALLENGE-01 참여 가능한 챌린지](#challenge-01)
- [CHALLENGE-02 가입 커뮤니티에 챌린지 생성](#challenge-02)
- [CHALLENGE-03 챌린지 상세](#challenge-03)
- [CHALLENGE-04 생성자 챌린지 수정](#challenge-04)
- [CHALLENGE-05 생성자 챌린지 취소](#challenge-05)
- [CHALLENGE-06 챌린지 참여](#challenge-06)
- [CHALLENGE-07 챌린지 참여 취소](#challenge-07)
- [CHALLENGE-08 일일 인증](#challenge-08)
- [RANK-01 동의 기반 달성률 순위](#rank-01)
- [STICKER-01 달성 스티커](#sticker-01)

<a id="community-01"></a>
## COMMUNITY-01 · 커뮤니티 게시글 목록

- 요청 URL: `https://api.example.test/api/v1/community/posts` (예약 예시 도메인)
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
| query | communityId | string | 아니오 | 승인된 참여 커뮤니티 ID; 최소 1자; 최대 128자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/community/posts HTTP/1.1
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
| data | PostPage | 필수 | 하위 구조 참조  |
| data.items | Post[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].communityId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].body | string | 필수 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.items[].recordType | string / null | 선택 | 공유할 개인 기록 종류; null 허용  |
| data.items[].recordId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.items[].shareConfirmed | boolean | 필수 | 공유 미리보기 후 명시적 확인  |
| data.items[].tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.items[].mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.items[].authorId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
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
        "communityId": "01J00000000000000000000001",
        "title": "설계 검토",
        "body": "오늘의 기록 #업무",
        "recordType": null,
        "recordId": null,
        "shareConfirmed": true,
        "tags": [
          "업무"
        ],
        "mentionUserIds": [
          "01J00000000000000000000001"
        ],
        "authorId": "01J00000000000000000000001",
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-02"></a>
## COMMUNITY-02 · 공유 미리보기 확정 후 사본 게시

- 요청 URL: `https://api.example.test/api/v1/community/posts` (예약 예시 도메인)
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
| communityId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| body | string | 필수 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| recordType | string / null | 선택 | 공유할 개인 기록 종류; null 허용  |
| recordId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| shareConfirmed | boolean | 필수 | 공유 미리보기 후 명시적 확인  |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "communityId": "01J00000000000000000000001",
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "recordType": null,
  "recordId": null,
  "shareConfirmed": true,
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
POST /api/v1/community/posts HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "communityId": "01J00000000000000000000001",
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "recordType": null,
  "recordId": null,
  "shareConfirmed": true,
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
| data | Post | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.communityId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 필수 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.recordType | string / null | 선택 | 공유할 개인 기록 종류; null 허용  |
| data.recordId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.shareConfirmed | boolean | 필수 | 공유 미리보기 후 명시적 확인  |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.authorId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
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
    "communityId": "01J00000000000000000000001",
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "recordType": null,
    "recordId": null,
    "shareConfirmed": true,
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "authorId": "01J00000000000000000000001",
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-03"></a>
## COMMUNITY-03 · 본인·운영자 게시글 삭제

- 요청 URL: `https://api.example.test/api/v1/community/posts/{id}` (예약 예시 도메인)
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
DELETE /api/v1/community/posts/01J00000000000000000000001 HTTP/1.1
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-04"></a>
## COMMUNITY-04 · 커뮤니티 검색·내 가입 목록

- 요청 URL: `https://api.example.test/api/v1/communities` (예약 예시 도메인)
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
| query | joined | boolean | 아니오 | 내 참여 항목만;  |
| query | category | string | 아니오 | 커뮤니티 분류; 허용: EXERCISE, STUDY, DAILY, LIFE |
| query | q | string | 아니오 | 앞뒤 공백 제거; LIKE 와일드카드 이스케이프; 최대100자; 최소 1자; 최대 100자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/communities HTTP/1.1
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
| data | CommunityPage | 필수 | 하위 구조 참조  |
| data.items | Community[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].name | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].category | string | 필수 | 카테고리 허용: EXERCISE, STUDY, DAILY, LIFE |
| data.items[].description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.items[].capacity | integer | 필수 | 정원 최소 2; 최대 500 |
| data.items[].deadline | string (date) / null | 선택 | 모집 마감일; null 허용  |
| data.items[].visibility | string | 필수 | 커뮤니티 공개 설정 허용: PUBLIC, PRIVATE |
| data.items[].joinPolicy | string | 필수 | 가입 방식 허용: OPEN, APPROVAL |
| data.items[].tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.items[].mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.items[].membership | string | 필수 | 현재 내 가입 상태 허용: NONE, PENDING, MEMBER, OWNER |
| data.items[].memberCount | integer | 필수 | 승인된 멤버 수 최소 0; 최대 1000000 |
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
        "category": "EXERCISE",
        "description": "오늘의 기록 #업무",
        "capacity": 50,
        "deadline": null,
        "visibility": "PUBLIC",
        "joinPolicy": "OPEN",
        "tags": [
          "업무"
        ],
        "mentionUserIds": [
          "01J00000000000000000000001"
        ],
        "membership": "OWNER",
        "memberCount": 1,
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-05"></a>
## COMMUNITY-05 · 커뮤니티 생성

- 요청 URL: `https://api.example.test/api/v1/communities` (예약 예시 도메인)
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
| category | string | 필수 | 카테고리 허용: EXERCISE, STUDY, DAILY, LIFE |
| description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| capacity | integer | 필수 | 정원 최소 2; 최대 500 |
| deadline | string (date) / null | 선택 | 모집 마감일; null 허용  |
| visibility | string | 필수 | 커뮤니티 공개 설정 허용: PUBLIC, PRIVATE |
| joinPolicy | string | 필수 | 가입 방식 허용: OPEN, APPROVAL |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "name": "설계 검토",
  "category": "EXERCISE",
  "description": "오늘의 기록 #업무",
  "capacity": 50,
  "deadline": null,
  "visibility": "PUBLIC",
  "joinPolicy": "OPEN",
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
POST /api/v1/communities HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "name": "설계 검토",
  "category": "EXERCISE",
  "description": "오늘의 기록 #업무",
  "capacity": 50,
  "deadline": null,
  "visibility": "PUBLIC",
  "joinPolicy": "OPEN",
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
| data | Community | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.name | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.category | string | 필수 | 카테고리 허용: EXERCISE, STUDY, DAILY, LIFE |
| data.description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.capacity | integer | 필수 | 정원 최소 2; 최대 500 |
| data.deadline | string (date) / null | 선택 | 모집 마감일; null 허용  |
| data.visibility | string | 필수 | 커뮤니티 공개 설정 허용: PUBLIC, PRIVATE |
| data.joinPolicy | string | 필수 | 가입 방식 허용: OPEN, APPROVAL |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.membership | string | 필수 | 현재 내 가입 상태 허용: NONE, PENDING, MEMBER, OWNER |
| data.memberCount | integer | 필수 | 승인된 멤버 수 최소 0; 최대 1000000 |
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
    "category": "EXERCISE",
    "description": "오늘의 기록 #업무",
    "capacity": 50,
    "deadline": null,
    "visibility": "PUBLIC",
    "joinPolicy": "OPEN",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "membership": "OWNER",
    "memberCount": 1,
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-06"></a>
## COMMUNITY-06 · 커뮤니티 상세

- 요청 URL: `https://api.example.test/api/v1/communities/{id}` (예약 예시 도메인)
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
GET /api/v1/communities/01J00000000000000000000001 HTTP/1.1
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
| data | Community | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.name | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.category | string | 필수 | 카테고리 허용: EXERCISE, STUDY, DAILY, LIFE |
| data.description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.capacity | integer | 필수 | 정원 최소 2; 최대 500 |
| data.deadline | string (date) / null | 선택 | 모집 마감일; null 허용  |
| data.visibility | string | 필수 | 커뮤니티 공개 설정 허용: PUBLIC, PRIVATE |
| data.joinPolicy | string | 필수 | 가입 방식 허용: OPEN, APPROVAL |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.membership | string | 필수 | 현재 내 가입 상태 허용: NONE, PENDING, MEMBER, OWNER |
| data.memberCount | integer | 필수 | 승인된 멤버 수 최소 0; 최대 1000000 |
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
    "category": "EXERCISE",
    "description": "오늘의 기록 #업무",
    "capacity": 50,
    "deadline": null,
    "visibility": "PUBLIC",
    "joinPolicy": "OPEN",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "membership": "OWNER",
    "memberCount": 1,
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-07"></a>
## COMMUNITY-07 · 방장 커뮤니티 설정 수정

- 요청 URL: `https://api.example.test/api/v1/communities/{id}` (예약 예시 도메인)
- HTTP 메서드: **PATCH**
- 인증·인가: JWT + 리소스 OWNER
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
| category | string | 선택 | 카테고리 허용: EXERCISE, STUDY, DAILY, LIFE |
| description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| capacity | integer | 선택 | 정원 최소 2; 최대 500 |
| deadline | string (date) / null | 선택 | 모집 마감일; null 허용  |
| visibility | string | 선택 | 커뮤니티 공개 설정 허용: PUBLIC, PRIVATE |
| joinPolicy | string | 선택 | 가입 방식 허용: OPEN, APPROVAL |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "name": "설계 검토",
  "category": "EXERCISE",
  "description": "오늘의 기록 #업무",
  "capacity": 50,
  "deadline": null,
  "visibility": "PUBLIC",
  "joinPolicy": "OPEN",
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
PATCH /api/v1/communities/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "name": "설계 검토",
  "category": "EXERCISE",
  "description": "오늘의 기록 #업무",
  "capacity": 50,
  "deadline": null,
  "visibility": "PUBLIC",
  "joinPolicy": "OPEN",
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
| data | Community | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.name | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.category | string | 필수 | 카테고리 허용: EXERCISE, STUDY, DAILY, LIFE |
| data.description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.capacity | integer | 필수 | 정원 최소 2; 최대 500 |
| data.deadline | string (date) / null | 선택 | 모집 마감일; null 허용  |
| data.visibility | string | 필수 | 커뮤니티 공개 설정 허용: PUBLIC, PRIVATE |
| data.joinPolicy | string | 필수 | 가입 방식 허용: OPEN, APPROVAL |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.membership | string | 필수 | 현재 내 가입 상태 허용: NONE, PENDING, MEMBER, OWNER |
| data.memberCount | integer | 필수 | 승인된 멤버 수 최소 0; 최대 1000000 |
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
    "category": "EXERCISE",
    "description": "오늘의 기록 #업무",
    "capacity": 50,
    "deadline": null,
    "visibility": "PUBLIC",
    "joinPolicy": "OPEN",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "membership": "OWNER",
    "memberCount": 1,
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-08"></a>
## COMMUNITY-08 · 방장 커뮤니티 삭제

- 요청 URL: `https://api.example.test/api/v1/communities/{id}` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
- 인증·인가: JWT + 리소스 OWNER
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
DELETE /api/v1/communities/01J00000000000000000000001 HTTP/1.1
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-09"></a>
## COMMUNITY-09 · 가입 또는 승인 신청

- 요청 URL: `https://api.example.test/api/v1/communities/{id}/join-requests` (예약 예시 도메인)
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
| message | string | 선택 | 가입 메시지 최대 1000자 |

```json
{
  "message": "함께 참여하고 싶어요"
}
```

### 요청 예시

```http
POST /api/v1/communities/01J00000000000000000000001/join-requests HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "message": "함께 참여하고 싶어요"
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
| data | Membership | 필수 | 하위 구조 참조  |
| data.communityId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.status | string | 필수 | 가입 상태 허용: PENDING, MEMBER, OWNER, REJECTED |
| data.version | integer | 필수 | 버전 최소 1; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "communityId": "01J00000000000000000000001",
    "userId": "01J00000000000000000000001",
    "status": "PENDING",
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
| 409 | IDEMPOTENCY_CONFLICT | 같은 멱등키에 다른 요청 본문 | 동일 요청은 원래 키, 새 의도는 새 UUID 사용 |
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-10"></a>
## COMMUNITY-10 · 가입 신청 승인·거절

- 요청 URL: `https://api.example.test/api/v1/communities/{id}/join-requests/{userId}` (예약 예시 도메인)
- HTTP 메서드: **PUT**
- 인증·인가: JWT + 리소스 OWNER
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
| path | userId | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| decision | string | 필수 | 승인 결정 허용: ACCEPT, REJECT |
| reason | string | 선택 | 처리 사유 최대 500자 |

```json
{
  "decision": "ACCEPT",
  "reason": "가입 승인"
}
```

### 요청 예시

```http
PUT /api/v1/communities/01J00000000000000000000001/join-requests/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "decision": "ACCEPT",
  "reason": "가입 승인"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Membership | 필수 | 하위 구조 참조  |
| data.communityId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.status | string | 필수 | 가입 상태 허용: PENDING, MEMBER, OWNER, REJECTED |
| data.version | integer | 필수 | 버전 최소 1; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "communityId": "01J00000000000000000000001",
    "userId": "01J00000000000000000000001",
    "status": "MEMBER",
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-11"></a>
## COMMUNITY-11 · 커뮤니티 탈퇴

- 요청 URL: `https://api.example.test/api/v1/communities/{id}/members/me` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
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
DELETE /api/v1/communities/01J00000000000000000000001/members/me HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-12"></a>
## COMMUNITY-12 · 승인 멤버·신청자 조회

- 요청 URL: `https://api.example.test/api/v1/communities/{id}/members` (예약 예시 도메인)
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
| query | status | string | 아니오 | 멤버 상태; 허용: PENDING, MEMBER, OWNER |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/communities/01J00000000000000000000001/members HTTP/1.1
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
| data | MembershipPage | 필수 | 하위 구조 참조  |
| data.items | Membership[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].communityId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].status | string | 필수 | 가입 상태 허용: PENDING, MEMBER, OWNER, REJECTED |
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
        "communityId": "01J00000000000000000000001",
        "userId": "01J00000000000000000000001",
        "status": "PENDING",
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-13"></a>
## COMMUNITY-13 · 내 게시글 수정

- 요청 URL: `https://api.example.test/api/v1/community/posts/{id}` (예약 예시 도메인)
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
| communityId | string | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| recordType | string / null | 선택 | 공유할 개인 기록 종류; null 허용  |
| recordId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| shareConfirmed | boolean | 선택 | 공유 미리보기 후 명시적 확인  |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "communityId": "01J00000000000000000000001",
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "recordType": null,
  "recordId": null,
  "shareConfirmed": true,
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
PATCH /api/v1/community/posts/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "communityId": "01J00000000000000000000001",
  "title": "설계 검토",
  "body": "오늘의 기록 #업무",
  "recordType": null,
  "recordId": null,
  "shareConfirmed": true,
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
| data | Post | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.communityId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 필수 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.recordType | string / null | 선택 | 공유할 개인 기록 종류; null 허용  |
| data.recordId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.shareConfirmed | boolean | 필수 | 공유 미리보기 후 명시적 확인  |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.authorId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
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
    "communityId": "01J00000000000000000000001",
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "recordType": null,
    "recordId": null,
    "shareConfirmed": true,
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "authorId": "01J00000000000000000000001",
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="community-14"></a>
## COMMUNITY-14 · 게시글 상세

- 요청 URL: `https://api.example.test/api/v1/community/posts/{id}` (예약 예시 도메인)
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
GET /api/v1/community/posts/01J00000000000000000000001 HTTP/1.1
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
| data | Post | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.communityId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.body | string | 필수 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.recordType | string / null | 선택 | 공유할 개인 기록 종류; null 허용  |
| data.recordId | string / null | 선택 | 불투명 리소스 ID; 숫자로 변환하지 않음; null 허용  |
| data.shareConfirmed | boolean | 필수 | 공유 미리보기 후 명시적 확인  |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.authorId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
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
    "communityId": "01J00000000000000000000001",
    "title": "설계 검토",
    "body": "오늘의 기록 #업무",
    "recordType": null,
    "recordId": null,
    "shareConfirmed": true,
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "authorId": "01J00000000000000000000001",
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="challenge-01"></a>
## CHALLENGE-01 · 참여 가능한 챌린지

- 요청 URL: `https://api.example.test/api/v1/challenges` (예약 예시 도메인)
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
| query | communityId | string | 아니오 | 승인된 참여 커뮤니티 ID; 최소 1자; 최대 128자 |
| query | joined | boolean | 아니오 | 내 참여 항목만;  |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/challenges HTTP/1.1
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
| data | ChallengePage | 필수 | 하위 구조 참조  |
| data.items | Challenge[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].communityId | string | 필수 | 현재 승인된 회원인 커뮤니티 최소 1자; 최대 128자 |
| data.items[].title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.items[].description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.items[].startDate | string (date) | 필수 | 커뮤니티 기준 시작일  |
| data.items[].days | integer | 필수 | 진행 기간 최소 3; 최대 100 |
| data.items[].timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.items[].tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.items[].mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.items[].joined | boolean | 필수 | 참여중  |
| data.items[].doneDays | integer | 필수 | 인증 날짜 수 최소 0; 최대 1000000 |
| data.items[].memberCount | integer | 필수 | 참여 인원 최소 0; 최대 1000000 |
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
        "communityId": "01J00000000000000000000001",
        "title": "설계 검토",
        "description": "오늘의 기록 #업무",
        "startDate": "2026-09-26",
        "days": 21,
        "timezone": "Asia/Seoul",
        "tags": [
          "업무"
        ],
        "mentionUserIds": [
          "01J00000000000000000000001"
        ],
        "joined": true,
        "doneDays": 0,
        "memberCount": 1,
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="challenge-02"></a>
## CHALLENGE-02 · 가입 커뮤니티에 챌린지 생성

- 요청 URL: `https://api.example.test/api/v1/challenges` (예약 예시 도메인)
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
| communityId | string | 필수 | 현재 승인된 회원인 커뮤니티 최소 1자; 최대 128자 |
| title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| startDate | string (date) | 필수 | 커뮤니티 기준 시작일  |
| days | integer | 필수 | 진행 기간 최소 3; 최대 100 |
| timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "communityId": "01J00000000000000000000001",
  "title": "설계 검토",
  "description": "오늘의 기록 #업무",
  "startDate": "2026-09-26",
  "days": 21,
  "timezone": "Asia/Seoul",
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
POST /api/v1/challenges HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "communityId": "01J00000000000000000000001",
  "title": "설계 검토",
  "description": "오늘의 기록 #업무",
  "startDate": "2026-09-26",
  "days": 21,
  "timezone": "Asia/Seoul",
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
| data | Challenge | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.communityId | string | 필수 | 현재 승인된 회원인 커뮤니티 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.startDate | string (date) | 필수 | 커뮤니티 기준 시작일  |
| data.days | integer | 필수 | 진행 기간 최소 3; 최대 100 |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.joined | boolean | 필수 | 참여중  |
| data.doneDays | integer | 필수 | 인증 날짜 수 최소 0; 최대 1000000 |
| data.memberCount | integer | 필수 | 참여 인원 최소 0; 최대 1000000 |
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
    "communityId": "01J00000000000000000000001",
    "title": "설계 검토",
    "description": "오늘의 기록 #업무",
    "startDate": "2026-09-26",
    "days": 21,
    "timezone": "Asia/Seoul",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "joined": true,
    "doneDays": 0,
    "memberCount": 1,
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="challenge-03"></a>
## CHALLENGE-03 · 챌린지 상세

- 요청 URL: `https://api.example.test/api/v1/challenges/{id}` (예약 예시 도메인)
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
GET /api/v1/challenges/01J00000000000000000000001 HTTP/1.1
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
| data | Challenge | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.communityId | string | 필수 | 현재 승인된 회원인 커뮤니티 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.startDate | string (date) | 필수 | 커뮤니티 기준 시작일  |
| data.days | integer | 필수 | 진행 기간 최소 3; 최대 100 |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.joined | boolean | 필수 | 참여중  |
| data.doneDays | integer | 필수 | 인증 날짜 수 최소 0; 최대 1000000 |
| data.memberCount | integer | 필수 | 참여 인원 최소 0; 최대 1000000 |
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
    "communityId": "01J00000000000000000000001",
    "title": "설계 검토",
    "description": "오늘의 기록 #업무",
    "startDate": "2026-09-26",
    "days": 21,
    "timezone": "Asia/Seoul",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "joined": true,
    "doneDays": 0,
    "memberCount": 1,
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="challenge-04"></a>
## CHALLENGE-04 · 생성자 챌린지 수정

- 요청 URL: `https://api.example.test/api/v1/challenges/{id}` (예약 예시 도메인)
- HTTP 메서드: **PATCH**
- 인증·인가: JWT + 리소스 OWNER
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
| communityId | string | 선택 | 현재 승인된 회원인 커뮤니티 최소 1자; 최대 128자 |
| title | string | 선택 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| startDate | string (date) | 선택 | 커뮤니티 기준 시작일  |
| days | integer | 선택 | 진행 기간 최소 3; 최대 100 |
| timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "communityId": "01J00000000000000000000001",
  "title": "설계 검토",
  "description": "오늘의 기록 #업무",
  "startDate": "2026-09-26",
  "days": 21,
  "timezone": "Asia/Seoul",
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
PATCH /api/v1/challenges/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "communityId": "01J00000000000000000000001",
  "title": "설계 검토",
  "description": "오늘의 기록 #업무",
  "startDate": "2026-09-26",
  "days": 21,
  "timezone": "Asia/Seoul",
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
| data | Challenge | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.communityId | string | 필수 | 현재 승인된 회원인 커뮤니티 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.startDate | string (date) | 필수 | 커뮤니티 기준 시작일  |
| data.days | integer | 필수 | 진행 기간 최소 3; 최대 100 |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.joined | boolean | 필수 | 참여중  |
| data.doneDays | integer | 필수 | 인증 날짜 수 최소 0; 최대 1000000 |
| data.memberCount | integer | 필수 | 참여 인원 최소 0; 최대 1000000 |
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
    "communityId": "01J00000000000000000000001",
    "title": "설계 검토",
    "description": "오늘의 기록 #업무",
    "startDate": "2026-09-26",
    "days": 21,
    "timezone": "Asia/Seoul",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "joined": true,
    "doneDays": 0,
    "memberCount": 1,
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="challenge-05"></a>
## CHALLENGE-05 · 생성자 챌린지 취소

- 요청 URL: `https://api.example.test/api/v1/challenges/{id}` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
- 인증·인가: JWT + 리소스 OWNER
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
DELETE /api/v1/challenges/01J00000000000000000000001 HTTP/1.1
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="challenge-06"></a>
## CHALLENGE-06 · 챌린지 참여

- 요청 URL: `https://api.example.test/api/v1/challenges/{id}/participants/me` (예약 예시 도메인)
- HTTP 메서드: **PUT**
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
PUT /api/v1/challenges/01J00000000000000000000001/participants/me HTTP/1.1
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
| data | Challenge | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.communityId | string | 필수 | 현재 승인된 회원인 커뮤니티 최소 1자; 최대 128자 |
| data.title | string | 필수 | 공백만 입력 불가; 앞뒤 공백 제거 최소 1자; 최대 200자 |
| data.description | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| data.startDate | string (date) | 필수 | 커뮤니티 기준 시작일  |
| data.days | integer | 필수 | 진행 기간 최소 3; 최대 100 |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.joined | boolean | 필수 | 참여중  |
| data.doneDays | integer | 필수 | 인증 날짜 수 최소 0; 최대 1000000 |
| data.memberCount | integer | 필수 | 참여 인원 최소 0; 최대 1000000 |
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
    "communityId": "01J00000000000000000000001",
    "title": "설계 검토",
    "description": "오늘의 기록 #업무",
    "startDate": "2026-09-26",
    "days": 21,
    "timezone": "Asia/Seoul",
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "joined": true,
    "doneDays": 0,
    "memberCount": 1,
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="challenge-07"></a>
## CHALLENGE-07 · 챌린지 참여 취소

- 요청 URL: `https://api.example.test/api/v1/challenges/{id}/participants/me` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
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
DELETE /api/v1/challenges/01J00000000000000000000001/participants/me HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="challenge-08"></a>
## CHALLENGE-08 · 일일 인증

- 요청 URL: `https://api.example.test/api/v1/challenges/{id}/check-ins/{date}` (예약 예시 도메인)
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
| path | date | string (date) | 예 | YYYY-MM-DD, 유효한 지역 달력 날짜;  |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| body | string | 선택 | 일반 텍스트; HTML 실행 금지 최대 50000자 |
| fileIds | string[] | 선택 | 검사 완료 인증 파일 최대 5개 |

```json
{
  "body": "오늘의 기록 #업무",
  "fileIds": [
    "01J00000000000000000000001"
  ]
}
```

### 요청 예시

```http
PUT /api/v1/challenges/01J00000000000000000000001/check-ins/2026-09-26 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "body": "오늘의 기록 #업무",
  "fileIds": [
    "01J00000000000000000000001"
  ]
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | CheckIn | 필수 | 하위 구조 참조  |
| data.challengeId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.date | string (date) | 필수 | 챌린지 지역 날짜  |
| data.accepted | boolean | 필수 | 인증됨  |
| data.doneDays | integer | 필수 | 누적 인증 일수 최소 0; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "challengeId": "01J00000000000000000000001",
    "date": "2026-09-26",
    "accepted": true,
    "doneDays": 1
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="rank-01"></a>
## RANK-01 · 동의 기반 달성률 순위

- 요청 URL: `https://api.example.test/api/v1/community/rankings` (예약 예시 도메인)
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
| query | period | string | 예 | 기간; 허용: DAY, WEEK, MONTH |
| query | groupId | string | 아니오 | 가입한 그룹 ID; 최소 1자; 최대 128자 |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/community/rankings?period=WEEK HTTP/1.1
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
| data | RankingPage | 필수 | 하위 구조 참조  |
| data.items | Ranking[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].nickname | string | 필수 | 공개 동의한 표시명  |
| data.items[].rank | integer | 필수 | 순위 최소 1; 최대 1000000 |
| data.items[].score | number | 필수 | 동일 기간의 완료율; 비교 동의 필요 최소 0; 최대 100 |
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
        "userId": "01J00000000000000000000001",
        "nickname": "김지수",
        "rank": 1,
        "score": 80
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="sticker-01"></a>
## STICKER-01 · 달성 스티커

- 요청 URL: `https://api.example.test/api/v1/me/achievements` (예약 예시 도메인)
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
| query | period | string | 아니오 | 기간; 허용: DAY, WEEK, MONTH |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/me/achievements HTTP/1.1
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
| data | AchievementPage | 필수 | 하위 구조 참조  |
| data.items | Achievement[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].code | string | 필수 | 달성 코드  |
| data.items[].label | string | 필수 | 스티커명  |
| data.items[].awardedAt | string (date-time) | 필수 | 지급 시각  |
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
        "code": "ROUTINE_7_DAYS",
        "label": "7일의 꾸준함",
        "awardedAt": "2026-09-26T00:00:00Z"
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
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |
