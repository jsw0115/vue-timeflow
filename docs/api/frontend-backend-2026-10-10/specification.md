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

## GET /api/admin/policy

인증은 JWT + ADMIN이며 소스는 AdminPolicyController.java다. 성공 HTTP는 200다.

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

## GET /api/career/activities

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/career/activities

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| activityType | string | 예 | work/intern/part-time/freelance/project/study/community |
| date | string | 예 | date |
| endDate | string 또는 null | 아니오 | 기능 규약 참조 |
| experienceId | string 또는 null | 아니오 | 기능 규약 참조 |
| role | string 또는 null | 아니오 | 기능 규약 참조 |
| skillTags | array 또는 null | 아니오 | 기능 규약 참조 |
| achievements | array 또는 null | 아니오 | 기능 규약 참조 |
| links | array 또는 null | 아니오 | 기능 규약 참조 |
| visibility | string 또는 null | 아니오 | 기능 규약 참조 |
| tags | array 또는 null | 아니오 | 기능 규약 참조 |

activityType은 회사 업무(work)·인턴(intern)·아르바이트(part-time)·프리랜서(freelance)·개인 프로젝트(project)·학습(study)·커뮤니티 활동(community). endDate는 date 이후. experienceId는 본인 경력(/api/work/career/projects)의 ID만 받고, 없거나 다른 계정 경력이면 400. links는 http/https 절대 주소 최대 10개이며 서버가 호출하지 않는다. visibility는 private만 받고 빼면 private로 저장한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/career/activities/{id}

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/career/activities/{id}

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/career/activities/{id}

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| activityType | string | 예 | work/intern/part-time/freelance/project/study/community |
| date | string | 예 | date |
| endDate | string 또는 null | 아니오 | 기능 규약 참조 |
| experienceId | string 또는 null | 아니오 | 기능 규약 참조 |
| role | string 또는 null | 아니오 | 기능 규약 참조 |
| skillTags | array 또는 null | 아니오 | 기능 규약 참조 |
| achievements | array 또는 null | 아니오 | 기능 규약 참조 |
| links | array 또는 null | 아니오 | 기능 규약 참조 |
| visibility | string 또는 null | 아니오 | 기능 규약 참조 |
| tags | array 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

activityType은 회사 업무(work)·인턴(intern)·아르바이트(part-time)·프리랜서(freelance)·개인 프로젝트(project)·학습(study)·커뮤니티 활동(community). endDate는 date 이후. experienceId는 본인 경력(/api/work/career/projects)의 ID만 받고, 없거나 다른 계정 경력이면 400. links는 http/https 절대 주소 최대 10개이며 서버가 호출하지 않는다. visibility는 private만 받고 빼면 private로 저장한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/career/activities/{id}/sources

인증은 JWT이며 소스는 ActivitySourceController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/career/activities/{id}/sources

인증은 JWT이며 소스는 ActivitySourceController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| kind | string | 예 | schedule/actual/wbs |
| id | string | 예 | 길이 ≤ 100 |

커리어 활동에 근거 원본(일정·실제 기록·WBS 작업)을 잇는다(PR-24). 같은 계정의 기록만, 활동마다 50개까지(넘으면 409). 없는 원본·다른 계정 원본은 같은 404. 응답은 근거 목록이고, 지워진 원본은 title 없이 broken=true로 보인다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/career/activities/{id}/sources/{kind}/{sourceId}

인증은 JWT이며 소스는 ActivitySourceController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | kind | String | 예 | 없음 |
| path | sourceId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/career/applications

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 아니오 | 없음 |
| query | to | String | 아니오 | 없음 |
| query | q | String | 아니오 | 없음 |
| query | category | String | 아니오 | 없음 |
| query | page | int | 아니오 | 0 |
| query | size | int | 아니오 | 20 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/career/applications

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| company | string | 예 | 길이 ≤ 200 |
| postingUrl | string 또는 null | 아니오 | 기능 규약 참조 |
| employmentType | string 또는 null | 아니오 | 기능 규약 참조 |
| workType | string 또는 null | 아니오 | 기능 규약 참조 |
| salaryRange | string 또는 null | 아니오 | 기능 규약 참조 |
| deadline | string 또는 null | 아니오 | 기능 규약 참조 |
| appliedDate | string 또는 null | 아니오 | 기능 규약 참조 |
| interviewDate | string 또는 null | 아니오 | 기능 규약 참조 |
| status | string | 예 | interested/preparing/applied/screening-passed/interview/accepted/rejected/on-hold/withdrawn |
| body | string 또는 null | 아니오 | 기능 규약 참조 |

status는 관심(interested)·준비 중(preparing)·지원 완료(applied)·서류 통과(screening-passed)·면접 예정(interview)·최종 합격(accepted)·불합격(rejected)·보류(on-hold)·철회(withdrawn). 상태 전이 제한은 없다. postingUrl은 http/https 절대 주소(최대 2000자)이며 서버가 공고를 가져오지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/career/applications/{id}

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/career/applications/{id}

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/career/applications/{id}

인증은 JWT이며 소스는 CareerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| company | string | 예 | 길이 ≤ 200 |
| postingUrl | string 또는 null | 아니오 | 기능 규약 참조 |
| employmentType | string 또는 null | 아니오 | 기능 규약 참조 |
| workType | string 또는 null | 아니오 | 기능 규약 참조 |
| salaryRange | string 또는 null | 아니오 | 기능 규약 참조 |
| deadline | string 또는 null | 아니오 | 기능 규약 참조 |
| appliedDate | string 또는 null | 아니오 | 기능 규약 참조 |
| interviewDate | string 또는 null | 아니오 | 기능 규약 참조 |
| status | string | 예 | interested/preparing/applied/screening-passed/interview/accepted/rejected/on-hold/withdrawn |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

status는 관심(interested)·준비 중(preparing)·지원 완료(applied)·서류 통과(screening-passed)·면접 예정(interview)·최종 합격(accepted)·불합격(rejected)·보류(on-hold)·철회(withdrawn). 상태 전이 제한은 없다. postingUrl은 http/https 절대 주소(최대 2000자)이며 서버가 공고를 가져오지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/career/applications/{id}/documents

인증은 JWT이며 소스는 DocumentVersionController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/career/applications/{id}/documents

인증은 JWT이며 소스는 DocumentVersionController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| versionId | string | 예 | 길이 ≤ 100 |

지원 건에 문서 버전을 제출본으로 잇는다(PR-25). 지원마다 문서 종류별 하나이며 같은 종류의 다른 버전이 있으면 이 버전으로 바꾼다. 없거나 다른 계정의 지원·버전은 같은 404.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/career/applications/{id}/documents/{versionId}

인증은 JWT이며 소스는 DocumentVersionController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | versionId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/career/document-versions

인증은 JWT이며 소스는 DocumentVersionController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | document | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/career/document-versions

인증은 JWT이며 소스는 DocumentVersionController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| document | string | 예 | resume/career/portfolio/cover-letter |
| label | string | 아니오 | 길이 ≤ 100 |
| note | string | 아니오 | 길이 ≤ 500 |
| language | string | 아니오 | ko/en |

language는 버전 언어 표시다(PR-32, 09 Q-38 (3)). 빼면 ko다. 번역문이 원문을 덮어쓰지 않도록 언어별 내용을 새 버전으로 남긴다. 지금 저장된 이력서(resume)·경력기술서 항목(career)·포트폴리오 항목(portfolio)·자기소개서(cover-letter)를 서버가 복사해 고정 버전을 만든다(PR-25). 내용은 요청으로 받지 않는다. 번호는 문서마다 1부터 늘고 ID는 "문서-번호"다. 저장된 내용이 없거나 문서마다 100개를 넘으면 409. 버전은 고치는 경로가 없다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/career/document-versions/{id}

인증은 JWT이며 소스는 DocumentVersionController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/career/document-versions/{id}

인증은 JWT이며 소스는 DocumentVersionController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/chat/communities/{communityId}/room

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | communityId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/chat/events

인증은 JWT이며 소스는 ChatController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Authorization | String | 예 | 없음 |

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
| verify | string 또는 null | 아니오 | 기능 규약 참조 |
| minMinutes | integer 또는 null | 아니오 | 기능 규약 참조 |
| windowStart | string 또는 null | 아니오 | 기능 규약 참조 |
| windowEnd | string 또는 null | 아니오 | 기능 규약 참조 |
| openRecords | boolean 또는 null | 아니오 | 기능 규약 참조 |

verify는 self(직접 인증, 기본) 또는 record(실시간 실제 기록으로 확인). record이면 minMinutes(1~600) 필수. windowStart·windowEnd(HH:mm)는 record에서만 함께 정하며 끝이 시작보다 늦어야 한다(자정을 넘지 않음). openRecords=true(기록 공개 챌린지)는 record여야 한다. 만든 뒤에는 규칙을 바꾸지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/communities/{id}/challenges/{challengeId}/checkins

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | challengeId | String | 예 | 없음 |
| query | userId | String | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/communities/{id}/challenges/{challengeId}/checkins/{date}

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | challengeId | String | 예 | 없음 |
| path | date | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| sessionId | string | 아니오 | 길이 ≤ 100 |

본문 없이 보내면 직접 인증. sessionId는 내 실제 기록 중 실시간으로 시작·종료한 완료 기록(다른 계정·없는 기록은 404). 시간대가 없으면 기록 시작 날짜(사용자 하루 기준)가 인증 날짜와 같아야 하고, 시간대가 있으면 그 날짜의 시간대와 겹친 분이 minMinutes 이상이어야 한다. record 챌린지는 sessionId 필수. 같은 기록은 한 챌린지에서 한 번만 쓴다(409).

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/communities/{id}/challenges/{challengeId}/join

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | challengeId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| consent | boolean | 아니오 | 기능 규약 참조 |

기록 공개 챌린지(openRecords)는 consent=true여야 참여한다. 끝난 챌린지는 409.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/communities/{id}/challenges/{challengeId}/members/me

인증은 JWT이며 소스는 CommunityController.java다. 성공 HTTP는 204다.

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
| accountId | string 또는 null | 아니오 | 기능 규약 참조 |
| accountNickname | string 또는 null | 아니오 | 기능 규약 참조 |

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
| accountId | string 또는 null | 아니오 | 기능 규약 참조 |
| accountNickname | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/contacts/{id}/account

인증은 JWT이며 소스는 ContactAccountController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | version | long | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/contacts/{id}/account

인증은 JWT이며 소스는 ContactAccountController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| version | integer | 예 | 최소 1 |

연락처 이메일과 정확히 같은 활성 계정을 찾아 accountId·accountNickname을 넣는다(Q-21). 이메일이 없으면 400, 없는 계정·자기 자신·차단은 같은 404, 사람 찾기와 같은 1분 20번 제한(429). 일반 저장에서는 이 두 값을 받지 않고, 이메일이 바뀌면 연결을 끊는다.

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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
| header | Idempotency-Key | String | 아니오 | 없음 |

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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

## POST /api/notifications/{id}/actions/{action}

인증은 JWT이며 소스는 NotificationRefreshController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| path | action | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/notifications/{id}/read

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/notifications/due-refresh

인증은 JWT이며 소스는 NotificationRefreshController.java다. 성공 HTTP는 200다.

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
| version | integer | 아니오 | 최소 0 · 최대 0 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/planner/items/{id}

인증은 JWT이며 소스는 PlannerController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | long | 예 | 없음 |
| query | version | Long | 예 | 없음 |

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
| version | integer | 예 | 최소 1 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PATCH /api/planner/items/{id}/status

인증은 JWT이며 소스는 PlannerController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | long | 예 | 없음 |
| query | status | PlannerItem.ItemStatus | 예 | 없음 |
| query | version | Long | 예 | 없음 |

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

## GET /api/planner/recordings

인증은 JWT이며 소스는 ActualRecordingController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/recordings/{id}

인증은 JWT이며 소스는 ActualRecordingController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/recordings/{id}/cancel

인증은 JWT이며 소스는 ActualRecordingController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| version | integer | 예 | 최소 1 |

끝내지 않은 기록을 지우고 원본 연결도 지운다. 끝낸 기록은 409, 다른 계정 기록은 404.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/recordings/{id}/finish

인증은 JWT이며 소스는 ActualRecordingController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| requestId | string | 예 | 길이 ≤ 80 |
| version | integer | 예 | 최소 1 |
| endedAt | string | 예 | date-time · 시작 이후·마지막 일시정지·재개 이후·서버 현재 시각+5초 이내. 일시정지 중이면 그 일시정지를 이 시각에서 닫는다. 응답 유실 시 같은 식별자와 시각으로 재전송. |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/recordings/{id}/pause

인증은 JWT이며 소스는 ActualRecordingController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| version | integer | 예 | 최소 1 |

진행 중(RUNNING) 기록을 서버 현재 시각으로 일시정지한다. 기록 하나에 100번까지. 상태나 version이 다르면 409.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/recordings/{id}/resume

인증은 JWT이며 소스는 ActualRecordingController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| version | integer | 예 | 최소 1 |

일시정지(PAUSED) 기록의 마지막 일시정지를 서버 현재 시각으로 닫고 다시 시작한다. 상태나 version이 다르면 409.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/planner/recordings/current

인증은 JWT이며 소스는 ActualRecordingController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/recordings/start

인증은 JWT이며 소스는 ActualRecordingController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| requestId | string | 예 | 길이 ≤ 80 |
| title | string | 예 | 길이 ≤ 200 |
| timeZone | string | 예 | 길이 ≤ 200 |
| sourceKind | string | 아니오 | task/schedule · 할 일·일정에서 시작할 때 원본 종류. sourceId와 함께 보낸다. 다른 계정의 원본이면 404. |
| sourceId | string | 아니오 | 길이 ≤ 100 |
| mode | string | 아니오 | pomodoro/countdown/stopwatch · 집중 타이머 종류. 빼면 플래너의 실제 기록이다. |
| targetMinutes | integer | 아니오 | 최소 1 · 최대 1440 · 포모도로·카운트다운에만 필수. 스톱워치·모드 없는 기록에 보내면 400. |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/reschedule/apply

인증은 JWT이며 소스는 RescheduleController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| moves | array | 예 | 기능 규약 참조 |

고른 항목만 옮긴다. 항목마다 version이 지금 값과 다르면 옮기지 않고 conflicts(reason changed·missing)에 넣고, 나머지는 옮긴다. 되돌리기도 같은 경로로 원래 시각과 옮긴 뒤 version을 보낸다. 같은 순간의 동시 쓰기는 요청 전체가 409일 수 있다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/planner/reschedule/preview

인증은 JWT이며 소스는 RescheduleController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| date | string | 예 | date |
| from | string | 예 | 이 시각 이후 시작하는 계획 블록과 이후 마감인 할 일만 옮긴다 |
| delayMinutes | integer | 예 | 최소 5 · 최대 480 |

재배치안(PR-19 UF-137, Q-36). 아무것도 바꾸지 않는다. 계획 블록은 (원래 시작+밀린 분)과 앞 블록 끝 중 늦은 때에 놓고, 일정·그 전에 시작한 블록과 겹치면 그 뒤로 민다. 마감 시각 있는 할 일은 마감을 밀린 분만큼 늦춘다. 자정을 넘으면 unplaced. 일정(SCHEDULE)은 옮기지 않는다.

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

## POST /api/public/portfolios/{token}/unlock

인증은 JWT이며 소스는 PortfolioLinkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | token | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| password | string | 예 | 길이 ≤ 100 |

비밀번호가 걸린 링크 열기(Q-39). 맞으면 공개 항목, 틀리면 401, 틀린 횟수가 10번이 되면 403(잠김). 비밀번호가 없는 링크는 바로 내용을 준다. 만료·닫힘은 404.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/record-links

인증은 JWT이며 소스는 RecordLinkController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | kind | String | 예 | 없음 |
| query | id | String | 예 | 없음 |

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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
| pausedFrom | string 또는 null | 아니오 | 기능 규약 참조 |
| pausedRanges | string 또는 null | 아니오 | 기능 규약 참조 |
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
| pausedFrom | string 또는 null | 아니오 | 기능 규약 참조 |
| pausedRanges | string 또는 null | 아니오 | 기능 규약 참조 |
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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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
| query | status | String | 아니오 | 없음 |

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

## GET /api/share/groups/{id}/preview

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | viewerId | String | 예 | 없음 |
| query | from | String | 예 | 없음 |
| query | to | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/share/groups/{id}/schedules

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |
| query | from | String | 예 | 없음 |
| query | to | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/share/groups/{id}/share-level

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | id | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| level | string | 예 | none/busy/title/detail |

이 그룹에 내 일정을 보이는 범위. none 공유 안 함(철회), busy 바쁜 시간만, title 제목 포함, detail 상세 포함(내용·분류·색). 활성 멤버만 바꾼다. 처음 값은 none이다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/share/people

인증은 JWT이며 소스는 ShareController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | email | String | 예 | 없음 |

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

## GET /api/stat/execution

인증은 JWT이며 소스는 ExecutionRateController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| query | from | String | 예 | 없음 |
| query | to | String | 예 | 없음 |

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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
| version | integer 또는 null | 아니오 | 기능 규약 참조 |
| dueTime | string 또는 null | 아니오 | 기능 규약 참조 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/tasks/{taskId}

인증은 JWT이며 소스는 TaskController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |
| query | version | Long | 아니오 | 없음 |

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
| header | Idempotency-Key | String | 아니오 | 없음 |

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
| version | integer 또는 null | 아니오 | 기능 규약 참조 |
| dueTime | string 또는 null | 아니오 | 기능 규약 참조 |

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

## POST /api/tasks/{taskId}/schedules

인증은 JWT이며 소스는 RecordLinkController.java다. 성공 HTTP는 201다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |
| header | key | String | 아니오 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 아니오 | 길이 ≤ 200 |
| body | string 또는 null | 아니오 | 기능 규약 참조 |
| category | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string | 예 | date |
| endDate | string | 예 | date |
| startTime | string | 예 | 길이 ≤ 200 |
| endTime | string | 예 | 길이 ≤ 200 |
| color | string 또는 null | 아니오 | 기능 규약 참조 |
| attendeeIds | array 또는 null | 아니오 | 기능 규약 참조 |
| recurrence | Recurrence 또는 null | 아니오 | 기능 규약 참조 |

할 일을 일정으로 배치하고 할 일→일정 연결을 같은 트랜잭션에서 남긴다. title을 비우면 할 일 제목을 복사하며, 그 뒤 할 일 제목을 바꿔도 일정 제목은 바뀌지 않는다. Idempotency-Key를 받는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PATCH /api/tasks/{taskId}/status

인증은 JWT이며 소스는 TaskController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | taskId | String | 예 | 없음 |
| query | version | Long | 아니오 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/user/data/backup

인증은 JWT이며 소스는 BackupController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/user/data/backup/{jobId}/restore

인증은 JWT이며 소스는 BackupController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | jobId | String | 예 | 없음 |

file을 multipart/form-data로 전달한다. boundary는 HTTP 클라이언트가 지정한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/user/data/backup/preview

인증은 JWT이며 소스는 BackupController.java다. 성공 HTTP는 200다.

file을 multipart/form-data로 전달한다. boundary는 HTTP 클라이언트가 지정한다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/user/data/backup/status

인증은 JWT이며 소스는 BackupController.java다. 성공 HTTP는 200다.

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

현재 비밀번호를 확인한 뒤 바꾸고 이 계정의 refresh 토큰을 모두 폐기한다. 현재 비밀번호가 틀리면 401이다. 확인 실패는 로그인과 따로 계정별로 세어 5번 틀리면 15분 동안 403(잠김)이며, 이 잠금은 로그인을 막지 않는다.

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
| dayStartHour | integer | 아니오 | 최소 0 · 최대 6 · 하루 경계 시각(정시). 기본 0. 통계·오늘의 날짜 배정에만 쓰고 저장된 시각은 바꾸지 않는다. intro·mode처럼 보내지 않으면 저장값에서 빠진다. |

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| period | string 또는 null | 아니오 | 기능 규약 참조 |
| role | string | 예 | 길이 ≤ 200 |
| company | string 또는 null | 아니오 | 기능 규약 참조 |
| stack | string 또는 null | 아니오 | 기능 규약 참조 |
| achievements | array 또는 null | 아니오 | 기능 규약 참조 |
| employmentType | string 또는 null | 아니오 | 기능 규약 참조 |
| department | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string 또는 null | 아니오 | 기능 규약 참조 |
| endDate | string 또는 null | 아니오 | 기능 규약 참조 |
| employmentStatus | string 또는 null | 아니오 | 기능 규약 참조 |
| duties | string 또는 null | 아니오 | 기능 규약 참조 |

고용 형태 employmentType은 정규직(full-time)·계약직(contract)·인턴(intern)·아르바이트(part-time)·프리랜서(freelance)·기타(other). 재직 상태 employmentStatus는 재직 중(current)·종료(ended). endDate는 startDate 이후. current이면 endDate를 비우고, ended이면 endDate가 필요하다. 상세 필드는 모두 선택이며 예전 자유 기간(period)도 받는다. 담당 업무 duties는 20000자까지다(REQ-F25). 기간 겹침·공백은 서버가 막지 않는다.

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
| employmentType | string 또는 null | 아니오 | 기능 규약 참조 |
| department | string 또는 null | 아니오 | 기능 규약 참조 |
| startDate | string 또는 null | 아니오 | 기능 규약 참조 |
| endDate | string 또는 null | 아니오 | 기능 규약 참조 |
| employmentStatus | string 또는 null | 아니오 | 기능 규약 참조 |
| duties | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

고용 형태 employmentType은 정규직(full-time)·계약직(contract)·인턴(intern)·아르바이트(part-time)·프리랜서(freelance)·기타(other). 재직 상태 employmentStatus는 재직 중(current)·종료(ended). endDate는 startDate 이후. current이면 endDate를 비우고, ended이면 endDate가 필요하다. 상세 필드는 모두 선택이며 예전 자유 기간(period)도 받는다. 담당 업무 duties는 20000자까지다(REQ-F25). 기간 겹침·공백은 서버가 막지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/cover-letter

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## PUT /api/work/cover-letter

인증은 JWT이며 소스는 RecordActionsController.java다. 성공 HTTP는 200다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| title | string | 예 | 길이 ≤ 200 |
| motivation | string 또는 null | 아니오 | 기능 규약 참조 |
| competency | string 또는 null | 아니오 | 기능 규약 참조 |
| problemSolving | string 또는 null | 아니오 | 기능 규약 참조 |
| collaboration | string 또는 null | 아니오 | 기능 규약 참조 |
| growth | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 아니오 | 최소 1 |

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
| role | string 또는 null | 아니오 | 기능 규약 참조 |
| stack | string 또는 null | 아니오 | 기능 규약 참조 |
| problem | string 또는 null | 아니오 | 기능 규약 참조 |
| process | string 또는 null | 아니오 | 기능 규약 참조 |
| outcome | string 또는 null | 아니오 | 기능 규약 참조 |
| contribution | string 또는 null | 아니오 | 기능 규약 참조 |
| links | array 또는 null | 아니오 | 기능 규약 참조 |
| activityIds | array 또는 null | 아니오 | 기능 규약 참조 |
| experienceId | string 또는 null | 아니오 | 기능 규약 참조 |

포트폴리오 항목(PR-26). body는 프로젝트 소개, problem·process·outcome·contribution은 문제·과정·성과·개인 기여(각 20000자), role·stack은 역할·기술(200자). links는 결과물 http/https 주소 최대 10개. activityIds(최대 20)와 experienceId는 본인 커리어 활동·경력만 남고, 지워졌거나 다른 계정의 ID는 오류 없이 저장에서 빠진다. 공개 링크에는 activityIds·experienceId가 나가지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/portfolio-links

인증은 JWT이며 소스는 PortfolioLinkController.java다. 성공 HTTP는 200다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/work/portfolio-links

인증은 JWT이며 소스는 PortfolioLinkController.java다. 성공 HTTP는 201다.

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| itemIds | array | 예 | 기능 규약 참조 |
| scope | string | 아니오 | public/link |
| expiresInDays | integer | 아니오 | 1/7/30 |
| password | string | 아니오 | 길이 ≤ 100 |

고른 포트폴리오 항목만 여는 링크(Q-22). scope 기본 link: 1·7·30일(기본 7) 뒤 만료, 주소는 이 응답에서 한 번만 보인다. public: 만료 없음, 목록에서 주소를 다시 보인다. 열린 링크는 20개까지(넘으면 409). password(Q-39)는 link에만 선택으로 받고 해시만 저장한다. public에 보내면 400.

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
| role | string 또는 null | 아니오 | 기능 규약 참조 |
| stack | string 또는 null | 아니오 | 기능 규약 참조 |
| problem | string 또는 null | 아니오 | 기능 규약 참조 |
| process | string 또는 null | 아니오 | 기능 규약 참조 |
| outcome | string 또는 null | 아니오 | 기능 규약 참조 |
| contribution | string 또는 null | 아니오 | 기능 규약 참조 |
| links | array 또는 null | 아니오 | 기능 규약 참조 |
| activityIds | array 또는 null | 아니오 | 기능 규약 참조 |
| experienceId | string 또는 null | 아니오 | 기능 규약 참조 |
| version | integer | 예 | 최소 1 |

포트폴리오 항목(PR-26). body는 프로젝트 소개, problem·process·outcome·contribution은 문제·과정·성과·개인 기여(각 20000자), role·stack은 역할·기술(200자). links는 결과물 http/https 주소 최대 10개. activityIds(최대 20)와 experienceId는 본인 커리어 활동·경력만 남고, 지워졌거나 다른 계정의 ID는 오류 없이 저장에서 빠진다. 공개 링크에는 activityIds·experienceId가 나가지 않는다.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/projects/{projectId}/actuals

인증은 JWT이며 소스는 ProjectReportController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | projectId | String | 예 | 없음 |
| query | from | String | 예 | 없음 |
| query | to | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## POST /api/work/projects/{projectId}/actuals

인증은 JWT이며 소스는 ProjectReportController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | projectId | String | 예 | 없음 |

| 본문 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| actualId | string | 예 | 길이 ≤ 100 |

끝낸 실제 기록을 프로젝트(최상위 WBS 작업)에 잇는다(PR-19 UF-138, Q-35). 실제 기록 하나는 프로젝트 하나에만 속해, 다른 프로젝트에 이어져 있었으면 옮긴다. 하위 작업·진행 중 기록은 400, 없거나 다른 계정의 프로젝트·기록은 404.

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## DELETE /api/work/projects/{projectId}/actuals/{actualId}

인증은 JWT이며 소스는 ProjectReportController.java다. 성공 HTTP는 204다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | projectId | String | 예 | 없음 |
| path | actualId | String | 예 | 없음 |

응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.

## GET /api/work/projects/{projectId}/report-draft

인증은 JWT이며 소스는 ProjectReportController.java다. 성공 HTTP는 200다.

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| path | projectId | String | 예 | 없음 |
| query | from | String | 예 | 없음 |
| query | to | String | 예 | 없음 |

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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

| 위치 | 이름 | 타입 | 필수 | 기본값 |
|---|---|---|---|---|
| header | Idempotency-Key | String | 아니오 | 없음 |

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
