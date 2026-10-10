# API 상세 명세

공통 응답·동시성·시간·기능별 동작은 [기능 규약](README.md)을 따른다. 아래 요청 필드는 실제 컨트롤러·FeatureInput·Java DTO에서 생성하며 조건부 검증은 각 schema 설명과 규약을 함께 적용한다. 예전 /api/v1 목표 계약과 혼용하지 않는다.

## GET /api/admin/audit

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |
| query | q | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/admin/billing/{id}/refund

인증은 JWT + ADMIN이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/admin/billing/{id}/retry

인증은 JWT + ADMIN이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/admin/content

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |
| query | q | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/admin/content

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string | 예 | 길이 ≤ 20000 |
| kind | string | 예 | 길이 ≤ 200 |
| where | string 또는 null | 아니오 | 기능 규약 참조 |
| live | boolean 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/admin/content/{id}

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/admin/content/{id}

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string | 예 | 길이 ≤ 20000 |
| kind | string | 예 | 길이 ≤ 200 |
| where | string 또는 null | 아니오 | 기능 규약 참조 |
| live | boolean 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/admin/moderation

인증은 JWT + ADMIN이며 소스는 ModerationController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/admin/moderation/{id}

인증은 JWT + ADMIN이며 소스는 ModerationController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| userId | string | 예 | 길이 ≤ 36 |
| version | integer | 예 | 최소 1 |
| action | string | 예 | REMOVE/IGNORE |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/admin/monitoring

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/admin/notices

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |
| query | q | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/admin/notices

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string | 예 | 길이 ≤ 20000 |
| from | string 또는 null | 아니오 | 기능 규약 참조 |
| to | string 또는 null | 아니오 | 기능 규약 참조 |
| published | boolean 또는 null | 아니오 | 기능 규약 참조 |
| popup | boolean 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/admin/notices/{id}

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/admin/notices/{id}

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string | 예 | 길이 ≤ 20000 |
| from | string 또는 null | 아니오 | 기능 규약 참조 |
| to | string 또는 null | 아니오 | 기능 규약 참조 |
| published | boolean 또는 null | 아니오 | 기능 규약 참조 |
| popup | boolean 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/admin/settings

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/admin/settings

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| value | object 또는 array | 예 | 기능 규약 참조 |
| version | integer | 아니오 | 최소 1 |

JSON 최대 깊이 8, 객체 100필드, 배열 500항목, 저장 크기 128 KiB. apiKey/password/secret/cardNumber/accessToken/refreshToken은 중첩 위치에서도 거부한다. 자동화·AI 설정 저장은 실행을 의미하지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/admin/stats

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/admin/tickets

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/admin/tickets/{id}

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| userId | string | 예 | 길이 ≤ 36 |
| version | integer | 예 | 최소 1 |
| reply | string | 아니오 | 길이 ≤ 20000 |
| status | string | 예 | OPEN/IN_PROGRESS/ANSWERED/HOLD |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/admin/users

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | q | String | 아니오 | 없음 |
| query | role | String | 아니오 | 없음 |
| query | status | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/admin/users

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| email | string | 예 | email · 길이 ≤ 200 |
| nickname | string | 예 | 길이 ≤ 80 |
| password | string | 예 | 길이 ≤ 72 |
| role | string | 아니오 | USER/ADMIN |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/admin/users/{id}

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/admin/users/{id}

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/admin/users/{id}

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| nickname | string | 아니오 | 길이 ≤ 80 |
| role | string | 아니오 | USER/ADMIN |
| status | string | 아니오 | ACTIVE/SUSPENDED/DELETED |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/admin/users/{id}/force-logout

인증은 JWT + ADMIN이며 소스는 AdminController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/attachments

인증은 JWT이며 소스는 AttachmentController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | groupId | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/attachments

인증은 JWT이며 소스는 AttachmentController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | retentionDays | int | 아니오 | 30 |
| query | groupId | String | 아니오 | 없음 |
| query | domain | String | 아니오 | memo |

file을 multipart/form-data로 전달한다. boundary는 HTTP 클라이언트가 지정한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/attachments/{id}

인증은 JWT이며 소스는 AttachmentController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/attachments/{id}/download

인증은 JWT이며 소스는 AttachmentController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/attachments/{id}/retention

인증은 JWT이며 소스는 AttachmentController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| days | integer | 예 | 최소 0 · 최대 365 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/attachments/purge-expired

인증은 JWT이며 소스는 AttachmentController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/auth/login

인증은 공개이며 소스는 AuthController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| email | string | 예 | email |
| password | string | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/auth/logout

인증은 JWT이며 소스는 AuthController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| refreshToken | string | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/auth/me

인증은 JWT이며 소스는 AuthController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/auth/refresh

인증은 공개이며 소스는 AuthController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| refreshToken | string | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/auth/signup

인증은 공개이며 소스는 AuthController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| email | string | 예 | email |
| nickname | string | 예 | 기능 규약 참조 |
| password | string | 예 | 기능 규약 참조 |
| agreeTerms | boolean | 예 | 기능 규약 참조 |
| agreePrivacy | boolean | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/billing/cancel

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| reason | string | 아니오 | 길이 ≤ 200 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/billing/checkout

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| planId | string | 아니오 | 길이 ≤ 200 |
| returnUrl | string | 아니오 | 길이 ≤ 200 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/events

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | authorization | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/mentions

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | before | String | 아니오 | 없음 |
| query | unread | boolean | 아니오 | false |
| query | limit | int | 아니오 | 50 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/chat/mentions/{messageId}/read

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | messageId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/people

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | email | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/presence

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | userIds | List<String> | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/chat/presence

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 204다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| clientId | string | 예 | 기능 규약 참조 |
| active | boolean | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/rooms

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | before | String | 아니오 | 없음 |
| query | limit | int | 아니오 | 50 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/chat/rooms

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| kind | string | 예 | 기능 규약 참조 |
| name | string 또는 null | 아니오 | 기능 규약 참조 |
| memberIds | array | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/rooms/{id}

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/chat/rooms/{id}/members/me

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/rooms/{id}/messages

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | before | Long | 아니오 | 없음 |
| query | after | Long | 아니오 | 없음 |
| query | tag | String | 아니오 | 없음 |
| query | limit | int | 아니오 | 50 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/chat/rooms/{id}/messages

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| clientMessageId | string | 예 | 기능 규약 참조 |
| body | string | 예 | 길이 ≤ 4000 |
| mentionUserIds | array | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/chat/rooms/{id}/owner

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| userId | string | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/chat/rooms/{id}/read

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| sequence | integer | 예 | 최소 0 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/chat/rooms/{id}/typing

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/search

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | q | String | 예 | 없음 |
| query | roomId | String | 아니오 | 없음 |
| query | before | String | 아니오 | 없음 |
| query | limit | int | 아니오 | 50 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/tagged-messages

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | tag | String | 예 | 없음 |
| query | before | String | 아니오 | 없음 |
| query | limit | int | 아니오 | 50 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/tags

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | after | String | 아니오 | 없음 |
| query | limit | int | 아니오 | 50 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/cofocus/rooms

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 아니오 | 길이 ≤ 200 |
| recordingConsent | boolean | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/communities

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | q | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/communities

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| desc | string 또는 null | 아니오 | 기능 규약 참조 |
| emoji | string 또는 null | 아니오 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| joinPolicy | string | 예 | open/approval |
| visibility | string | 예 | public/private |
| capacity | integer | 예 | 최소 2 · 최대 500 |
| deadline | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/communities/{id}

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/communities/{id}

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/communities/{id}

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| desc | string 또는 null | 아니오 | 기능 규약 참조 |
| emoji | string 또는 null | 아니오 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| joinPolicy | string | 예 | open/approval |
| visibility | string | 예 | public/private |
| capacity | integer | 예 | 최소 2 · 최대 500 |
| deadline | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/communities/{id}/challenges

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/communities/{id}/challenges

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| desc | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string | 예 | date |
| days | integer | 예 | 최소 3 · 최대 100 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/communities/{id}/challenges/{challengeId}/checkins/{date}

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | challengeId | String | 예 | 없음 |
| path | date | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/communities/{id}/challenges/{challengeId}/join

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | challengeId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/communities/{id}/challenges/{challengeId}/ranking

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | challengeId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/communities/{id}/join

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| message | string | 아니오 | 길이 ≤ 2000 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/communities/{id}/join-requests

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/communities/{id}/join-requests/{userId}

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | userId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| approved | boolean | 예 | 기능 규약 참조 |
| reason | string | 아니오 | 길이 ≤ 2000 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/communities/{id}/members

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/communities/{id}/members

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| userId | string | 예 | 길이 ≤ 36 |
| role | string | 아니오 | viewer/editor |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/communities/{id}/members/{userId}

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | userId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/communities/{id}/posts

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/communities/{id}/posts

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string 또는 null | 아니오 | 기능 규약 참조 |
| body | string | 예 | 길이 ≤ 20000 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/communities/{id}/posts/{postId}

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | postId | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/communities/{id}/posts/{postId}

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | postId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string 또는 null | 아니오 | 기능 규약 참조 |
| body | string | 예 | 길이 ≤ 20000 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/communities/{id}/posts/{postId}/comments

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | postId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/communities/{id}/posts/{postId}/comments

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | postId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| body | string | 예 | 길이 ≤ 20000 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/communities/{id}/posts/{postId}/like

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | postId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| liked | boolean | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/communities/{id}/posts/{postId}/report

인증은 JWT이며 소스는 ModerationController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | postId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| reason | string | 예 | 길이 ≤ 200 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/contacts

인증은 JWT이며 소스는 ContactsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/contacts

인증은 JWT이며 소스는 ContactsController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| name | string | 예 | 길이 ≤ 200 |
| relation | string 또는 null | 아니오 | 기능 규약 참조 |
| email | string 또는 null | 아니오 | 기능 규약 참조 |
| favorite | boolean 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/contacts/{id}

인증은 JWT이며 소스는 ContactsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/contacts/{id}

인증은 JWT이며 소스는 ContactsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/contacts/{id}

인증은 JWT이며 소스는 ContactsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| name | string | 예 | 길이 ≤ 200 |
| relation | string 또는 null | 아니오 | 기능 규약 참조 |
| email | string 또는 null | 아니오 | 기능 규약 참조 |
| favorite | boolean 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/content

인증은 JWT이며 소스는 SupportController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/ddays

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/ddays

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| pinned | boolean 또는 null | 아니오 | 기능 규약 참조 |
| notifyDays | array 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/ddays/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/ddays/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/ddays/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| pinned | boolean 또는 null | 아니오 | 기능 규약 참조 |
| notifyDays | array 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/diaries

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/diaries

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| mood | string 또는 null | 아니오 | 기능 규약 참조 |
| tags | array 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/diaries/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/diaries/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/diaries/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| mood | string 또는 null | 아니오 | 기능 규약 참조 |
| tags | array 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/diary/{date}

인증은 JWT이며 소스는 EventDiaryMemoController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | date | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/diary/{date}

인증은 JWT이며 소스는 EventDiaryMemoController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | date | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/diary/{date}

인증은 JWT이며 소스는 EventDiaryMemoController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | date | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 아니오 | date |
| mood | string 또는 null | 아니오 | 기능 규약 참조 |
| tags | array 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 아니오 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/diary/calendar

인증은 JWT이며 소스는 EventDiaryMemoController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | year | int | 예 | 없음 |
| query | month | int | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/events

인증은 JWT이며 소스는 EventController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | LocalDate | 아니오 | 없음 |
| query | to | LocalDate | 아니오 | 없음 |
| query | keyword | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/events

인증은 JWT이며 소스는 EventController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| startTime | string 또는 null | 아니오 | 기능 규약 참조 |
| endTime | string 또는 null | 아니오 | 기능 규약 참조 |
| location | string 또는 null | 아니오 | 기능 규약 참조 |
| visibility | string 또는 null | 아니오 | 기능 규약 참조 |
| note | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/events/{eventId}

인증은 JWT이며 소스는 EventController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | eventId | Long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/events/{eventId}

인증은 JWT이며 소스는 EventController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | eventId | Long | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| startTime | string 또는 null | 아니오 | 기능 규약 참조 |
| endTime | string 또는 null | 아니오 | 기능 규약 참조 |
| location | string 또는 null | 아니오 | 기능 규약 참조 |
| visibility | string 또는 null | 아니오 | 기능 규약 참조 |
| note | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/events/{eventId}/following

인증은 JWT이며 소스는 EventController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | eventId | Long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/events/{eventId}/following

인증은 JWT이며 소스는 EventController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | eventId | Long | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| startTime | string 또는 null | 아니오 | 기능 규약 참조 |
| endTime | string 또는 null | 아니오 | 기능 규약 참조 |
| location | string 또는 null | 아니오 | 기능 규약 참조 |
| visibility | string 또는 null | 아니오 | 기능 규약 참조 |
| note | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/events/recurring

인증은 JWT이며 소스는 EventController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string | 예 | date |
| until | string | 예 | date |
| freq | string | 예 | DAILY/WEEKLY/MONTHLY/YEARLY |
| startTime | string 또는 null | 아니오 | 기능 규약 참조 |
| endTime | string 또는 null | 아니오 | 기능 규약 참조 |
| location | string 또는 null | 아니오 | 기능 규약 참조 |
| visibility | string 또는 null | 아니오 | 기능 규약 참조 |
| note | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/events/templates

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/events/templates

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| color | string 또는 null | 아니오 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| duration | integer | 예 | 최소 1 · 최대 1440 |
| repeat | string 또는 null | 아니오 | 기능 규약 참조 |
| alarm | integer 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/events/templates/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/events/templates/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/events/templates/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| color | string 또는 null | 아니오 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| duration | integer | 예 | 최소 1 · 최대 1440 |
| repeat | string 또는 null | 아니오 | 기능 규약 참조 |
| alarm | integer 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/events/templates/{id}/apply

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| date | string | 예 | date |
| startTime | string | 예 | 길이 ≤ 5 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/focus/sessions

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/focus/sessions

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| date | string | 예 | date |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| mode | string | 예 | pomodoro/stopwatch/free |
| duration | integer | 예 | 최소 1 · 최대 1440 |
| startedAt | string | 예 | date-time |
| endedAt | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/focus/sessions/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/focus/sessions/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/focus/sessions/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| date | string | 예 | date |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| mode | string | 예 | pomodoro/stopwatch/free |
| duration | integer | 예 | 최소 1 · 최대 1440 |
| startedAt | string | 예 | date-time |
| endedAt | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/home/summary

인증은 JWT이며 소스는 InsightController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | date | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/insight/generate

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| from | string | 아니오 | date |
| to | string | 아니오 | date |
| features | array | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/integrations/capabilities

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/memos

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/memos

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string 또는 null | 아니오 | 기능 규약 참조 |
| color | string 또는 null | 아니오 | 기능 규약 참조 |
| actionable | boolean 또는 null | 아니오 | 기능 규약 참조 |
| tags | array 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/memos/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/memos/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/memos/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string 또는 null | 아니오 | 기능 규약 참조 |
| color | string 또는 null | 아니오 | 기능 규약 참조 |
| actionable | boolean 또는 null | 아니오 | 기능 규약 참조 |
| tags | array 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/memos/{id}/convert-to-task

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| version | integer | 예 | 최소 1 |
| due | string | 아니오 | date |
| category | string | 아니오 | 길이 ≤ 200 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/memos/stt

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

file을 multipart/form-data로 전달한다. boundary는 HTTP 클라이언트가 지정한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/money/entries

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/money/entries

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| amount | integer | 예 | 최소 -1000000000000 · 최대 1000000000000 |
| type | string | 예 | in/out |
| category | string 또는 null | 아니오 | 기능 규약 참조 |

KRW 정수. type=in은 양수, out은 음수. 0은 거부한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/money/entries/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/money/entries/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/money/entries/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| amount | integer | 예 | 최소 -1000000000000 · 최대 1000000000000 |
| type | string | 예 | in/out |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

KRW 정수. type=in은 양수, out은 음수. 0은 거부한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/money/summary

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/notices

인증은 JWT이며 소스는 SupportController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/notifications

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |
| query | q | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/notifications/{id}

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/notifications/{id}/read

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/notifications/read-all

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/canvas

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/planner/canvas

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| columns | array | 예 | 기능 규약 참조 |
| cards | array | 예 | 기능 규약 참조 |
| version | integer | 아니오 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/daily

인증은 JWT이며 소스는 PlannerViewController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | date | LocalDate | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/items

인증은 JWT이며 소스는 PlannerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | date | LocalDate | 아니오 | 없음 |
| query | type | PlannerItem.ItemType | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | status | PlannerItem.ItemStatus | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/items

인증은 JWT이며 소스는 PlannerController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| id | integer 또는 null | 아니오 | 기능 규약 참조 |
| type | string | 예 | EVENT/TASK/ROUTINE/DIARY/MEMO/ACTUAL |
| title | string | 예 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string 또는 null | 아니오 | 기능 규약 참조 |
| startTime | string 또는 null | 아니오 | 기능 규약 참조 |
| endTime | string 또는 null | 아니오 | 기능 규약 참조 |
| status | string 또는 null | 아니오 | 기능 규약 참조 |
| dday | boolean | 아니오 | 기능 규약 참조 |
| note | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/planner/items/{id}

인증은 JWT이며 소스는 PlannerController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/planner/items/{id}

인증은 JWT이며 소스는 PlannerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | long | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| id | integer 또는 null | 아니오 | 기능 규약 참조 |
| type | string | 예 | EVENT/TASK/ROUTINE/DIARY/MEMO/ACTUAL |
| title | string | 예 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string 또는 null | 아니오 | 기능 규약 참조 |
| startTime | string 또는 null | 아니오 | 기능 규약 참조 |
| endTime | string 또는 null | 아니오 | 기능 규약 참조 |
| status | string 또는 null | 아니오 | 기능 규약 참조 |
| dday | boolean | 아니오 | 기능 규약 참조 |
| note | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PATCH /api/planner/items/{id}/status

인증은 JWT이며 소스는 PlannerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | long | 예 | 없음 |
| query | status | PlannerItem.ItemStatus | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/monthly

인증은 JWT이며 소스는 PlannerViewController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | year | int | 예 | 없음 |
| query | month | int | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/preferences

인증은 JWT이며 소스는 PlannerPreferenceController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/planner/preferences

인증은 JWT이며 소스는 PlannerPreferenceController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| defaultView | string | 예 | DAILY/WEEKLY/MONTHLY/YEARLY |
| version | integer | 예 | 최소 0 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/planner/reviews/{date}

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | date | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/reviews/{date}

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | date | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/planner/reviews/{date}

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | date | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| body | string | 예 | 길이 ≤ 20000 |
| date | string | 아니오 | date |
| version | integer | 아니오 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/templates

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/templates

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| color | string 또는 null | 아니오 | 기능 규약 참조 |
| blocks | array | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/planner/templates/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/templates/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/planner/templates/{id}

인증은 JWT이며 소스는 RecordsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| color | string 또는 null | 아니오 | 기능 규약 참조 |
| blocks | array | 예 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/templates/{id}/apply

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| date | string | 예 | date |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/upcoming

인증은 JWT이며 소스는 PlannerViewController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | days | int | 아니오 | 7 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/weekly

인증은 JWT이며 소스는 PlannerViewController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | start | LocalDate | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/yearly

인증은 JWT이며 소스는 PlannerViewController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | year | int | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/public/portfolios/{token}

인증은 공개이며 소스는 PortfolioLinkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | token | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/reports/{reportKey}

인증은 JWT이며 소스는 ReportController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | reportKey | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/reports/{reportKey}

인증은 JWT이며 소스는 ReportController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | reportKey | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| date | string | 예 | date |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| parentId | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 아니오 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/reports/{reportKey}/sub-reports

인증은 JWT이며 소스는 ReportController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | reportKey | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/reports/draft

인증은 JWT이며 소스는 ReportController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| date | string | 예 | date |
| category | string | 아니오 | 길이 ≤ 200 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/reports/time-blocks

인증은 JWT이며 소스는 ReportController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | date | String | 예 | 없음 |
| query | categoryName | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/routine-records

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |
| query | q | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/routine-records

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string | 예 | date |
| time | string | 예 | 길이 ≤ 200 |
| duration | integer | 예 | 최소 1 · 최대 1440 |
| days | array | 예 | 기능 규약 참조 |
| goal | Goal | 예 | 기능 규약 참조 |
| notify | boolean 또는 null | 아니오 | 기능 규약 참조 |
| reminderMinutes | integer 또는 null | 아니오 | 기능 규약 참조 |
| paused | boolean 또는 null | 아니오 | 기능 규약 참조 |
| recurrence | Recurrence 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/routine-records/{id}

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/routine-records/{id}

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/routine-records/{id}

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string | 예 | date |
| time | string | 예 | 길이 ≤ 200 |
| duration | integer | 예 | 최소 1 · 최대 1440 |
| days | array | 예 | 기능 규약 참조 |
| goal | Goal | 예 | 기능 규약 참조 |
| notify | boolean 또는 null | 아니오 | 기능 규약 참조 |
| reminderMinutes | integer 또는 null | 아니오 | 기능 규약 참조 |
| paused | boolean 또는 null | 아니오 | 기능 규약 참조 |
| recurrence | Recurrence 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/routine-records/{id}/history

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | from | String | 예 | 없음 |
| query | to | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/routine-records/{id}/history/{date}

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | date | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| completed | boolean | 예 | 기능 규약 참조 |
| version | integer | 아니오 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/routines

인증은 JWT이며 소스는 RoutineController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/routines

인증은 JWT이며 소스는 RoutineController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| name | string | 예 | 기능 규약 참조 |
| atTime | string | 예 | 기능 규약 참조 |
| days | string 또는 null | 아니오 | 기능 규약 참조 |
| icon | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryId | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryName | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryColor | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryIcon | string 또는 null | 아니오 | 기능 규약 참조 |
| onoff | boolean | 아니오 | 기능 규약 참조 |
| notifyEnabled | boolean | 아니오 | 기능 규약 참조 |
| notifyMinutesBefore | integer 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/routines/{routineId}

인증은 JWT이며 소스는 RoutineController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/routines/{routineId}

인증은 JWT이며 소스는 RoutineController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| name | string | 예 | 기능 규약 참조 |
| atTime | string | 예 | 기능 규약 참조 |
| days | string 또는 null | 아니오 | 기능 규약 참조 |
| icon | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryId | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryName | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryColor | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryIcon | string 또는 null | 아니오 | 기능 규약 참조 |
| onoff | boolean | 아니오 | 기능 규약 참조 |
| notifyEnabled | boolean | 아니오 | 기능 규약 참조 |
| notifyMinutesBefore | integer 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/routines/{routineId}/history

인증은 JWT이며 소스는 RoutineController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |
| query | days | int | 아니오 | 30 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/routines/{routineId}/history/{date}

인증은 JWT이며 소스는 RoutineController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |
| path | date | LocalDate | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PATCH /api/routines/{routineId}/history/{date}/toggle

인증은 JWT이며 소스는 RoutineController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | routineId | String | 예 | 없음 |
| path | date | LocalDate | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| status | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/routines/quick

인증은 JWT이며 소스는 RoutineController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| name | string | 예 | 기능 규약 참조 |
| atTime | string | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/schedules

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |
| query | q | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/schedules

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string | 예 | date |
| endDate | string | 예 | date |
| startTime | string | 예 | 길이 ≤ 200 |
| endTime | string | 예 | 길이 ≤ 200 |
| color | string 또는 null | 아니오 | 기능 규약 참조 |
| attendeeIds | array 또는 null | 아니오 | 기능 규약 참조 |
| recurrence | Recurrence 또는 null | 아니오 | 기능 규약 참조 |

종료 일시는 시작 이후, 최대 366일. 참석자 ID는 메타데이터이며 공유 권한을 만들지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/schedules/{id}

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/schedules/{id}

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/schedules/{id}

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string | 예 | date |
| endDate | string | 예 | date |
| startTime | string | 예 | 길이 ≤ 200 |
| endTime | string | 예 | 길이 ≤ 200 |
| color | string 또는 null | 아니오 | 기능 규약 참조 |
| attendeeIds | array 또는 null | 아니오 | 기능 규약 참조 |
| recurrence | Recurrence 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

종료 일시는 시작 이후, 최대 366일. 참석자 ID는 메타데이터이며 공유 권한을 만들지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/schedules/occurrences

인증은 JWT이며 소스는 ScheduleController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 예 | 없음 |
| query | to | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/search

인증은 JWT이며 소스는 SearchController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | q | String | 아니오 | 없음 |
| query | tag | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/search/tags

인증은 JWT이며 소스는 SearchController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/settings

인증은 JWT이며 소스는 SettingsController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/settings

인증은 JWT이며 소스는 SettingsController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| value | object 또는 array | 예 | 기능 규약 참조 |
| version | integer | 아니오 | 최소 1 |

JSON 최대 깊이 8, 객체 100필드, 배열 500항목, 저장 크기 128 KiB. apiKey/password/secret/cardNumber/accessToken/refreshToken은 중첩 위치에서도 거부한다. 자동화·AI 설정 저장은 실행을 의미하지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/settings/{section}

인증은 JWT이며 소스는 SettingsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | section | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/settings/{section}

인증은 JWT이며 소스는 SettingsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | section | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| value | object 또는 array | 예 | 기능 규약 참조 |
| version | integer | 아니오 | 최소 1 |

JSON 최대 깊이 8, 객체 100필드, 배열 500항목, 저장 크기 128 KiB. apiKey/password/secret/cardNumber/accessToken/refreshToken은 중첩 위치에서도 거부한다. 자동화·AI 설정 저장은 실행을 의미하지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/settings/notifications/kakao/verify

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| phone | string | 아니오 | 길이 ≤ 200 |
| code | string | 아니오 | 길이 ≤ 200 |
| consent | boolean | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/share/blocks

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/share/blocks/{userId}

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | userId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/share/blocks/{userId}

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | userId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/share/friends

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/share/friends/{id}

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/share/friends/{id}/accept

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/share/friends/{id}/reject

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/share/friends/invite

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| userId | string | 예 | 길이 ≤ 36 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/share/groups

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/share/groups

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| description | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/share/groups/{id}

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/share/groups/{id}

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/share/groups/{id}

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| description | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/share/groups/{id}/join

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/share/groups/{id}/members

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/share/groups/{id}/members

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| userId | string | 예 | 길이 ≤ 36 |
| role | string | 아니오 | viewer/editor |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/share/groups/{id}/members/{memberId}

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | memberId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/stat/category

인증은 JWT이며 소스는 InsightController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/stat/dashboard

인증은 JWT이며 소스는 InsightController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | range | String | 아니오 | month |
| query | date | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/stat/focus

인증은 JWT이며 소스는 InsightController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/stat/plan-actual

인증은 JWT이며 소스는 InsightController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/support/tickets

인증은 JWT이며 소스는 SupportController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/support/tickets

인증은 JWT이며 소스는 SupportController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string | 예 | 길이 ≤ 20000 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/sync/{provider}/run

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | provider | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/sync/status

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/tasks

인증은 JWT이며 소스는 TaskController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/tasks

인증은 JWT이며 소스는 TaskController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 기능 규약 참조 |
| note | string 또는 null | 아니오 | 기능 규약 참조 |
| priority | string 또는 null | 아니오 | 기능 규약 참조 |
| energyLevel | string 또는 null | 아니오 | 기능 규약 참조 |
| durationMin | integer 또는 null | 아니오 | 기능 규약 참조 |
| due | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryId | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryName | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryColor | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryIcon | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/tasks/{taskId}

인증은 JWT이며 소스는 TaskController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/tasks/{taskId}

인증은 JWT이며 소스는 TaskController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/tasks/{taskId}

인증은 JWT이며 소스는 TaskController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 기능 규약 참조 |
| note | string 또는 null | 아니오 | 기능 규약 참조 |
| priority | string 또는 null | 아니오 | 기능 규약 참조 |
| energyLevel | string 또는 null | 아니오 | 기능 규약 참조 |
| durationMin | integer 또는 null | 아니오 | 기능 규약 참조 |
| due | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryId | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryName | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryColor | string 또는 null | 아니오 | 기능 규약 참조 |
| categoryIcon | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/tasks/{taskId}/assignees

인증은 JWT이며 소스는 TaskAssigneeController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/tasks/{taskId}/assignees/{userId}

인증은 JWT이며 소스는 TaskAssigneeController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |
| path | userId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/tasks/{taskId}/assignees/{userId}

인증은 JWT이며 소스는 TaskAssigneeController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |
| path | userId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/tasks/{taskId}/checklist-items

인증은 JWT이며 소스는 TaskChecklistController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/tasks/{taskId}/checklist-items

인증은 JWT이며 소스는 TaskChecklistController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| assigneeId | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/tasks/{taskId}/checklist-items/{itemId}

인증은 JWT이며 소스는 TaskChecklistController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |
| path | itemId | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/tasks/{taskId}/checklist-items/{itemId}

인증은 JWT이며 소스는 TaskChecklistController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |
| path | itemId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| assigneeId | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/tasks/{taskId}/checklist-items/{itemId}/completion

인증은 JWT이며 소스는 TaskChecklistController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |
| path | itemId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| completed | boolean | 예 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/tasks/{taskId}/duplicate

인증은 JWT이며 소스는 TaskController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PATCH /api/tasks/{taskId}/status

인증은 JWT이며 소스는 TaskController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/user/data/export

인증은 JWT이며 소스는 UserProfileController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/user/password

인증은 JWT이며 소스는 UserProfileController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| currentPassword | string | 예 | 길이 ≤ 72 |
| newPassword | string | 예 | 길이 ≤ 72 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/user/profile

인증은 JWT이며 소스는 UserProfileController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/user/profile

인증은 JWT이며 소스는 UserProfileController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| nickname | string | 예 | 길이 ≤ 80 |
| timeZone | string | 아니오 | 길이 ≤ 64 |
| intro | string | 아니오 | 길이 ≤ 200 |
| mode | string | 아니오 | J/P/B |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/user/sessions

인증은 JWT이며 소스는 UserProfileController.java다. 성공 HTTP는 204다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/user/sessions

인증은 JWT이며 소스는 UserProfileController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/user/sessions/{id}

인증은 JWT이며 소스는 UserProfileController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/user/social-accounts

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/user/social-accounts/{provider}/connect

인증은 JWT이며 소스는 IntegrationController.java다. 제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | provider | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/career/projects

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/work/career/projects

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| period | string 또는 null | 아니오 | 기능 규약 참조 |
| role | string | 예 | 길이 ≤ 200 |
| company | string 또는 null | 아니오 | 기능 규약 참조 |
| stack | string 또는 null | 아니오 | 기능 규약 참조 |
| achievements | array 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/work/career/projects/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/career/projects/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/work/career/projects/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| period | string 또는 null | 아니오 | 기능 규약 참조 |
| role | string | 예 | 길이 ≤ 200 |
| company | string 또는 null | 아니오 | 기능 규약 참조 |
| stack | string 또는 null | 아니오 | 기능 규약 참조 |
| achievements | array 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/portfolio

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/work/portfolio

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| kind | string | 예 | 길이 ≤ 200 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/work/portfolio-links

인증은 JWT이며 소스는 PortfolioLinkController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| itemIds | array | 예 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/work/portfolio-links/{id}

인증은 JWT이며 소스는 PortfolioLinkController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/work/portfolio/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/portfolio/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/work/portfolio/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| kind | string | 예 | 길이 ≤ 200 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/records

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/work/records

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| type | string | 예 | 연차/반차/외근/출장/이직 |
| owner | string | 예 | 길이 ≤ 200 |
| projectId | string 또는 null | 아니오 | 기능 규약 참조 |
| status | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string | 예 | date |
| endDate | string | 예 | date |
| startTime | string | 예 | 길이 ≤ 200 |
| endTime | string | 예 | 길이 ≤ 200 |
| half | string 또는 null | 아니오 | 기능 규약 참조 |
| leaveDays | number 또는 null | 아니오 | 기능 규약 참조 |
| location | string 또는 null | 아니오 | 기능 규약 참조 |
| partner | string 또는 null | 아니오 | 기능 규약 참조 |
| transport | string 또는 null | 아니오 | 기능 규약 참조 |
| expense | number 또는 null | 아니오 | 기능 규약 참조 |
| fromCompany | string 또는 null | 아니오 | 기능 규약 참조 |
| toCompany | string 또는 null | 아니오 | 기능 규약 참조 |
| role | string 또는 null | 아니오 | 기능 규약 참조 |
| handover | string 또는 null | 아니오 | 기능 규약 참조 |

종료 일시는 시작 이후. 반차는 같은 날짜와 half 필수. 연차는 leaveDays 0.5일 단위. 외근·출장은 location, 출장은 expense, 이직은 toCompany/role 필수.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/work/records/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/records/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/work/records/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| type | string | 예 | 연차/반차/외근/출장/이직 |
| owner | string | 예 | 길이 ≤ 200 |
| projectId | string 또는 null | 아니오 | 기능 규약 참조 |
| status | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string | 예 | date |
| endDate | string | 예 | date |
| startTime | string | 예 | 길이 ≤ 200 |
| endTime | string | 예 | 길이 ≤ 200 |
| half | string 또는 null | 아니오 | 기능 규약 참조 |
| leaveDays | number 또는 null | 아니오 | 기능 규약 참조 |
| location | string 또는 null | 아니오 | 기능 규약 참조 |
| partner | string 또는 null | 아니오 | 기능 규약 참조 |
| transport | string 또는 null | 아니오 | 기능 규약 참조 |
| expense | number 또는 null | 아니오 | 기능 규약 참조 |
| fromCompany | string 또는 null | 아니오 | 기능 규약 참조 |
| toCompany | string 또는 null | 아니오 | 기능 규약 참조 |
| role | string 또는 null | 아니오 | 기능 규약 참조 |
| handover | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

종료 일시는 시작 이후. 반차는 같은 날짜와 half 필수. 연차는 leaveDays 0.5일 단위. 외근·출장은 location, 출장은 expense, 이직은 toCompany/role 필수.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/resume

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/work/resume

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| name | string | 예 | 길이 ≤ 200 |
| headline | string 또는 null | 아니오 | 기능 규약 참조 |
| years | integer 또는 null | 아니오 | 기능 규약 참조 |
| skills | string 또는 null | 아니오 | 기능 규약 참조 |
| education | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 아니오 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/wbs

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/wbs/nodes

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/work/wbs/nodes

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| parentId | string 또는 null | 아니오 | 기능 규약 참조 |
| md | number | 예 | 최소 0 · 최대 100000 |
| progress | number | 예 | 최소 0 · 최대 100 |
| owner | string 또는 null | 아니오 | 기능 규약 참조 |
| open | boolean 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string 또는 null | 아니오 | 기능 규약 참조 |
| endDate | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/work/wbs/nodes/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/wbs/nodes/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/work/wbs/nodes/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| parentId | string 또는 null | 아니오 | 기능 규약 참조 |
| md | number | 예 | 최소 0 · 최대 100000 |
| progress | number | 예 | 최소 0 · 최대 100 |
| owner | string 또는 null | 아니오 | 기능 규약 참조 |
| open | boolean 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string 또는 null | 아니오 | 기능 규약 참조 |
| endDate | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/wiki

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/work/wiki

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| space | string | 예 | 길이 ≤ 200 |
| parentId | string 또는 null | 아니오 | 기능 규약 참조 |
| pinned | boolean 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/work/wiki/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/wiki/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/work/wiki/{id}

인증은 JWT이며 소스는 WorkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| space | string | 예 | 길이 ≤ 200 |
| parentId | string 또는 null | 아니오 | 기능 규약 참조 |
| pinned | boolean 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/wiki/{id}/history

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.
