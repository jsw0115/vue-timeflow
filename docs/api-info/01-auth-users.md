# 인증·사용자·기기 API 상세 설계

2026-09-26 · 목표 /api/v1 · **서버 미구현** · 19개

[전체 목록](catalog.md) · [공통 규칙](00-conventions.md) · [오류 사전](errors.md) · [OpenAPI JSON](openapi.target.json)

## 업무 규칙

브라우저는 refresh를 HttpOnly/Secure/SameSite 쿠키로 전달합니다. refresh/logout에는 Origin 및 CSRF 검증이 필수입니다. 네이티브는 별도 경로와 OS 보안 저장소를 사용하며 public client의 client secret을 앱에 넣지 않습니다. 가입 비밀번호는 bcrypt의 72바이트 상한도 검증합니다. refresh 회전·재사용 탐지·비밀번호 변경 후 세션 폐기가 필요합니다. OAuth state/nonce/redirect URI/provider issuer를 서버에서 확인합니다.

## 빠른 이동

- [AUTH-01 이메일 회원가입](#auth-01)
- [AUTH-02 브라우저 로그인](#auth-02)
- [AUTH-03 브라우저 토큰 회전](#auth-03)
- [AUTH-04 브라우저 현재 세션 폐기](#auth-04)
- [AUTH-05 재설정 이메일 요청](#auth-05)
- [AUTH-06 비밀번호 재설정](#auth-06)
- [AUTH-07 내 프로필 조회](#auth-07)
- [AUTH-08 내 프로필 수정](#auth-08)
- [AUTH-09 최초 모드·시간대 설정](#auth-09)
- [SESSION-01 내 기기 세션 조회](#session-01)
- [SESSION-02 기기 세션 폐기](#session-02)
- [DEVICE-01 알림 수신 기기 등록](#device-01)
- [DEVICE-02 기기 등록 해제](#device-02)
- [OAUTH-01 브라우저 OAuth 코드 교환](#oauth-01)
- [OAUTH-02 OAuth 인증 시도 생성](#oauth-02)
- [NATIVE-01 네이티브 로그인](#native-01)
- [NATIVE-02 네이티브 토큰 회전](#native-02)
- [NATIVE-03 네이티브 세션 폐기](#native-03)
- [NATIVE-04 네이티브 OAuth 코드 교환](#native-04)

<a id="auth-01"></a>
## AUTH-01 · 이메일 회원가입

- 요청 URL: `https://api.example.test/api/v1/auth/signup` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: 공개 (빈도 제한)
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| nickname | string | 필수 | 닉네임 최소 1자; 최대 80자 |
| password | string | 필수 | 새 비밀번호 정책은 서버에서 검증; 비밀값 로깅 금지 최소 12자; 최대 72자 |
| consents | Consent[] | 필수 | TERMS/PRIVACY 각각 1개 필수, 중복 종류 거부 최대 3개 |
| consents[].type | string | 필수 | 동의 문서 종류 허용: TERMS, PRIVACY, MARKETING |
| consents[].version | string | 필수 | 문서 버전  |
| consents[].accepted | boolean | 필수 | 필수 약관은 true  |

```json
{
  "email": "demo@example.test",
  "nickname": "김지수",
  "password": "Example-Password-2026!",
  "consents": [
    {
      "type": "TERMS",
      "version": "2026-09",
      "accepted": true
    },
    {
      "type": "PRIVACY",
      "version": "2026-09",
      "accepted": true
    }
  ]
}
```

### 요청 예시

```http
POST /api/v1/auth/signup HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json

{
  "email": "demo@example.test",
  "nickname": "김지수",
  "password": "Example-Password-2026!",
  "consents": [
    {
      "type": "TERMS",
      "version": "2026-09",
      "accepted": true
    },
    {
      "type": "PRIVACY",
      "version": "2026-09",
      "accepted": true
    }
  ]
}
```

### 성공 응답

HTTP **201**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | SignupResult | 필수 | 하위 구조 참조  |
| data.userId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.emailVerificationRequired | boolean | 필수 | 이메일 검증 필요  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "userId": "01J00000000000000000000001",
    "emailVerificationRequired": true
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
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 409 | DUPLICATE_EMAIL | 정규화 이메일 중복 | 로그인/비밀번호 재설정 안내; 공개 메시지는 과도한 정보 제외 |

<a id="auth-02"></a>
## AUTH-02 · 브라우저 로그인

- 요청 URL: `https://api.example.test/api/v1/auth/login` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: 공개 (빈도 제한)
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| password | string | 필수 | 가입한 비밀번호 최소 1자; 최대 72자 |
| deviceId | string | 필수 | 설치별 임의 ID; 인증 수단이 아님 최소 1자; 최대 128자 |

```json
{
  "email": "demo@example.test",
  "password": "Example-Password-2026!",
  "deviceId": "01J00000000000000000000001"
}
```

### 요청 예시

```http
POST /api/v1/auth/login HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json

{
  "email": "demo@example.test",
  "password": "Example-Password-2026!",
  "deviceId": "01J00000000000000000000001"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Set-Cookie: tf_refresh HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth 및 읽기 가능한 tf_csrf Secure; SameSite=Lax; Path=/ (별도 Set-Cookie). native 응답에는 없음.

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Session | 필수 | 하위 구조 참조  |
| data.accessToken | string | 필수 | 예시 전용; 실제 토큰이 아님  |
| data.expiresIn | integer | 필수 | access 유효 초 최소 1; 최대 1000000 |
| data.sessionId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user | User | 필수 | 하위 구조 참조  |
| data.user.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user.email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| data.user.nickname | string | 필수 | 닉네임  |
| data.user.role | string | 필수 | 서버 지정 역할 허용: USER, ADMIN |
| data.user.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.user.onboarded | boolean | 필수 | 온보딩 완료  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "accessToken": "example-access-token",
    "expiresIn": 900,
    "sessionId": "01J00000000000000000000001",
    "user": {
      "id": "01J00000000000000000000001",
      "email": "demo@example.test",
      "nickname": "김지수",
      "role": "USER",
      "timezone": "Asia/Seoul",
      "onboarded": true
    }
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
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 401 | INVALID_CREDENTIALS | 이메일 또는 비밀번호 불일치 | 입력 확인; 어떤 항목이 틀렸는지 노출하지 않음 |

<a id="auth-03"></a>
## AUTH-03 · 브라우저 토큰 회전

- 요청 URL: `https://api.example.test/api/v1/auth/refresh` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: refresh 쿠키 + CSRF
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Cookie | 필수 | tf_refresh=&lt;refresh-token&gt;; 브라우저 자동 전송 |
| X-CSRF-Token | 필수 | 로그인 응답의 tf_csrf 쿠키와 일치; 예 example-csrf-token |
| Origin | 필수 | 서버 allowlist origin; 예 https://app.example.test |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
POST /api/v1/auth/refresh HTTP/1.1
Host: api.example.test
Accept: application/json
Cookie: tf_refresh=<refresh-token>
X-CSRF-Token: example-csrf-token
Origin: https://app.example.test
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Set-Cookie: tf_refresh HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth 및 읽기 가능한 tf_csrf Secure; SameSite=Lax; Path=/ (별도 Set-Cookie). native 응답에는 없음.

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Session | 필수 | 하위 구조 참조  |
| data.accessToken | string | 필수 | 예시 전용; 실제 토큰이 아님  |
| data.expiresIn | integer | 필수 | access 유효 초 최소 1; 최대 1000000 |
| data.sessionId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user | User | 필수 | 하위 구조 참조  |
| data.user.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user.email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| data.user.nickname | string | 필수 | 닉네임  |
| data.user.role | string | 필수 | 서버 지정 역할 허용: USER, ADMIN |
| data.user.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.user.onboarded | boolean | 필수 | 온보딩 완료  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "accessToken": "example-access-token",
    "expiresIn": 900,
    "sessionId": "01J00000000000000000000001",
    "user": {
      "id": "01J00000000000000000000001",
      "email": "demo@example.test",
      "nickname": "김지수",
      "role": "USER",
      "timezone": "Asia/Seoul",
      "onboarded": true
    }
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
| 403 | CSRF_REJECTED | Origin/CSRF token 불일치 | 등록된 브라우저 origin 및 CSRF 쿠키/헤더를 갱신 |

<a id="auth-04"></a>
## AUTH-04 · 브라우저 현재 세션 폐기

- 요청 URL: `https://api.example.test/api/v1/auth/logout` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: refresh 쿠키 + CSRF
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Cookie | 필수 | tf_refresh=&lt;refresh-token&gt;; 브라우저 자동 전송 |
| X-CSRF-Token | 필수 | 로그인 응답의 tf_csrf 쿠키와 일치; 예 example-csrf-token |
| Origin | 필수 | 서버 allowlist origin; 예 https://app.example.test |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
POST /api/v1/auth/logout HTTP/1.1
Host: api.example.test
Accept: application/json
Cookie: tf_refresh=<refresh-token>
X-CSRF-Token: example-csrf-token
Origin: https://app.example.test
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
| 403 | CSRF_REJECTED | Origin/CSRF token 불일치 | 등록된 브라우저 origin 및 CSRF 쿠키/헤더를 갱신 |

<a id="auth-05"></a>
## AUTH-05 · 재설정 이메일 요청

- 요청 URL: `https://api.example.test/api/v1/auth/password-reset-requests` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: 공개 (빈도 제한)
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| email | string (email) | 필수 | 정규화된 이메일 최대 255자 |

```json
{
  "email": "demo@example.test"
}
```

### 요청 예시

```http
POST /api/v1/auth/password-reset-requests HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json

{
  "email": "demo@example.test"
}
```

### 성공 응답

HTTP **202**. 접수 상태이며 완료 여부는 작업 조회 API로 확인합니다. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Location: 생성된 원본 또는 작업 상태 리소스 URL

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Accepted | 필수 | 하위 구조 참조  |
| data.accepted | boolean | 필수 | 처리 접수; 이메일 존재 여부 의미 아님  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "accepted": true
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
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 503 | UPSTREAM_UNAVAILABLE | 메일·푸시·AI·외부 캘린더 일시 장애 | 작업 상태 조회; 서버는 outbox 재시도, 중복 제출 금지 |

<a id="auth-06"></a>
## AUTH-06 · 비밀번호 재설정

- 요청 URL: `https://api.example.test/api/v1/auth/password-resets` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: 공개 (빈도 제한)
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| token | string | 필수 | 단회 재설정 토큰  |
| newPassword | string | 필수 | 새 비밀번호 정책은 서버에서 검증; 비밀값 로깅 금지 최소 12자; 최대 72자 |

```json
{
  "token": "example-reset-token",
  "newPassword": "Example-Password-2026!"
}
```

### 요청 예시

```http
POST /api/v1/auth/password-resets HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json

{
  "token": "example-reset-token",
  "newPassword": "Example-Password-2026!"
}
```

### 성공 응답

HTTP **204**. 응답 본문 없음. JSON 파싱하지 않습니다.

### 오류와 처리

| HTTP | code | 원인 | 클라이언트 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |

<a id="auth-07"></a>
## AUTH-07 · 내 프로필 조회

- 요청 URL: `https://api.example.test/api/v1/me` (예약 예시 도메인)
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
GET /api/v1/me HTTP/1.1
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
| data | User | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| data.nickname | string | 필수 | 닉네임  |
| data.role | string | 필수 | 서버 지정 역할 허용: USER, ADMIN |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.onboarded | boolean | 필수 | 온보딩 완료  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "email": "demo@example.test",
    "nickname": "김지수",
    "role": "USER",
    "timezone": "Asia/Seoul",
    "onboarded": true
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

<a id="auth-08"></a>
## AUTH-08 · 내 프로필 수정

- 요청 URL: `https://api.example.test/api/v1/me` (예약 예시 도메인)
- HTTP 메서드: **PATCH**
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
| nickname | string | 선택 | 닉네임 최소 1자; 최대 80자 |
| timezone | string | 선택 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |

```json
{
  "nickname": "김지수",
  "timezone": "Asia/Seoul"
}
```

### 요청 예시

```http
PATCH /api/v1/me HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "nickname": "김지수",
  "timezone": "Asia/Seoul"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | User | 필수 | 하위 구조 참조  |
| data.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| data.nickname | string | 필수 | 닉네임  |
| data.role | string | 필수 | 서버 지정 역할 허용: USER, ADMIN |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.onboarded | boolean | 필수 | 온보딩 완료  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000001",
    "email": "demo@example.test",
    "nickname": "김지수",
    "role": "USER",
    "timezone": "Asia/Seoul",
    "onboarded": true
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

<a id="auth-09"></a>
## AUTH-09 · 최초 모드·시간대 설정

- 요청 URL: `https://api.example.test/api/v1/me/onboarding` (예약 예시 도메인)
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
| mode | string | 필수 | 하루 모드 허용: J, P, B |
| timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| startScreen | string | 필수 | 시작 화면 허용: HOME, PLANNER, DIARY, TASKS |

```json
{
  "mode": "B",
  "timezone": "Asia/Seoul",
  "startScreen": "HOME"
}
```

### 요청 예시

```http
PUT /api/v1/me/onboarding HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "mode": "B",
  "timezone": "Asia/Seoul",
  "startScreen": "HOME"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Settings | 필수 | 하위 구조 참조  |
| data.mode | string | 필수 | 모드 허용: J, P, B |
| data.startScreen | string | 필수 | 시작 화면 허용: HOME, PLANNER, DIARY, TASKS |
| data.defaultVisibility | string | 필수 | 기본 공개범위 허용: PRIVATE, SHARED, PUBLIC |
| data.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.notifications | NotificationSettings | 필수 | 하위 구조 참조  |
| data.notifications.push | boolean | 필수 | 푸시 수신  |
| data.notifications.email | boolean | 필수 | 메일 수신  |
| data.notifications.inApp | boolean | 필수 | 인앱 수신  |
| data.notifications.quietStart | string / null | 필수 | 사용자 지역 시각 HH:mm; null 허용  |
| data.notifications.quietEnd | string / null | 필수 | 사용자 지역 시각 HH:mm; null 허용  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "mode": "B",
    "startScreen": "HOME",
    "defaultVisibility": "PRIVATE",
    "timezone": "Asia/Seoul",
    "notifications": {
      "push": true,
      "email": false,
      "inApp": true,
      "quietStart": null,
      "quietEnd": null
    }
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

<a id="session-01"></a>
## SESSION-01 · 내 기기 세션 조회

- 요청 URL: `https://api.example.test/api/v1/me/sessions` (예약 예시 도메인)
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
GET /api/v1/me/sessions HTTP/1.1
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
| data | DeviceSessionPage | 필수 | 하위 구조 참조  |
| data.items | DeviceSession[] | 필수 | 권한 범위의 목록 최대 100개 |
| data.items[].id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.items[].deviceName | string | 필수 | 기기 이름  |
| data.items[].platform | string | 필수 | 플랫폼 허용: WEB, ANDROID, IOS, DESKTOP |
| data.items[].lastUsedAt | string (date-time) | 필수 | 최근 사용  |
| data.items[].current | boolean | 필수 | 현재 세션  |
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
        "deviceName": "개발 PC",
        "platform": "WEB",
        "lastUsedAt": "2026-09-26T00:00:00Z",
        "current": true
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

<a id="session-02"></a>
## SESSION-02 · 기기 세션 폐기

- 요청 URL: `https://api.example.test/api/v1/me/sessions/{id}` (예약 예시 도메인)
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
DELETE /api/v1/me/sessions/01J00000000000000000000001 HTTP/1.1
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

<a id="device-01"></a>
## DEVICE-01 · 알림 수신 기기 등록

- 요청 URL: `https://api.example.test/api/v1/me/devices/{deviceId}` (예약 예시 도메인)
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
| path | deviceId | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| platform | string | 필수 | 플랫폼 허용: WEB, ANDROID, IOS, DESKTOP |
| pushToken | string / null | 필수 | 발급 푸시 토큰; 서버 내부 암호화; null 허용  |
| appVersion | string | 필수 | 클라이언트 버전 최대 32자 |

```json
{
  "platform": "WEB",
  "pushToken": null,
  "appVersion": "0.1.0"
}
```

### 요청 예시

```http
PUT /api/v1/me/devices/01J00000000000000000000001 HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "platform": "WEB",
  "pushToken": null,
  "appVersion": "0.1.0"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | DeviceResult | 필수 | 하위 구조 참조  |
| data.deviceId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.platform | string | 필수 | 플랫폼 허용: WEB, ANDROID, IOS, DESKTOP |
| data.registered | boolean | 필수 | 등록 여부  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "deviceId": "01J00000000000000000000001",
    "platform": "WEB",
    "registered": true
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

<a id="device-02"></a>
## DEVICE-02 · 기기 등록 해제

- 요청 URL: `https://api.example.test/api/v1/me/devices/{deviceId}` (예약 예시 도메인)
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
| path | deviceId | string | 예 | 원본/대상 리소스 ID; 소유권 서버 재검증; 최소 1자; 최대 128자 |

### 요청 본문

없음. 빈 JSON 본문을 보낼 필요가 없습니다.

### 요청 예시

```http
DELETE /api/v1/me/devices/01J00000000000000000000001 HTTP/1.1
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

<a id="oauth-01"></a>
## OAUTH-01 · 브라우저 OAuth 코드 교환

- 요청 URL: `https://api.example.test/api/v1/auth/oauth/{provider}/exchange` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: 공개 (빈도 제한)
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | provider | string | 예 | 사전 등록한 OAuth 제공자; 허용: GOOGLE, APPLE, KAKAO |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| authorizationCode | string | 필수 | 서버에서 1회 교환  |
| codeVerifier | string | 필수 | PKCE verifier; S256 사용 최소 43자; 최대 128자 |
| state | string | 필수 | 서버 발급 세션에 묶인 state  |
| redirectUri | string (uri) | 필수 | 등록된 redirect URI와 정확히 일치  |

```json
{
  "authorizationCode": "example-code",
  "codeVerifier": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
  "state": "example-state",
  "redirectUri": "https://app.example.test/auth/callback"
}
```

### 요청 예시

```http
POST /api/v1/auth/oauth/GOOGLE/exchange HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json

{
  "authorizationCode": "example-code",
  "codeVerifier": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
  "state": "example-state",
  "redirectUri": "https://app.example.test/auth/callback"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID
- Set-Cookie: tf_refresh HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth 및 읽기 가능한 tf_csrf Secure; SameSite=Lax; Path=/ (별도 Set-Cookie). native 응답에는 없음.

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | Session | 필수 | 하위 구조 참조  |
| data.accessToken | string | 필수 | 예시 전용; 실제 토큰이 아님  |
| data.expiresIn | integer | 필수 | access 유효 초 최소 1; 최대 1000000 |
| data.sessionId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user | User | 필수 | 하위 구조 참조  |
| data.user.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user.email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| data.user.nickname | string | 필수 | 닉네임  |
| data.user.role | string | 필수 | 서버 지정 역할 허용: USER, ADMIN |
| data.user.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.user.onboarded | boolean | 필수 | 온보딩 완료  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "accessToken": "example-access-token",
    "expiresIn": 900,
    "sessionId": "01J00000000000000000000001",
    "user": {
      "id": "01J00000000000000000000001",
      "email": "demo@example.test",
      "nickname": "김지수",
      "role": "USER",
      "timezone": "Asia/Seoul",
      "onboarded": true
    }
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
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |

<a id="oauth-02"></a>
## OAUTH-02 · OAuth 인증 시도 생성

- 요청 URL: `https://api.example.test/api/v1/auth/oauth/authorizations` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: 공개 (빈도 제한)
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| provider | string | 필수 | 등록된 provider 허용: GOOGLE, APPLE, KAKAO |
| redirectUri | string (uri) | 필수 | 등록된 URI  |
| codeChallenge | string | 필수 | S256 base64url PKCE challenge 최소 43자; 최대 128자 |

```json
{
  "provider": "GOOGLE",
  "redirectUri": "https://app.example.test/auth/callback",
  "codeChallenge": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ"
}
```

### 요청 예시

```http
POST /api/v1/auth/oauth/authorizations HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json

{
  "provider": "GOOGLE",
  "redirectUri": "https://app.example.test/auth/callback",
  "codeChallenge": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | OAuthStartResult | 필수 | 하위 구조 참조  |
| data.authorizationUrl | string (uri) | 필수 | allowlist provider 인증 페이지  |
| data.state | string | 필수 | 10분 이내 사용, 서버 보관  |
| data.expiresAt | string (date-time) | 필수 | 만료  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://provider.example.test/authorize",
    "state": "example-state",
    "expiresAt": "2026-09-26T00:10:00Z"
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
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |

<a id="native-01"></a>
## NATIVE-01 · 네이티브 로그인

- 요청 URL: `https://api.example.test/api/v1/auth/native/login` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: 공개 (빈도 제한)
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| password | string | 필수 | 가입한 비밀번호 최소 1자; 최대 72자 |
| deviceId | string | 필수 | 설치별 임의 ID; 인증 수단이 아님 최소 1자; 최대 128자 |

```json
{
  "email": "demo@example.test",
  "password": "Example-Password-2026!",
  "deviceId": "01J00000000000000000000001"
}
```

### 요청 예시

```http
POST /api/v1/auth/native/login HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json

{
  "email": "demo@example.test",
  "password": "Example-Password-2026!",
  "deviceId": "01J00000000000000000000001"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | NativeSession | 필수 | 하위 구조 참조  |
| data.accessToken | string | 필수 | 예시 전용; 실제 토큰이 아님  |
| data.expiresIn | integer | 필수 | access 유효 초 최소 1; 최대 1000000 |
| data.sessionId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user | User | 필수 | 하위 구조 참조  |
| data.user.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user.email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| data.user.nickname | string | 필수 | 닉네임  |
| data.user.role | string | 필수 | 서버 지정 역할 허용: USER, ADMIN |
| data.user.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.user.onboarded | boolean | 필수 | 온보딩 완료  |
| data.refreshToken | string | 필수 | OS 보안 저장소에 보관; 로그 금지  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "accessToken": "example-access-token",
    "expiresIn": 900,
    "sessionId": "01J00000000000000000000001",
    "user": {
      "id": "01J00000000000000000000001",
      "email": "demo@example.test",
      "nickname": "김지수",
      "role": "USER",
      "timezone": "Asia/Seoul",
      "onboarded": true
    },
    "refreshToken": "example-refresh-token"
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
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 401 | INVALID_CREDENTIALS | 이메일 또는 비밀번호 불일치 | 입력 확인; 어떤 항목이 틀렸는지 노출하지 않음 |

<a id="native-02"></a>
## NATIVE-02 · 네이티브 토큰 회전

- 요청 URL: `https://api.example.test/api/v1/auth/native/refresh` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: 공개 (빈도 제한)
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| refreshToken | string | 필수 | OS 보안 저장소의 refresh credential 최소 1자 |

```json
{
  "refreshToken": "example-refresh-token"
}
```

### 요청 예시

```http
POST /api/v1/auth/native/refresh HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json

{
  "refreshToken": "example-refresh-token"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | NativeSession | 필수 | 하위 구조 참조  |
| data.accessToken | string | 필수 | 예시 전용; 실제 토큰이 아님  |
| data.expiresIn | integer | 필수 | access 유효 초 최소 1; 최대 1000000 |
| data.sessionId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user | User | 필수 | 하위 구조 참조  |
| data.user.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user.email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| data.user.nickname | string | 필수 | 닉네임  |
| data.user.role | string | 필수 | 서버 지정 역할 허용: USER, ADMIN |
| data.user.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.user.onboarded | boolean | 필수 | 온보딩 완료  |
| data.refreshToken | string | 필수 | OS 보안 저장소에 보관; 로그 금지  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "accessToken": "example-access-token",
    "expiresIn": 900,
    "sessionId": "01J00000000000000000000001",
    "user": {
      "id": "01J00000000000000000000001",
      "email": "demo@example.test",
      "nickname": "김지수",
      "role": "USER",
      "timezone": "Asia/Seoul",
      "onboarded": true
    },
    "refreshToken": "example-refresh-token"
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
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |

<a id="native-03"></a>
## NATIVE-03 · 네이티브 세션 폐기

- 요청 URL: `https://api.example.test/api/v1/auth/native/logout` (예약 예시 도메인)
- HTTP 메서드: **POST**
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
| refreshToken | string | 필수 | OS 보안 저장소의 refresh credential 최소 1자 |

```json
{
  "refreshToken": "example-refresh-token"
}
```

### 요청 예시

```http
POST /api/v1/auth/native/logout HTTP/1.1
Host: api.example.test
Accept: application/json
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "example-refresh-token"
}
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
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |

<a id="native-04"></a>
## NATIVE-04 · 네이티브 OAuth 코드 교환

- 요청 URL: `https://api.example.test/api/v1/auth/native/oauth/{provider}/exchange` (예약 예시 도메인)
- HTTP 메서드: **POST**
- 인증·인가: 공개 (빈도 제한)
- 구현 상태: PLANNED; 현재 /api와 호환되지 않음

### 요청 헤더

| 헤더 | 필수 | 값·설명 |
|---|---|---|
| Accept | 권장 | application/json |
| Content-Type | 필수 | application/json; charset=utf-8 |
| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |

### 경로·쿼리 파라미터

| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |
|---|---|---|---|---|
| path | provider | string | 예 | 사전 등록한 OAuth 제공자; 허용: GOOGLE, APPLE, KAKAO |

### 요청 본문

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| authorizationCode | string | 필수 | 서버에서 1회 교환  |
| codeVerifier | string | 필수 | PKCE verifier; S256 사용 최소 43자; 최대 128자 |
| state | string | 필수 | 서버 발급 세션에 묶인 state  |
| redirectUri | string (uri) | 필수 | 등록된 redirect URI와 정확히 일치  |

```json
{
  "authorizationCode": "example-code",
  "codeVerifier": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
  "state": "example-state",
  "redirectUri": "https://app.example.test/auth/callback"
}
```

### 요청 예시

```http
POST /api/v1/auth/native/oauth/GOOGLE/exchange HTTP/1.1
Host: api.example.test
Accept: application/json
Content-Type: application/json

{
  "authorizationCode": "example-code",
  "codeVerifier": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
  "state": "example-state",
  "redirectUri": "https://app.example.test/auth/callback"
}
```

### 성공 응답

HTTP **200**. 응답 헤더 및 구조는 아래와 같습니다.

- X-Request-Id: 서버 추적 ID

| 필드 | 타입 | 필수 여부 | 의미·제약 |
|---|---|---|---|
| success | boolean | 필수 | 하위 구조 참조  |
| data | NativeSession | 필수 | 하위 구조 참조  |
| data.accessToken | string | 필수 | 예시 전용; 실제 토큰이 아님  |
| data.expiresIn | integer | 필수 | access 유효 초 최소 1; 최대 1000000 |
| data.sessionId | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user | User | 필수 | 하위 구조 참조  |
| data.user.id | string | 필수 | 불투명 리소스 ID; 숫자로 변환하지 않음 최소 1자; 최대 128자 |
| data.user.email | string (email) | 필수 | 정규화된 이메일 최대 255자 |
| data.user.nickname | string | 필수 | 닉네임  |
| data.user.role | string | 필수 | 서버 지정 역할 허용: USER, ADMIN |
| data.user.timezone | string | 필수 | 유효한 IANA ZoneId; 사용자 설정 기본값 최대 64자 |
| data.user.onboarded | boolean | 필수 | 온보딩 완료  |
| data.refreshToken | string | 필수 | OS 보안 저장소에 보관; 로그 금지  |
| message | string,null | 필수 | 하위 구조 참조  |
| meta | Meta | 필수 | 하위 구조 참조  |
| meta.requestId | string | 필수 | 추적 ID  |
| meta.serverTime | string (date-time) | 필수 | 서버 UTC  |

```json
{
  "success": true,
  "data": {
    "accessToken": "example-access-token",
    "expiresIn": 900,
    "sessionId": "01J00000000000000000000001",
    "user": {
      "id": "01J00000000000000000000001",
      "email": "demo@example.test",
      "nickname": "김지수",
      "role": "USER",
      "timezone": "Asia/Seoul",
      "onboarded": true
    },
    "refreshToken": "example-refresh-token"
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
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
