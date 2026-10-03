# 채팅·친구·그룹·공유 API 상세 설계

> 2026-10-03: 실제 구현한 /api/chat 18개 기능은 [채팅 전용 문서](../chat/README.md)를 따른다. 이 문서의 /api/v1 초대·차단·공유 목표 계약은 아직 구현되지 않았으며 현재 채팅 계약과 다르다.

2026-09-26 · 목표 /api/v1 · **서버 미구현** · 24개

[전체 목록](catalog.md) · [공통 규칙](00-conventions.md) · [오류 사전](errors.md) · [OpenAPI JSON](openapi.target.json)

## 업무 규칙

받은 초대는 수신자만 처리합니다. 그룹 초대 수락 전에는 멤버로 등록하지 않습니다. 그룹/공유 설정은 owner만 변경하며 마지막 owner 제거는 409입니다. CHAT recordRef는 전송 시와 열람 시 모두 접근 권한을 확인합니다. 차단된 사용자에게 새 DM/초대 금지, 그룹 메시지 노출 정책도 적용합니다. 메시지 목록은 최근 순 커서, UI는 역순 표시; 실시간 이벤트는 보조이고 REST 데이터가 기준입니다.

## 빠른 이동

- [SHARE-01 친구 목록](#share-01)
- [SHARE-02 친구 초대](#share-02)
- [SHARE-03 받은 친구 초대 처리](#share-03)
- [SHARE-04 친구 관계 해제](#share-04)
- [GROUP-01 내 캘린더 그룹](#group-01)
- [GROUP-02 캘린더 그룹 생성](#group-02)
- [GROUP-03 그룹 수정](#group-03)
- [GROUP-04 그룹 삭제](#group-04)
- [GROUP-05 그룹 멤버](#group-05)
- [GROUP-06 그룹 초대](#group-06)
- [GROUP-07 그룹 권한 변경](#group-07)
- [GROUP-08 그룹 멤버 제거](#group-08)
- [GROUP-09 받은 그룹 초대 수락·거절](#group-09)
- [ACL-01 일정 공유 정책](#acl-01)
- [ACL-02 일정 공유 권한 지정](#acl-02)
- [ACL-03 일정 공유 철회](#acl-03)
- [BLOCK-01 사용자 차단](#block-01)
- [BLOCK-02 차단 해제](#block-02)
- [CHAT-01 대화방 메시지 조회](#chat-01)
- [CHAT-02 메시지 전송](#chat-02)
- [CHAT-03 내 채팅방](#chat-03)
- [CHAT-04 DM·그룹 채팅 생성](#chat-04)
- [CHAT-05 읽음 위치 지정](#chat-05)
- [CHAT-06 대화방 나가기](#chat-06)

<a id="share-01"></a>
## SHARE-01 · 친구 목록

- 요청 URL: `https://api.example.test/api/v1/friends` (예약 예시 도메인)
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
| query | status | string | 아니오 | 친구 관계; 허용: PENDING, ACCEPTED, REJECTED |
| query | cursor | string | 아니오 | 사용자·필터 해시에 묶인 불투명 커서; 첫 요청은 생략; 최대 2048자 |
| query | limit | integer | 아니오 | 페이지 크기; 최소 1; 최대 100; 기본 30 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
GET /api/v1/friends HTTP/1.1
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
| data | FriendPage | 필수 | 하위 구조 참조  |
| data.items | Friend[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].status | string | 필수 | 관계 상태 허용: PENDING, ACCEPTED, REJECTED |
| data.items[].nickname | string | 필수 | 상대 이름  |
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
        "userId": "01J00000000000000000000001",
        "status": "PENDING",
        "nickname": "이서연"
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="share-02"></a>
## SHARE-02 · 친구 초대

- 요청 URL: `https://api.example.test/api/v1/friend-invitations` (예약 예시 도메인)
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
| recipientId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |

```json
{
  "recipientId": "01J00000000000000000000001"
}
```

### 요청 예시

```http
POST /api/v1/friend-invitations HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "recipientId": "01J00000000000000000000001"
}
```

### 성공 응답

HTTP **201**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Friend | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.status | string | 필수 | 관계 상태 허용: PENDING, ACCEPTED, REJECTED |
| data.nickname | string | 필수 | 상대 이름  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "userId": "01J00000000000000000000001",
    "status": "PENDING",
    "nickname": "이서연"
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="share-03"></a>
## SHARE-03 · 받은 친구 초대 처리

- 요청 URL: `https://api.example.test/api/v1/friend-invitations/{id}/response` (예약 예시 도메인)
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
| decision | string | 필수 | 본인에게 온 초대 응답 허용: ACCEPT, REJECT |

```json
{
  "decision": "ACCEPT"
}
```

### 요청 예시

```http
PUT /api/v1/friend-invitations/01J00000000000000000000001/response HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "decision": "ACCEPT"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Friend | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.status | string | 필수 | 관계 상태 허용: PENDING, ACCEPTED, REJECTED |
| data.nickname | string | 필수 | 상대 이름  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "userId": "01J00000000000000000000001",
    "status": "ACCEPTED",
    "nickname": "이서연"
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="share-04"></a>
## SHARE-04 · 친구 관계 해제

- 요청 URL: `https://api.example.test/api/v1/friends/{id}` (예약 예시 도메인)
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
DELETE /api/v1/friends/01J00000000000000000000001 HTTP/1.1
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="group-01"></a>
## GROUP-01 · 내 캘린더 그룹

- 요청 URL: `https://api.example.test/api/v1/calendar-groups` (예약 예시 도메인)
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
GET /api/v1/calendar-groups HTTP/1.1
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
| data | GroupPage | 필수 | 하위 구조 참조  |
| data.items | Group[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].name | string | 필수 | 그룹명 최소 1자; 최대 80자 |
| data.items[].note | string | 선택 | 설명 최대 255자 |
| data.items[].ownerId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
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
        "name": "우리 가족",
        "note": "가족 일정",
        "ownerId": "01J00000000000000000000001",
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="group-02"></a>
## GROUP-02 · 캘린더 그룹 생성

- 요청 URL: `https://api.example.test/api/v1/calendar-groups` (예약 예시 도메인)
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
| name | string | 필수 | 그룹명 최소 1자; 최대 80자 |
| note | string | 선택 | 설명 최대 255자 |

```json
{
  "name": "우리 가족",
  "note": "가족 일정"
}
```

### 요청 예시

```http
POST /api/v1/calendar-groups HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "name": "우리 가족",
  "note": "가족 일정"
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
| data | Group | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.name | string | 필수 | 그룹명 최소 1자; 최대 80자 |
| data.note | string | 선택 | 설명 최대 255자 |
| data.ownerId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
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
    "name": "우리 가족",
    "note": "가족 일정",
    "ownerId": "01J00000000000000000000001",
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="group-03"></a>
## GROUP-03 · 그룹 수정

- 요청 URL: `https://api.example.test/api/v1/calendar-groups/{id}` (예약 예시 도메인)
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
| name | string | 선택 | 그룹명 최소 1자; 최대 80자 |
| note | string | 선택 | 설명 최대 255자 |

```json
{
  "name": "우리 가족",
  "note": "가족 일정"
}
```

### 요청 예시

```http
PATCH /api/v1/calendar-groups/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
If-Match: "1"
Content-Type: application/json

{
  "name": "우리 가족",
  "note": "가족 일정"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- ETag: 변경 요청의 If-Match 값

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Group | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.name | string | 필수 | 그룹명 최소 1자; 최대 80자 |
| data.note | string | 선택 | 설명 최대 255자 |
| data.ownerId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
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
    "name": "우리 가족",
    "note": "가족 일정",
    "ownerId": "01J00000000000000000000001",
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="group-04"></a>
## GROUP-04 · 그룹 삭제

- 요청 URL: `https://api.example.test/api/v1/calendar-groups/{id}` (예약 예시 도메인)
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
DELETE /api/v1/calendar-groups/01J00000000000000000000001 HTTP/1.1
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="group-05"></a>
## GROUP-05 · 그룹 멤버

- 요청 URL: `https://api.example.test/api/v1/calendar-groups/{id}/members` (예약 예시 도메인)
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
GET /api/v1/calendar-groups/01J00000000000000000000001/members HTTP/1.1
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
| data | MemberPage | 필수 | 하위 구조 참조  |
| data.items | Member[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].nickname | string | 필수 | 멤버명  |
| data.items[].role | string | 필수 | 역할 허용: OWNER, EDITOR, VIEWER |
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
        "nickname": "이서연",
        "role": "OWNER"
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="group-06"></a>
## GROUP-06 · 그룹 초대

- 요청 URL: `https://api.example.test/api/v1/calendar-groups/{id}/invitations` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: JWT + 리소스 OWNER
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
| recipientId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| role | string | 필수 | 부여 역할 허용: VIEWER, EDITOR |

```json
{
  "recipientId": "01J00000000000000000000001",
  "role": "VIEWER"
}
```

### 요청 예시

```http
POST /api/v1/calendar-groups/01J00000000000000000000001/invitations HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "recipientId": "01J00000000000000000000001",
  "role": "VIEWER"
}
```

### 성공 응답

HTTP **201**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | GroupInvitation | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.groupId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.recipientId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.role | string | 필수 | 초대 역할 허용: VIEWER, EDITOR |
| data.status | string | 필수 | 초대 상태 허용: PENDING, ACCEPTED, REJECTED |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "groupId": "01J00000000000000000000001",
    "recipientId": "01J00000000000000000000001",
    "role": "VIEWER",
    "status": "PENDING"
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="group-07"></a>
## GROUP-07 · 그룹 권한 변경

- 요청 URL: `https://api.example.test/api/v1/calendar-groups/{id}/members/{userId}` (예약 예시 도메인)
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
| role | string | 필수 | 부여 역할; OWNER는 별도 소유권 이전 절차 허용: VIEWER, EDITOR |

```json
{
  "role": "VIEWER"
}
```

### 요청 예시

```http
PUT /api/v1/calendar-groups/01J00000000000000000000001/members/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "role": "VIEWER"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Member | 필수 | 하위 구조 참조  |
| data.userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.nickname | string | 필수 | 멤버명  |
| data.role | string | 필수 | 역할 허용: OWNER, EDITOR, VIEWER |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "userId": "01J00000000000000000000001",
    "nickname": "이서연",
    "role": "OWNER"
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="group-08"></a>
## GROUP-08 · 그룹 멤버 제거

- 요청 URL: `https://api.example.test/api/v1/calendar-groups/{id}/members/{userId}` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
- 인증·인가: JWT + 리소스 OWNER
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
| path | userId | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
DELETE /api/v1/calendar-groups/01J00000000000000000000001/members/01J00000000000000000000001 HTTP/1.1
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="group-09"></a>
## GROUP-09 · 받은 그룹 초대 수락·거절

- 요청 URL: `https://api.example.test/api/v1/calendar-group-invitations/{id}/response` (예약 예시 도메인)
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
| decision | string | 필수 | 본인에게 온 초대 응답 허용: ACCEPT, REJECT |

```json
{
  "decision": "ACCEPT"
}
```

### 요청 예시

```http
PUT /api/v1/calendar-group-invitations/01J00000000000000000000001/response HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "decision": "ACCEPT"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | GroupInvitation | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.groupId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.recipientId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.role | string | 필수 | 초대 역할 허용: VIEWER, EDITOR |
| data.status | string | 필수 | 초대 상태 허용: PENDING, ACCEPTED, REJECTED |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "groupId": "01J00000000000000000000001",
    "recipientId": "01J00000000000000000000001",
    "role": "VIEWER",
    "status": "ACCEPTED"
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="acl-01"></a>
## ACL-01 · 일정 공유 정책

- 요청 URL: `https://api.example.test/api/v1/events/{id}/shares` (예약 예시 도메인)
- HTTP 메서드: **GET**
- 인증·인가: JWT + 리소스 OWNER
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
GET /api/v1/events/01J00000000000000000000001/shares HTTP/1.1
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
| data | SharePage | 필수 | 하위 구조 참조  |
| data.items | Share[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].role | string | 필수 | 공유 역할 허용: VIEWER, EDITOR |
| data.items[].editScope | string | 필수 | 수정 범위 허용: NONE, SINGLE, FUTURE |
| data.items[].deleteScope | string | 필수 | 삭제 범위 허용: NONE, SINGLE, FUTURE |
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
        "role": "VIEWER",
        "editScope": "NONE",
        "deleteScope": "NONE"
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="acl-02"></a>
## ACL-02 · 일정 공유 권한 지정

- 요청 URL: `https://api.example.test/api/v1/events/{id}/shares/{userId}` (예약 예시 도메인)
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
| role | string | 필수 | 공유 역할 허용: VIEWER, EDITOR |
| editScope | string | 필수 | 수정 범위 허용: NONE, SINGLE, FUTURE |
| deleteScope | string | 필수 | 삭제 범위 허용: NONE, SINGLE, FUTURE |

```json
{
  "role": "VIEWER",
  "editScope": "NONE",
  "deleteScope": "NONE"
}
```

### 요청 예시

```http
PUT /api/v1/events/01J00000000000000000000001/shares/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "role": "VIEWER",
  "editScope": "NONE",
  "deleteScope": "NONE"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Share | 필수 | 하위 구조 참조  |
| data.userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.role | string | 필수 | 공유 역할 허용: VIEWER, EDITOR |
| data.editScope | string | 필수 | 수정 범위 허용: NONE, SINGLE, FUTURE |
| data.deleteScope | string | 필수 | 삭제 범위 허용: NONE, SINGLE, FUTURE |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "userId": "01J00000000000000000000001",
    "role": "VIEWER",
    "editScope": "NONE",
    "deleteScope": "NONE"
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="acl-03"></a>
## ACL-03 · 일정 공유 철회

- 요청 URL: `https://api.example.test/api/v1/events/{id}/shares/{userId}` (예약 예시 도메인)
- HTTP 메서드: **DELETE**
- 인증·인가: JWT + 리소스 OWNER
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
| path | userId | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
DELETE /api/v1/events/01J00000000000000000000001/shares/01J00000000000000000000001 HTTP/1.1
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="block-01"></a>
## BLOCK-01 · 사용자 차단

- 요청 URL: `https://api.example.test/api/v1/me/blocks/{userId}` (예약 예시 도메인)
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
| path | userId | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
PUT /api/v1/me/blocks/01J00000000000000000000001 HTTP/1.1
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
| data | Block | 필수 | 하위 구조 참조  |
| data.userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.blocked | boolean | 필수 | 차단 여부  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "userId": "01J00000000000000000000001",
    "blocked": true
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="block-02"></a>
## BLOCK-02 · 차단 해제

- 요청 URL: `https://api.example.test/api/v1/me/blocks/{userId}` (예약 예시 도메인)
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
| path | userId | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
DELETE /api/v1/me/blocks/01J00000000000000000000001 HTTP/1.1
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="chat-01"></a>
## CHAT-01 · 대화방 메시지 조회

- 요청 URL: `https://api.example.test/api/v1/chat/rooms/{id}/messages` (예약 예시 도메인)
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
GET /api/v1/chat/rooms/01J00000000000000000000001/messages HTTP/1.1
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
| data | MessagePage | 필수 | 하위 구조 참조  |
| data.items | Message[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].text | string | 선택 | 메시지 일반 텍스트 최소 1자; 최대 5000자 |
| data.items[].recordRef | RecordRef | 선택 | 하위 구조 참조  |
| data.items[].recordRef.type | string | 필수 | 공유 기록 종류 허용: EVENT, TASK, DIARY, MEMO |
| data.items[].recordRef.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.items[].mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.items[].senderId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].roomId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
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
        "text": "안녕하세요 #스터디",
        "recordRef": {
          "type": "EVENT",
          "id": "01J00000000000000000000001"
        },
        "tags": [
          "업무"
        ],
        "mentionUserIds": [
          "01J00000000000000000000001"
        ],
        "senderId": "01J00000000000000000000001",
        "roomId": "01J00000000000000000000001",
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="chat-02"></a>
## CHAT-02 · 메시지 전송

- 요청 URL: `https://api.example.test/api/v1/chat/rooms/{id}/messages` (예약 예시 도메인)
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
| text | string | 선택 | 메시지 일반 텍스트 최소 1자; 최대 5000자 |
| recordRef | RecordRef | 선택 | 하위 구조 참조  |
| recordRef.type | string | 필수 | 공유 기록 종류 허용: EVENT, TASK, DIARY, MEMO |
| recordRef.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |

```json
{
  "text": "안녕하세요 #스터디",
  "recordRef": {
    "type": "EVENT",
    "id": "01J00000000000000000000001"
  },
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
POST /api/v1/chat/rooms/01J00000000000000000000001/messages HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "text": "안녕하세요 #스터디",
  "recordRef": {
    "type": "EVENT",
    "id": "01J00000000000000000000001"
  },
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
| data | Message | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.text | string | 선택 | 메시지 일반 텍스트 최소 1자; 최대 5000자 |
| data.recordRef | RecordRef | 선택 | 하위 구조 참조  |
| data.recordRef.type | string | 필수 | 공유 기록 종류 허용: EVENT, TASK, DIARY, MEMO |
| data.recordRef.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.tags | string[] | 선택 | 중복 제거, 최대 20개, 앞의 # 제외 최대 20개; 중복 불가 |
| data.mentionUserIds | string[] | 선택 | 주소록의 비차단 사용자 ID; 서버에서 재검증 최대 20개; 중복 불가 |
| data.senderId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.roomId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
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
    "text": "안녕하세요 #스터디",
    "recordRef": {
      "type": "EVENT",
      "id": "01J00000000000000000000001"
    },
    "tags": [
      "업무"
    ],
    "mentionUserIds": [
      "01J00000000000000000000001"
    ],
    "senderId": "01J00000000000000000000001",
    "roomId": "01J00000000000000000000001",
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="chat-03"></a>
## CHAT-03 · 내 채팅방

- 요청 URL: `https://api.example.test/api/v1/chat/rooms` (예약 예시 도메인)
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
GET /api/v1/chat/rooms HTTP/1.1
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
| data | RoomPage | 필수 | 하위 구조 참조  |
| data.items | Room[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].kind | string | 필수 | 대화 유형 허용: DM, GROUP |
| data.items[].memberIds | string[] | 필수 | 초대할 비차단 사용자 최대 100개; 중복 불가 |
| data.items[].name | string | 선택 | 그룹 대화명 최대 80자 |
| data.items[].unreadCount | integer | 필수 | 안 읽은 메시지 수 최소 0; 최대 1000000 |
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
        "kind": "DM",
        "memberIds": [
          "01J00000000000000000000001"
        ],
        "name": "설계 스터디",
        "unreadCount": 0,
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="chat-04"></a>
## CHAT-04 · DM·그룹 채팅 생성

- 요청 URL: `https://api.example.test/api/v1/chat/rooms` (예약 예시 도메인)
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
| kind | string | 필수 | 대화 유형 허용: DM, GROUP |
| memberIds | string[] | 필수 | 초대할 비차단 사용자 최대 100개; 중복 불가 |
| name | string | 선택 | 그룹 대화명 최대 80자 |

```json
{
  "kind": "DM",
  "memberIds": [
    "01J00000000000000000000001"
  ],
  "name": "설계 스터디"
}
```

### 요청 예시

```http
POST /api/v1/chat/rooms HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Idempotency-Key: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "kind": "DM",
  "memberIds": [
    "01J00000000000000000000001"
  ],
  "name": "설계 스터디"
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
| data | Room | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.kind | string | 필수 | 대화 유형 허용: DM, GROUP |
| data.memberIds | string[] | 필수 | 초대할 비차단 사용자 최대 100개; 중복 불가 |
| data.name | string | 선택 | 그룹 대화명 최대 80자 |
| data.unreadCount | integer | 필수 | 안 읽은 메시지 수 최소 0; 최대 1000000 |
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
    "kind": "DM",
    "memberIds": [
      "01J00000000000000000000001"
    ],
    "name": "설계 스터디",
    "unreadCount": 0,
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="chat-05"></a>
## CHAT-05 · 읽음 위치 지정

- 요청 URL: `https://api.example.test/api/v1/chat/rooms/{id}/read` (예약 예시 도메인)
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
| lastReadMessageId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |

```json
{
  "lastReadMessageId": "01J00000000000000000000001"
}
```

### 요청 예시

```http
PUT /api/v1/chat/rooms/01J00000000000000000000001/read HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "lastReadMessageId": "01J00000000000000000000001"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | ReadState | 필수 | 하위 구조 참조  |
| data.roomId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.lastReadMessageId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.unreadCount | integer | 필수 | 안 읽은 수 최소 0; 최대 1000000 |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "roomId": "01J00000000000000000000001",
    "lastReadMessageId": "01J00000000000000000000001",
    "unreadCount": 0
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |

<a id="chat-06"></a>
## CHAT-06 · 대화방 나가기

- 요청 URL: `https://api.example.test/api/v1/chat/rooms/{id}/members/me` (예약 예시 도메인)
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
DELETE /api/v1/chat/rooms/01J00000000000000000000001/members/me HTTP/1.1
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
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |
