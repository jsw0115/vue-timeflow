# 현재 /api 소스 계약 상세

기준 2026-09-27. Java 소스에서 생성한 정적 계약이며 DB 실행 결과가 아닙니다. 목표 /api/v1과 구분합니다.

총 104개: 서비스 연결 47, stub 52, 공용 메모리 5.

## 공통 주의사항

- 응답은 success/data/message 3필드입니다. 내부 ErrorCode는 JSON에 노출되지 않으므로 아래 코드명을 클라이언트가 받는다고 가정하지 마세요.
- SecurityConfig는 공개 인증 경로 외 JWT를 요구하지만 관리자 역할 검사는 없습니다. stub 200은 저장 성공이 아닙니다.
- JSON Content-Type: application/json, Accept: application/json. STT stub만 multipart/form-data; boundary는 HTTP 클라이언트가 지정합니다.
- 현재 CORS 허용 헤더는 Authorization/Content-Type/X-Request-Id뿐입니다. 목표 If-Match/Idempotency-Key/CSRF/ETag 사용에는 서버 설정 변경이 필요합니다.
- 존재하지 않는 리소스·서비스 조건은 소스를 함께 확인하세요. IllegalArgumentException/NoSuchElementException은 400, ApiException은 지정 상태, 기타 예외는 500이므로 모든 누락 파라미터가 항상400이라고 보장하지 않습니다.
- 현재 SQL/JPA 이름 불일치로 실제 DB 부팅이 실패할 수 있습니다. [정합성 보고서](../design/04-schema-gaps.md) 참고.
- 예시는 DTO 자료형으로 생성한 합성 데이터입니다. 서비스 기본값·실제 응답 값은 DB/시간에 따라 달라집니다. 기록 본문 Map 기반 stub에는 필수 필드 계약 자체가 아직 없습니다.

## 공통 오류

| 내부 코드 | HTTP | 원인 | 대응 |
|---|---|---|---|
| VALIDATION_FAILED | 400 | 입력값이 올바르지 않습니다. | 입력·enum·날짜 확인 |
| DUPLICATE_EMAIL | 409 | 이미 가입된 이메일입니다. | 중복 여부·현재 상태 확인 |
| INVALID_CREDENTIALS | 401 | 이메일 또는 비밀번호가 올바르지 않습니다. | 재발급/재로그인 |
| ACCOUNT_DISABLED | 403 | 비활성화된 계정입니다. | 계정 상태/잠금/권한 확인 후 대기 |
| ACCOUNT_LOCKED | 403 | 로그인 시도가 너무 많아 잠시 후 다시 시도해주세요. | 계정 상태/잠금/권한 확인 후 대기 |
| TOKEN_INVALID | 401 | 인증 토큰이 유효하지 않습니다. | 재발급/재로그인 |
| TOKEN_EXPIRED | 401 | 인증 토큰이 만료되었습니다. | 재발급/재로그인 |
| FORBIDDEN | 403 | 접근 권한이 없습니다. | 계정 상태/잠금/권한 확인 후 대기 |
| NOT_FOUND | 404 | 요청한 리소스를 찾을 수 없습니다. | requestId 또는 요청 시각으로 서버 로그 확인 |
| CONFLICT | 409 | 요청이 현재 상태와 충돌합니다. | 중복 여부·현재 상태 확인 |
| RATE_LIMITED | 429 | 요청이 많습니다. 잠시 후 다시 시도해주세요. | requestId 또는 요청 시각으로 서버 로그 확인 |
| INTERNAL_ERROR | 500 | 서버 오류가 발생했습니다. | requestId 또는 요청 시각으로 서버 로그 확인 |

```json
{"success":false,"data":null,"message":"인증 토큰이 유효하지 않습니다."}
```

## 엔드포인트별 요청·응답

### POST /api/auth/signup

- 상태: **서비스 연결**
- 소스: AuthController.java
- 요청 URL: http://localhost:8080/api/auth/signup (로컬 예시)
- 헤더: Authorization 없음, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 201; ApiResponse<SignupResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | request | SignupRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "email": "demo@example.test",
  "nickname": "김지수",
  "password": "Example-Password-2026!",
  "agreeTerms": true,
  "agreePrivacy": true
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "email": "demo@example.test",
    "nickname": "김지수",
    "role": "example"
  },
  "message": null
}
```

오류 처리: 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/auth/login

- 상태: **서비스 연결**
- 소스: AuthController.java
- 요청 URL: http://localhost:8080/api/auth/login (로컬 예시)
- 헤더: Authorization 없음, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; ApiResponse<LoginResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | request | LoginRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "email": "demo@example.test",
  "password": "Example-Password-2026!"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "userId": "01J00000000000000000000001",
    "email": "demo@example.test",
    "nickname": "김지수",
    "role": "example",
    "accessToken": "example-token-not-valid",
    "refreshToken": "example-token-not-valid"
  },
  "message": null
}
```

오류 처리: 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/auth/logout

- 상태: **서비스 연결**
- 소스: AuthController.java
- 요청 URL: http://localhost:8080/api/auth/logout (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; ApiResponse<Void>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | request | RefreshRequest | 아니오 | 없음 |

요청 본문 예시:

```json
{
  "refreshToken": "example-token-not-valid"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/auth/refresh

- 상태: **서비스 연결**
- 소스: AuthController.java
- 요청 URL: http://localhost:8080/api/auth/refresh (로컬 예시)
- 헤더: Authorization 없음, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; ApiResponse<TokenPairResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | request | RefreshRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "refreshToken": "example-token-not-valid"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "accessToken": "example-token-not-valid",
    "refreshToken": "example-token-not-valid"
  },
  "message": null
}
```

오류 처리: 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/auth/me

- 상태: **서비스 연결**
- 소스: AuthController.java
- 요청 URL: http://localhost:8080/api/auth/me (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<MeResponse>

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "userId": "01J00000000000000000000001",
    "email": "demo@example.test",
    "nickname": "김지수",
    "role": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/chat/people

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Person>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### GET /api/chat/rooms

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Page<Room>>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### POST /api/chat/rooms

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Room>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### GET /api/chat/rooms/{id}

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Room>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### GET /api/chat/rooms/{id}/messages

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Page<Message>>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### POST /api/chat/rooms/{id}/messages

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Message>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### PUT /api/chat/rooms/{id}/read

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<ReadState>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### PUT /api/chat/rooms/{id}/owner

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Void>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### DELETE /api/chat/rooms/{id}/members/me

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 204; 본문 없음
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### POST /api/chat/rooms/{id}/typing

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 204; 본문 없음
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### GET /api/chat/events

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; text/event-stream (JSON envelope 없음)
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### GET /api/chat/mentions

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Page<InboxItem>>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### PUT /api/chat/mentions/{messageId}/read

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Void>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### GET /api/chat/tags

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Page<TagCount>>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### GET /api/chat/tagged-messages

- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**
- 소스: ChatController.java
- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.
- 성공 HTTP: 200; ApiResponse<Page<InboxItem>>
- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).

### GET /api/admin/users

- 상태: **계약 stub**
- 소스: AdminController.java
- 요청 URL: http://localhost:8080/api/admin/users (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | q | String | 아니오 | 없음 |
| query | role | String | 아니오 | 없음 |
| query | status | String | 아니오 | 없음 |
| query | page | Integer | 아니오 | 없음 |
| query | size | Integer | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /users",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/admin/users/{id}

- 상태: **계약 stub**
- 소스: AdminController.java
- 요청 URL: http://localhost:8080/api/admin/users/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /users/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/admin/users

- 상태: **계약 stub**
- 소스: AdminController.java
- 요청 URL: http://localhost:8080/api/admin/users (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String,Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /users",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PUT /api/admin/users/{id}

- 상태: **계약 stub**
- 소스: AdminController.java
- 요청 URL: http://localhost:8080/api/admin/users/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| body | body | Map<String,Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "PUT /users/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/admin/users/{id}

- 상태: **계약 stub**
- 소스: AdminController.java
- 요청 URL: http://localhost:8080/api/admin/users/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "DELETE /users/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/diary/calendar

- 상태: **계약 stub**
- 소스: EventDiaryMemoController.java
- 요청 URL: http://localhost:8080/api/diary/calendar (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | year | int | 예 | 없음 |
| query | month | int | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /diary/calendar",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/diary/{date}

- 상태: **계약 stub**
- 소스: EventDiaryMemoController.java
- 요청 URL: http://localhost:8080/api/diary/{date} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | date | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /diary/{date}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/diary/{date}

- 상태: **계약 stub**
- 소스: EventDiaryMemoController.java
- 요청 URL: http://localhost:8080/api/diary/{date} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | date | String | 예 | 없음 |
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /diary/{date}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/diary/{date}

- 상태: **계약 stub**
- 소스: EventDiaryMemoController.java
- 요청 URL: http://localhost:8080/api/diary/{date} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | date | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "DELETE /diary/{date}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/memos

- 상태: **계약 stub**
- 소스: EventDiaryMemoController.java
- 요청 URL: http://localhost:8080/api/memos (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | page | Integer | 아니오 | 없음 |
| query | size | Integer | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /memos",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/memos

- 상태: **계약 stub**
- 소스: EventDiaryMemoController.java
- 요청 URL: http://localhost:8080/api/memos (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /memos",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/memos/{id}

- 상태: **계약 stub**
- 소스: EventDiaryMemoController.java
- 요청 URL: http://localhost:8080/api/memos/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "DELETE /memos/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/memos/stt

- 상태: **계약 stub**
- 소스: EventDiaryMemoController.java
- 요청 URL: http://localhost:8080/api/memos/stt (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: multipart/form-data; boundary=...
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| multipart | file | MultipartFile | 예 | 없음 |

file: 바이너리 파일. 현재 stub은 STT 변환을 수행하지 않습니다. 파일 허용량·MIME 검증 계약은 미정입니다.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /memos/stt",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/home/summary

- 상태: **계약 stub**
- 소스: InsightController.java
- 요청 URL: http://localhost:8080/api/home/summary (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | date | String | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /home/summary",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/stat/dashboard

- 상태: **계약 stub**
- 소스: InsightController.java
- 요청 URL: http://localhost:8080/api/stat/dashboard (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | range | String | 예 | 없음 |
| query | date | String | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /stat/dashboard",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/stat/category

- 상태: **계약 stub**
- 소스: InsightController.java
- 요청 URL: http://localhost:8080/api/stat/category (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | range | String | 예 | 없음 |
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /stat/category",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/stat/plan-actual

- 상태: **계약 stub**
- 소스: InsightController.java
- 요청 URL: http://localhost:8080/api/stat/plan-actual (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | range | String | 예 | 없음 |
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /stat/plan-actual",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/stat/focus

- 상태: **계약 stub**
- 소스: InsightController.java
- 요청 URL: http://localhost:8080/api/stat/focus (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /stat/focus",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/focus/sessions

- 상태: **계약 stub**
- 소스: InsightController.java
- 요청 URL: http://localhost:8080/api/focus/sessions (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | categoryId | String | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /focus/sessions",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/focus/sessions

- 상태: **계약 stub**
- 소스: InsightController.java
- 요청 URL: http://localhost:8080/api/focus/sessions (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /focus/sessions",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PUT /api/focus/sessions/{id}

- 상태: **계약 stub**
- 소스: InsightController.java
- 요청 URL: http://localhost:8080/api/focus/sessions/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "PUT /focus/sessions/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/focus/sessions/{id}

- 상태: **계약 stub**
- 소스: InsightController.java
- 요청 URL: http://localhost:8080/api/focus/sessions/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "DELETE /focus/sessions/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/reports/time-blocks

- 상태: **계약 stub**
- 소스: ReportController.java
- 요청 URL: http://localhost:8080/api/reports/time-blocks (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | date | String | 예 | 없음 |
| query | categoryName | String | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /time-blocks",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/reports/draft

- 상태: **계약 stub**
- 소스: ReportController.java
- 요청 URL: http://localhost:8080/api/reports/draft (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String,Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /draft",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/reports/{reportKey}

- 상태: **계약 stub**
- 소스: ReportController.java
- 요청 URL: http://localhost:8080/api/reports/{reportKey} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | reportKey | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /{reportKey}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/reports/{reportKey}

- 상태: **계약 stub**
- 소스: ReportController.java
- 요청 URL: http://localhost:8080/api/reports/{reportKey} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | reportKey | String | 예 | 없음 |
| body | body | Map<String,Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /{reportKey}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/reports/{reportKey}/sub-reports

- 상태: **계약 stub**
- 소스: ReportController.java
- 요청 URL: http://localhost:8080/api/reports/{reportKey}/sub-reports (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | reportKey | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /{reportKey}/sub-reports",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/settings

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /settings",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/settings

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /settings",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/settings/categories

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings/categories (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /settings/categories",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/settings/categories

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings/categories (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /settings/categories",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/settings/notifications

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings/notifications (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /settings/notifications",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/settings/notifications

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings/notifications (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /settings/notifications",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/settings/share-visibility

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings/share-visibility (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /settings/share-visibility",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/settings/share-visibility

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings/share-visibility (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /settings/share-visibility",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/settings/theme-sticker

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings/theme-sticker (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /settings/theme-sticker",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/settings/theme-sticker

- 상태: **계약 stub**
- 소스: SettingsController.java
- 요청 URL: http://localhost:8080/api/settings/theme-sticker (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /settings/theme-sticker",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/share/friends

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/friends (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /friends",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/share/friends/invite

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/friends/invite (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String,Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /friends/invite",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/share/friends/{id}/accept

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/friends/{id}/accept (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /friends/{id}/accept",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/share/friends/{id}/reject

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/friends/{id}/reject (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /friends/{id}/reject",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/share/friends/{id}

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/friends/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "DELETE /friends/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/share/groups

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/groups (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /groups",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/share/groups

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/groups (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String,Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /groups",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/share/groups/{id}

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/groups/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /groups/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PUT /api/share/groups/{id}

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/groups/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| body | body | Map<String,Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "PUT /groups/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/share/groups/{id}

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/groups/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "DELETE /groups/{id}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/share/groups/{id}/members

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/groups/{id}/members (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /groups/{id}/members",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/share/groups/{id}/members

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/groups/{id}/members (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| body | body | Map<String,Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "POST /groups/{id}/members",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/share/groups/{id}/members/{memberId}

- 상태: **계약 stub**
- 소스: ShareController.java
- 요청 URL: http://localhost:8080/api/share/groups/{id}/members/{memberId} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | memberId | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "DELETE /groups/{id}/members/{memberId}",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/user/profile

- 상태: **계약 stub**
- 소스: UserProfileController.java
- 요청 URL: http://localhost:8080/api/user/profile (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "GET /user/profile",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PUT /api/user/profile

- 상태: **계약 stub**
- 소스: UserProfileController.java
- 요청 URL: http://localhost:8080/api/user/profile (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; CONTRACT_READY이며 실 처리 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | body | Map<String, Object> | 예 | 없음 |

요청 본문 예시 (stub: 임의 JSON, 필드 미정의):

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "endpoint": "PUT /user/profile",
    "status": "CONTRACT_READY"
  },
  "message": "컨트롤러 계약만 준비되었습니다."
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/events

- 상태: **서비스 연결**
- 소스: EventController.java
- 요청 URL: http://localhost:8080/api/events (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<List<EventResponse>>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | LocalDate | 아니오 | 없음 |
| query | to | LocalDate | 아니오 | 없음 |
| query | keyword | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "설계 검토",
      "category": "example",
      "date": "2026-09-26",
      "startTime": "09:00:00",
      "endTime": "10:00:00",
      "location": "example",
      "visibility": "PRIVATE",
      "note": "example",
      "seriesId": 1,
      "recurring": false
    }
  ],
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/events

- 상태: **서비스 연결**
- 소스: EventController.java
- 요청 URL: http://localhost:8080/api/events (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 201; ApiResponse<EventResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | request | EventRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "title": "설계 검토",
  "category": "example",
  "date": "2026-09-26",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "location": "example",
  "visibility": "PRIVATE",
  "note": "example"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "설계 검토",
    "category": "example",
    "date": "2026-09-26",
    "startTime": "09:00:00",
    "endTime": "10:00:00",
    "location": "example",
    "visibility": "PRIVATE",
    "note": "example",
    "seriesId": 1,
    "recurring": false
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PUT /api/events/{eventId}

- 상태: **서비스 연결**
- 소스: EventController.java
- 요청 URL: http://localhost:8080/api/events/{eventId} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; ApiResponse<EventResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | eventId | Long | 예 | 없음 |
| body | request | EventRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "title": "설계 검토",
  "category": "example",
  "date": "2026-09-26",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "location": "example",
  "visibility": "PRIVATE",
  "note": "example"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "설계 검토",
    "category": "example",
    "date": "2026-09-26",
    "startTime": "09:00:00",
    "endTime": "10:00:00",
    "location": "example",
    "visibility": "PRIVATE",
    "note": "example",
    "seriesId": 1,
    "recurring": false
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/events/{eventId}

- 상태: **서비스 연결**
- 소스: EventController.java
- 요청 URL: http://localhost:8080/api/events/{eventId} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<Void>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | eventId | Long | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/events/recurring

- 상태: **서비스 연결**
- 소스: EventController.java
- 요청 URL: http://localhost:8080/api/events/recurring (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 201; ApiResponse<List<EventResponse>>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | request | RecurringEventRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "title": "설계 검토",
  "category": "example",
  "startDate": "2026-09-26",
  "until": "2026-09-26",
  "freq": "DAILY",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "location": "example",
  "visibility": "PRIVATE",
  "note": "example"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "설계 검토",
      "category": "example",
      "date": "2026-09-26",
      "startTime": "09:00:00",
      "endTime": "10:00:00",
      "location": "example",
      "visibility": "PRIVATE",
      "note": "example",
      "seriesId": 1,
      "recurring": false
    }
  ],
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PUT /api/events/{eventId}/following

- 상태: **서비스 연결**
- 소스: EventController.java
- 요청 URL: http://localhost:8080/api/events/{eventId}/following (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; ApiResponse<List<EventResponse>>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | eventId | Long | 예 | 없음 |
| body | request | EventRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "title": "설계 검토",
  "category": "example",
  "date": "2026-09-26",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "location": "example",
  "visibility": "PRIVATE",
  "note": "example"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "설계 검토",
      "category": "example",
      "date": "2026-09-26",
      "startTime": "09:00:00",
      "endTime": "10:00:00",
      "location": "example",
      "visibility": "PRIVATE",
      "note": "example",
      "seriesId": 1,
      "recurring": false
    }
  ],
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/events/{eventId}/following

- 상태: **서비스 연결**
- 소스: EventController.java
- 요청 URL: http://localhost:8080/api/events/{eventId}/following (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<Void>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | eventId | Long | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/planner/items

- 상태: **공용 메모리 시연**
- 소스: PlannerController.java
- 요청 URL: http://localhost:8080/api/planner/items (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<List<PlannerItem>>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | date | LocalDate | 아니오 | 없음 |
| query | type | PlannerItem.ItemType | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | status | PlannerItem.ItemStatus | 아니오 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "EVENT",
      "title": "설계 검토",
      "category": "example",
      "date": "2026-09-26",
      "startTime": "09:00:00",
      "endTime": "10:00:00",
      "status": "TODO",
      "dday": false,
      "note": "example"
    }
  ],
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/planner/items

- 상태: **공용 메모리 시연**
- 소스: PlannerController.java
- 요청 URL: http://localhost:8080/api/planner/items (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 201; ApiResponse<PlannerItem>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | item | PlannerItem | 예 | 없음 |

요청 본문 예시:

```json
{
  "id": 1,
  "type": "EVENT",
  "title": "설계 검토",
  "category": "example",
  "date": "2026-09-26",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "status": "TODO",
  "dday": false,
  "note": "example"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "EVENT",
    "title": "설계 검토",
    "category": "example",
    "date": "2026-09-26",
    "startTime": "09:00:00",
    "endTime": "10:00:00",
    "status": "TODO",
    "dday": false,
    "note": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PUT /api/planner/items/{id}

- 상태: **공용 메모리 시연**
- 소스: PlannerController.java
- 요청 URL: http://localhost:8080/api/planner/items/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; ApiResponse<PlannerItem>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | long | 예 | 없음 |
| body | item | PlannerItem | 예 | 없음 |

요청 본문 예시:

```json
{
  "id": 1,
  "type": "EVENT",
  "title": "설계 검토",
  "category": "example",
  "date": "2026-09-26",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "status": "TODO",
  "dday": false,
  "note": "example"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "EVENT",
    "title": "설계 검토",
    "category": "example",
    "date": "2026-09-26",
    "startTime": "09:00:00",
    "endTime": "10:00:00",
    "status": "TODO",
    "dday": false,
    "note": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PATCH /api/planner/items/{id}/status

- 상태: **공용 메모리 시연**
- 소스: PlannerController.java
- 요청 URL: http://localhost:8080/api/planner/items/{id}/status (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<PlannerItem>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | long | 예 | 없음 |
| query | status | PlannerItem.ItemStatus | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "EVENT",
    "title": "설계 검토",
    "category": "example",
    "date": "2026-09-26",
    "startTime": "09:00:00",
    "endTime": "10:00:00",
    "status": "TODO",
    "dday": false,
    "note": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/planner/items/{id}

- 상태: **공용 메모리 시연**
- 소스: PlannerController.java
- 요청 URL: http://localhost:8080/api/planner/items/{id} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 204; 본문 없음

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | long | 예 | 없음 |

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/planner/daily

- 상태: **서비스 연결**
- 소스: PlannerViewController.java
- 요청 URL: http://localhost:8080/api/planner/daily (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<PlannerViewResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | date | LocalDate | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "설계 검토",
        "category": "example",
        "date": "2026-09-26",
        "startTime": "09:00:00",
        "endTime": "10:00:00",
        "location": "example",
        "visibility": "PRIVATE",
        "note": "example",
        "seriesId": 1,
        "recurring": false
      }
    ],
    "tasks": [
      {
        "id": "01J00000000000000000000001",
        "title": "설계 검토",
        "note": "example",
        "status": "TODO",
        "priority": "LOW",
        "energyLevel": "LOW",
        "durationMin": 30,
        "due": "2026-09-26",
        "categoryId": "01J00000000000000000000001",
        "categoryName": "example",
        "categoryColor": "#2f5d46",
        "categoryIcon": "example"
      }
    ],
    "routines": [
      {
        "id": "01J00000000000000000000001",
        "name": "설계 검토",
        "atTime": "09:00",
        "days": "mon,tue,wed,thu,fri",
        "icon": "example",
        "categoryId": "01J00000000000000000000001",
        "categoryName": "example",
        "categoryColor": "#2f5d46",
        "categoryIcon": "example",
        "onoff": true,
        "notifyEnabled": true,
        "notifyMinutesBefore": 1
      }
    ]
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/planner/weekly

- 상태: **서비스 연결**
- 소스: PlannerViewController.java
- 요청 URL: http://localhost:8080/api/planner/weekly (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<PlannerViewResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | start | LocalDate | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "설계 검토",
        "category": "example",
        "date": "2026-09-26",
        "startTime": "09:00:00",
        "endTime": "10:00:00",
        "location": "example",
        "visibility": "PRIVATE",
        "note": "example",
        "seriesId": 1,
        "recurring": false
      }
    ],
    "tasks": [
      {
        "id": "01J00000000000000000000001",
        "title": "설계 검토",
        "note": "example",
        "status": "TODO",
        "priority": "LOW",
        "energyLevel": "LOW",
        "durationMin": 30,
        "due": "2026-09-26",
        "categoryId": "01J00000000000000000000001",
        "categoryName": "example",
        "categoryColor": "#2f5d46",
        "categoryIcon": "example"
      }
    ],
    "routines": [
      {
        "id": "01J00000000000000000000001",
        "name": "설계 검토",
        "atTime": "09:00",
        "days": "mon,tue,wed,thu,fri",
        "icon": "example",
        "categoryId": "01J00000000000000000000001",
        "categoryName": "example",
        "categoryColor": "#2f5d46",
        "categoryIcon": "example",
        "onoff": true,
        "notifyEnabled": true,
        "notifyMinutesBefore": 1
      }
    ]
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/planner/monthly

- 상태: **서비스 연결**
- 소스: PlannerViewController.java
- 요청 URL: http://localhost:8080/api/planner/monthly (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<PlannerViewResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | year | int | 예 | 없음 |
| query | month | int | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "설계 검토",
        "category": "example",
        "date": "2026-09-26",
        "startTime": "09:00:00",
        "endTime": "10:00:00",
        "location": "example",
        "visibility": "PRIVATE",
        "note": "example",
        "seriesId": 1,
        "recurring": false
      }
    ],
    "tasks": [
      {
        "id": "01J00000000000000000000001",
        "title": "설계 검토",
        "note": "example",
        "status": "TODO",
        "priority": "LOW",
        "energyLevel": "LOW",
        "durationMin": 30,
        "due": "2026-09-26",
        "categoryId": "01J00000000000000000000001",
        "categoryName": "example",
        "categoryColor": "#2f5d46",
        "categoryIcon": "example"
      }
    ],
    "routines": [
      {
        "id": "01J00000000000000000000001",
        "name": "설계 검토",
        "atTime": "09:00",
        "days": "mon,tue,wed,thu,fri",
        "icon": "example",
        "categoryId": "01J00000000000000000000001",
        "categoryName": "example",
        "categoryColor": "#2f5d46",
        "categoryIcon": "example",
        "onoff": true,
        "notifyEnabled": true,
        "notifyMinutesBefore": 1
      }
    ]
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/planner/yearly

- 상태: **서비스 연결**
- 소스: PlannerViewController.java
- 요청 URL: http://localhost:8080/api/planner/yearly (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<PlannerViewResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | year | int | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "설계 검토",
        "category": "example",
        "date": "2026-09-26",
        "startTime": "09:00:00",
        "endTime": "10:00:00",
        "location": "example",
        "visibility": "PRIVATE",
        "note": "example",
        "seriesId": 1,
        "recurring": false
      }
    ],
    "tasks": [
      {
        "id": "01J00000000000000000000001",
        "title": "설계 검토",
        "note": "example",
        "status": "TODO",
        "priority": "LOW",
        "energyLevel": "LOW",
        "durationMin": 30,
        "due": "2026-09-26",
        "categoryId": "01J00000000000000000000001",
        "categoryName": "example",
        "categoryColor": "#2f5d46",
        "categoryIcon": "example"
      }
    ],
    "routines": [
      {
        "id": "01J00000000000000000000001",
        "name": "설계 검토",
        "atTime": "09:00",
        "days": "mon,tue,wed,thu,fri",
        "icon": "example",
        "categoryId": "01J00000000000000000000001",
        "categoryName": "example",
        "categoryColor": "#2f5d46",
        "categoryIcon": "example",
        "onoff": true,
        "notifyEnabled": true,
        "notifyMinutesBefore": 1
      }
    ]
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/planner/upcoming

- 상태: **서비스 연결**
- 소스: PlannerViewController.java
- 요청 URL: http://localhost:8080/api/planner/upcoming (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<List<EventResponse>>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | days | int | 아니오 | 7 |

성공 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "설계 검토",
      "category": "example",
      "date": "2026-09-26",
      "startTime": "09:00:00",
      "endTime": "10:00:00",
      "location": "example",
      "visibility": "PRIVATE",
      "note": "example",
      "seriesId": 1,
      "recurring": false
    }
  ],
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/routines

- 상태: **서비스 연결**
- 소스: RoutineController.java
- 요청 URL: http://localhost:8080/api/routines (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<List<RoutineResponse>>

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": "01J00000000000000000000001",
      "name": "설계 검토",
      "atTime": "09:00",
      "days": "mon,tue,wed,thu,fri",
      "icon": "example",
      "categoryId": "01J00000000000000000000001",
      "categoryName": "example",
      "categoryColor": "#2f5d46",
      "categoryIcon": "example",
      "onoff": true,
      "notifyEnabled": true,
      "notifyMinutesBefore": 1
    }
  ],
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/routines/quick

- 상태: **서비스 연결**
- 소스: RoutineController.java
- 요청 URL: http://localhost:8080/api/routines/quick (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 201; ApiResponse<RoutineResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | request | RoutineQuickCreateRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "name": "설계 검토",
  "atTime": "09:00"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "name": "설계 검토",
    "atTime": "09:00",
    "days": "mon,tue,wed,thu,fri",
    "icon": "example",
    "categoryId": "01J00000000000000000000001",
    "categoryName": "example",
    "categoryColor": "#2f5d46",
    "categoryIcon": "example",
    "onoff": true,
    "notifyEnabled": true,
    "notifyMinutesBefore": 1
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/routines

- 상태: **서비스 연결**
- 소스: RoutineController.java
- 요청 URL: http://localhost:8080/api/routines (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 201; ApiResponse<RoutineResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | request | RoutineRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "name": "설계 검토",
  "atTime": "09:00",
  "days": "mon,tue,wed,thu,fri",
  "icon": "example",
  "categoryId": "01J00000000000000000000001",
  "categoryName": "example",
  "categoryColor": "#2f5d46",
  "categoryIcon": "example",
  "onoff": true,
  "notifyEnabled": true,
  "notifyMinutesBefore": 1
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "name": "설계 검토",
    "atTime": "09:00",
    "days": "mon,tue,wed,thu,fri",
    "icon": "example",
    "categoryId": "01J00000000000000000000001",
    "categoryName": "example",
    "categoryColor": "#2f5d46",
    "categoryIcon": "example",
    "onoff": true,
    "notifyEnabled": true,
    "notifyMinutesBefore": 1
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PUT /api/routines/{routineId}

- 상태: **서비스 연결**
- 소스: RoutineController.java
- 요청 URL: http://localhost:8080/api/routines/{routineId} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; ApiResponse<RoutineResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |
| body | request | RoutineRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "name": "설계 검토",
  "atTime": "09:00",
  "days": "mon,tue,wed,thu,fri",
  "icon": "example",
  "categoryId": "01J00000000000000000000001",
  "categoryName": "example",
  "categoryColor": "#2f5d46",
  "categoryIcon": "example",
  "onoff": true,
  "notifyEnabled": true,
  "notifyMinutesBefore": 1
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "name": "설계 검토",
    "atTime": "09:00",
    "days": "mon,tue,wed,thu,fri",
    "icon": "example",
    "categoryId": "01J00000000000000000000001",
    "categoryName": "example",
    "categoryColor": "#2f5d46",
    "categoryIcon": "example",
    "onoff": true,
    "notifyEnabled": true,
    "notifyMinutesBefore": 1
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/routines/{routineId}

- 상태: **서비스 연결**
- 소스: RoutineController.java
- 요청 URL: http://localhost:8080/api/routines/{routineId} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<Void>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/routines/{routineId}/history

- 상태: **서비스 연결**
- 소스: RoutineController.java
- 요청 URL: http://localhost:8080/api/routines/{routineId}/history (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<RoutineHistoryGridResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |
| query | days | int | 아니오 | 30 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "routineId": "01J00000000000000000000001",
    "entries": [
      {
        "date": "2026-09-26",
        "status": "example"
      }
    ],
    "doneCount": 1,
    "totalDays": 1,
    "completionRate": 50
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PATCH /api/routines/{routineId}/history/{date}/toggle

- 상태: **서비스 연결**
- 소스: RoutineController.java
- 요청 URL: http://localhost:8080/api/routines/{routineId}/history/{date}/toggle (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; ApiResponse<RoutineLogEntryResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |
| path | date | LocalDate | 예 | 없음 |
| body | request | ToggleRoutineLogRequest | 아니오 | 없음 |

요청 본문 예시:

```json
{
  "status": "example"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "date": "2026-09-26",
    "status": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/routines/{routineId}/history/{date}

- 상태: **서비스 연결**
- 소스: RoutineController.java
- 요청 URL: http://localhost:8080/api/routines/{routineId}/history/{date} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<Void>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |
| path | date | LocalDate | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/tasks

- 상태: **서비스 연결**
- 소스: TaskController.java
- 요청 URL: http://localhost:8080/api/tasks (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<List<TaskResponse>>

요청 파라미터 없음.

성공 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": "01J00000000000000000000001",
      "title": "설계 검토",
      "note": "example",
      "status": "TODO",
      "priority": "LOW",
      "energyLevel": "LOW",
      "durationMin": 30,
      "due": "2026-09-26",
      "categoryId": "01J00000000000000000000001",
      "categoryName": "example",
      "categoryColor": "#2f5d46",
      "categoryIcon": "example"
    }
  ],
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### GET /api/tasks/{taskId}

- 상태: **서비스 연결**
- 소스: TaskController.java
- 요청 URL: http://localhost:8080/api/tasks/{taskId} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<TaskResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "note": "example",
    "status": "TODO",
    "priority": "LOW",
    "energyLevel": "LOW",
    "durationMin": 30,
    "due": "2026-09-26",
    "categoryId": "01J00000000000000000000001",
    "categoryName": "example",
    "categoryColor": "#2f5d46",
    "categoryIcon": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/tasks

- 상태: **서비스 연결**
- 소스: TaskController.java
- 요청 URL: http://localhost:8080/api/tasks (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 201; ApiResponse<TaskResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| body | request | TaskRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "title": "설계 검토",
  "note": "example",
  "priority": "LOW",
  "energyLevel": "LOW",
  "durationMin": 30,
  "due": "2026-09-26",
  "categoryId": "01J00000000000000000000001",
  "categoryName": "example",
  "categoryColor": "#2f5d46",
  "categoryIcon": "example"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "note": "example",
    "status": "TODO",
    "priority": "LOW",
    "energyLevel": "LOW",
    "durationMin": 30,
    "due": "2026-09-26",
    "categoryId": "01J00000000000000000000001",
    "categoryName": "example",
    "categoryColor": "#2f5d46",
    "categoryIcon": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PUT /api/tasks/{taskId}

- 상태: **서비스 연결**
- 소스: TaskController.java
- 요청 URL: http://localhost:8080/api/tasks/{taskId} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json, Content-Type: application/json
- 성공 HTTP: 200; ApiResponse<TaskResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |
| body | request | TaskRequest | 예 | 없음 |

요청 본문 예시:

```json
{
  "title": "설계 검토",
  "note": "example",
  "priority": "LOW",
  "energyLevel": "LOW",
  "durationMin": 30,
  "due": "2026-09-26",
  "categoryId": "01J00000000000000000000001",
  "categoryName": "example",
  "categoryColor": "#2f5d46",
  "categoryIcon": "example"
}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "note": "example",
    "status": "TODO",
    "priority": "LOW",
    "energyLevel": "LOW",
    "durationMin": 30,
    "due": "2026-09-26",
    "categoryId": "01J00000000000000000000001",
    "categoryName": "example",
    "categoryColor": "#2f5d46",
    "categoryIcon": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### DELETE /api/tasks/{taskId}

- 상태: **서비스 연결**
- 소스: TaskController.java
- 요청 URL: http://localhost:8080/api/tasks/{taskId} (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<Void>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### PATCH /api/tasks/{taskId}/status

- 상태: **서비스 연결**
- 소스: TaskController.java
- 요청 URL: http://localhost:8080/api/tasks/{taskId}/status (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 200; ApiResponse<TaskResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "note": "example",
    "status": "TODO",
    "priority": "LOW",
    "energyLevel": "LOW",
    "durationMin": 30,
    "due": "2026-09-26",
    "categoryId": "01J00000000000000000000001",
    "categoryName": "example",
    "categoryColor": "#2f5d46",
    "categoryIcon": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

### POST /api/tasks/{taskId}/duplicate

- 상태: **서비스 연결**
- 소스: TaskController.java
- 요청 URL: http://localhost:8080/api/tasks/{taskId}/duplicate (로컬 예시)
- 헤더: Authorization: Bearer <access-token>, Accept: application/json
- 성공 HTTP: 201; ApiResponse<TaskResponse>

| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "title": "설계 검토",
    "note": "example",
    "status": "TODO",
    "priority": "LOW",
    "energyLevel": "LOW",
    "durationMin": 30,
    "due": "2026-09-26",
    "categoryId": "01J00000000000000000000001",
    "categoryName": "example",
    "categoryColor": "#2f5d46",
    "categoryIcon": "example"
  },
  "message": null
}
```

오류 처리: JWT 누락/무효 401 → 로그인 확인. 본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.

## DTO 필드 사전

필수 표시는 Bean Validation annotation만 반영합니다. 응답 DTO의 선택 표시는 null 가능성 보장이 아니라 요청 검증 annotation이 없다는 의미입니다. Java primitive는 누락 시 기본값으로 역직렬화될 수 있으므로 required와 기본값을 혼동하지 마세요.

### LoginRequest

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| email | String | 예 | NotBlank, Email |
| password | String | 예 | NotBlank |

### LoginResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| userId | String | 미지정 | 없음 |
| email | String | 미지정 | 없음 |
| nickname | String | 미지정 | 없음 |
| role | String | 미지정 | 없음 |
| accessToken | String | 미지정 | 없음 |
| refreshToken | String | 미지정 | 없음 |

### MeResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| userId | String | 미지정 | 없음 |
| email | String | 미지정 | 없음 |
| nickname | String | 미지정 | 없음 |
| role | String | 미지정 | 없음 |

### RefreshRequest

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| refreshToken | String | 예 | NotBlank |

### SignupRequest

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| email | String | 예 | NotBlank, Email |
| nickname | String | 예 | NotBlank |
| password | String | 예 | NotBlank |
| agreeTerms | boolean | 예 | AssertTrue |
| agreePrivacy | boolean | 예 | AssertTrue |

### SignupResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| email | String | 미지정 | 없음 |
| nickname | String | 미지정 | 없음 |
| role | String | 미지정 | 없음 |

### TokenPairResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| accessToken | String | 미지정 | 없음 |
| refreshToken | String | 미지정 | 없음 |

### CreateRoom

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| kind | String | 예 | NotBlank |
| name | String | 미지정 | Size |
| memberIds | List<String> | 예 | NotEmpty, Size, NotNull, Pattern |

### SendMessage

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| clientMessageId | String | 예 | NotBlank |
| body | String | 예 | NotBlank, Size |
| mentionUserIds | List<String> | 예 | Size, NotBlank |

### Read

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| sequence | Long | 예 | NotNull, Min |

### Owner

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| userId | String | 예 | NotBlank |

### Person

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| id | String | 미지정 | 없음 |
| nickname | String | 미지정 | 없음 |

### Member

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| userId | String | 미지정 | 없음 |
| nickname | String | 미지정 | 없음 |
| lastReadSequence | String | 미지정 | 없음 |

### Message

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| id | String | 미지정 | 없음 |
| roomId | String | 미지정 | 없음 |
| sequence | String | 미지정 | 없음 |
| senderId | String | 미지정 | 없음 |
| senderName | String | 미지정 | 없음 |
| clientMessageId | String | 미지정 | 없음 |
| body | String | 미지정 | 없음 |
| createdAt | Instant | 미지정 | 없음 |
| tags | List<String> | 미지정 | 없음 |
| mentionUserIds | List<String> | 미지정 | 없음 |

### Room

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| id | String | 미지정 | 없음 |
| kind | String | 미지정 | 없음 |
| name | String | 미지정 | 없음 |
| ownerId | String | 미지정 | 없음 |
| lastSequence | String | 미지정 | 없음 |
| unreadCount | long | 미지정 | 없음 |
| lastMessage | Message | 미지정 | 없음 |
| members | List<Member> | 미지정 | 없음 |
| updatedAt | Instant | 미지정 | 없음 |

### Page

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| items | List<T> | 미지정 | 없음 |
| nextCursor | String | 미지정 | 없음 |
| hasNext | boolean | 미지정 | 없음 |

### ReadState

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| roomId | String | 미지정 | 없음 |
| lastReadSequence | String | 미지정 | 없음 |

### Signal

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| roomId | String | 미지정 | 없음 |
| type | String | 미지정 | 없음 |
| userId | String | 미지정 | 없음 |

### InboxItem

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| message | Message | 미지정 | 없음 |
| roomName | String | 미지정 | 없음 |
| read | boolean | 미지정 | 없음 |

### TagCount

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| name | String | 미지정 | 없음 |
| messageCount | long | 미지정 | 없음 |

### ApiResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| success | boolean | 미지정 | 없음 |
| data | T | 미지정 | 없음 |
| message | String | 미지정 | 없음 |

### EventRequest

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| title | String | 예 | NotBlank |
| category | String | 미지정 | 없음 |
| date | LocalDate | 예 | NotNull |
| startTime | LocalTime | 미지정 | 없음 |
| endTime | LocalTime | 미지정 | 없음 |
| location | String | 미지정 | 없음 |
| visibility | EventVisibility | 미지정 | 없음 |
| note | String | 미지정 | 없음 |

### EventResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| id | Long | 미지정 | 없음 |
| title | String | 미지정 | 없음 |
| category | String | 미지정 | 없음 |
| date | LocalDate | 미지정 | 없음 |
| startTime | LocalTime | 미지정 | 없음 |
| endTime | LocalTime | 미지정 | 없음 |
| location | String | 미지정 | 없음 |
| visibility | EventVisibility | 미지정 | 없음 |
| note | String | 미지정 | 없음 |
| seriesId | Long | 미지정 | 없음 |
| recurring | boolean | 미지정 | 없음 |

### RecurringEventRequest

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| title | String | 예 | NotBlank |
| category | String | 미지정 | 없음 |
| startDate | LocalDate | 예 | NotNull |
| until | LocalDate | 예 | NotNull |
| freq | RecurrenceFreq | 예 | NotNull |
| startTime | LocalTime | 미지정 | 없음 |
| endTime | LocalTime | 미지정 | 없음 |
| location | String | 미지정 | 없음 |
| visibility | EventVisibility | 미지정 | 없음 |
| note | String | 미지정 | 없음 |

### PlannerItem

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| id | Long | 미지정 | 없음 |
| type | ItemType | 예 | NotNull |
| title | String | 예 | NotBlank |
| category | String | 미지정 | 없음 |
| date | LocalDate | 미지정 | 없음 |
| startTime | LocalTime | 미지정 | 없음 |
| endTime | LocalTime | 미지정 | 없음 |
| status | ItemStatus | 미지정 | 없음 |
| dday | boolean | 미지정 | 없음 |
| note | String | 미지정 | 없음 |

### PlannerViewResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| events | List<EventResponse> | 미지정 | 없음 |
| tasks | List<TaskResponse> | 미지정 | 없음 |
| routines | List<RoutineResponse> | 미지정 | 없음 |

### RoutineHistoryGridResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| routineId | String | 미지정 | 없음 |
| entries | List<RoutineLogEntryResponse> | 미지정 | 없음 |
| doneCount | int | 미지정 | 없음 |
| totalDays | int | 미지정 | 없음 |
| completionRate | double | 미지정 | 없음 |

### RoutineLogEntryResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| date | LocalDate | 미지정 | 없음 |
| status | RoutineLogStatus | 미지정 | 없음 |

### RoutineQuickCreateRequest

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| name | String | 예 | NotBlank |
| atTime | String | 예 | NotBlank, Pattern |

### RoutineRequest

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| name | String | 예 | NotBlank |
| atTime | String | 예 | NotBlank, Pattern |
| days | String | 미지정 | 없음 |
| icon | String | 미지정 | 없음 |
| categoryId | String | 미지정 | 없음 |
| categoryName | String | 미지정 | 없음 |
| categoryColor | String | 미지정 | 없음 |
| categoryIcon | String | 미지정 | 없음 |
| onoff | boolean | 미지정 | 없음 |
| notifyEnabled | boolean | 미지정 | 없음 |
| notifyMinutesBefore | Integer | 미지정 | 없음 |

### RoutineResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| id | String | 미지정 | 없음 |
| name | String | 미지정 | 없음 |
| atTime | String | 미지정 | 없음 |
| days | String | 미지정 | 없음 |
| icon | String | 미지정 | 없음 |
| categoryId | String | 미지정 | 없음 |
| categoryName | String | 미지정 | 없음 |
| categoryColor | String | 미지정 | 없음 |
| categoryIcon | String | 미지정 | 없음 |
| onoff | boolean | 미지정 | 없음 |
| notifyEnabled | boolean | 미지정 | 없음 |
| notifyMinutesBefore | Integer | 미지정 | 없음 |

### ToggleRoutineLogRequest

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| status | RoutineLogStatus | 미지정 | 없음 |

### AuthUserPrincipal

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| userId | String | 미지정 | 없음 |
| email | String | 미지정 | 없음 |
| role | String | 미지정 | 없음 |

### TaskRequest

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| title | String | 예 | NotBlank |
| note | String | 미지정 | 없음 |
| priority | TaskPriority | 미지정 | 없음 |
| energyLevel | EnergyLevel | 미지정 | 없음 |
| durationMin | Integer | 미지정 | 없음 |
| due | LocalDate | 미지정 | 없음 |
| categoryId | String | 미지정 | 없음 |
| categoryName | String | 미지정 | 없음 |
| categoryColor | String | 미지정 | 없음 |
| categoryIcon | String | 미지정 | 없음 |

### TaskResponse

| 필드 | 자료형 | 검증 필수 | annotation |
|---|---|---|---|
| id | String | 미지정 | 없음 |
| title | String | 미지정 | 없음 |
| note | String | 미지정 | 없음 |
| status | TaskStatus | 미지정 | 없음 |
| priority | TaskPriority | 미지정 | 없음 |
| energyLevel | EnergyLevel | 미지정 | 없음 |
| durationMin | int | 미지정 | 없음 |
| due | LocalDate | 미지정 | 없음 |
| categoryId | String | 미지정 | 없음 |
| categoryName | String | 미지정 | 없음 |
| categoryColor | String | 미지정 | 없음 |
| categoryIcon | String | 미지정 | 없음 |

## Enum 사전

- ThrottleKeyType: EMAIL, IP
- UserRole: USER, ADMIN
- UserStatus: ACTIVE, SUSPENDED, DELETED
- EventVisibility: PRIVATE, FRIENDS, SHARED, PUBLIC
- RecurrenceFreq: DAILY, WEEKLY, MONTHLY, YEARLY
- ItemType: EVENT, TASK, ROUTINE, DIARY, MEMO, ACTUAL
- ItemStatus: TODO, IN_PROGRESS, DONE, CANCELLED, SCHEDULED
- EnergyLevel: LOW, MEDIUM, HIGH
- TaskPriority: LOW, MEDIUM, HIGH
- TaskStatus: TODO, DOING, DONE, CANCELED
