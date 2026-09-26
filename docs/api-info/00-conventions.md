# API 공통 설계 규칙

2026-09-26 · 목표 `/api/v1` · 미구현 계약입니다. 기존 `/api`는 [현재 소스 계약](current-contract.md)을 따릅니다.

## 문서 읽는 순서

1. [API 목록](catalog.md)에서 업무/ID를 찾습니다.
2. 해당 영역 문서에서 메서드·URL·인증·헤더·파라미터·본문 필드·응답 구조·오류를 확인합니다.
3. 자동화 도구에는 [OpenAPI 3.1.1 JSON](openapi.target.json)을 사용합니다. 예시 도메인 `*.example.test`는 실제 연결 대상이 아닙니다.

## 통신·버전·자료형

- HTTPS, JSON UTF-8. URL prefix `/api/v1`. 문서 버전은 2026-09-26이며 버전 번호가 구현 완료를 뜻하지 않습니다.
- ID는 opaque string입니다. 기존 BIGINT 일정 ID도 문자열로 직렬화하되 DB PK를 자동 변경하지 않습니다.
- 날짜 `YYYY-MM-DD`, 지역 시간 `HH:mm`, 시점은 RFC3339/ISO8601 offset 포함입니다. 서버 응답은 UTC `Z`로 통일합니다.
- `timezone`은 유효한 IANA ZoneId. 브라우저 입력 날짜/시간을 이 시간대의 UTC로 변환합니다. DST 모호/누락 시각은 확인 없이 추측하지 않습니다.
- 목록 날짜 범위 `[from,to)`는 시작 포함·끝 제외, 기본 최대93일. from/to는 함께 전달해야 합니다. 루틴 이력도 이 범위를 따르며 더 긴 보고서는 비동기 보고서 API를 사용합니다.
- 표에서 선택은 생략 가능을 뜻하며 null 허용은 별도입니다. PATCH는 누락=기존 값 유지, 명시적 null=nullable 필드만 제거, 빈 객체는400입니다. PUT은 해당 하위 리소스의 전체 상태를 지정합니다.
- 요청의 알 수 없는 속성은400. JSON schema 제약에 더해 제목 trim 후 공백만 있는 값, 날짜 역전, 본인 아닌 참조ID, 유형별 조건은 서버가 검증합니다.
- Request/Response의 중첩 필드는 점과 `[]`로 표시합니다. 객체의 선택 속성은 부모 자체가 있는 경우의 필수조건을 따릅니다.

## 인증·인가

| 클라이언트 | access | refresh | CSRF |
|---|---|---|---|
| 웹/PWA | 메모리에 보관, Authorization Bearer | `tf_refresh` HttpOnly/Secure/SameSite=Lax 쿠키 | refresh/logout에 Origin + X-CSRF-Token 필수 |
| iOS/Android | 메모리/OS 보안 저장소 | Keychain/Keystore 등 OS 보안 저장소, native 경로 JSON | ambient cookie 미사용; 쿠키 경로 우회 수단 아님 |
| Electron | renderer에 영구 보관하지 않음 | main 프로세스 OS 보안 저장소; 제한된 IPC | renderer의 임의 파일·토큰 접근 금지 |

브라우저 로그인/회전 시 서버는 `tf_refresh`와 `tf_csrf`를 각각 Set-Cookie로 내려줍니다. `tf_csrf`는 JS가 읽을 수 있지만 세션에 묶이고 서명/검증됩니다. CSRF 헤더 생성은 전용 클라이언트 인증 모듈이 수행합니다. 이 설계의 쿠키 범위는 아래와 같습니다.

- `tf_refresh`: Path=/api/v1/auth; HttpOnly; Secure; SameSite=Lax.
- `tf_csrf`: Path=/; Secure; SameSite=Lax, 비-HttpOnly, 서버 서명된 double-submit 값.
- 로그아웃은 각 쿠키와 동일 Path로 Max-Age=0을 내려줍니다.
- 웹은 동일 origin reverse proxy 아래 `/`와 `/api`를 배치하고 쿠키는 host-only로 설정합니다. 같은 site라도 API가 별도 host이면 프론트 JS가 API의 CSRF 쿠키를 읽을 수 없으므로 이 구성을 그대로 적용하지 않습니다. 별도 host 배포에는 전용 CSRF bootstrap 계약과 정확한 CORS 검증이 추가로 필요합니다. cross-site 쿠키 정책을 클라이언트 쿼리로 완화하지 않습니다.
- 서버는 JWT subject를 소유자로 사용합니다. 일반 body의 userId/ownerId/role을 신뢰하지 않습니다.
- 리소스 소유/공유/멤버십은 조회·검색·통계·파일·멘션·채팅 참조 모두에서 재검증합니다. 다른 사용자의 비공개 ID는404로 숨깁니다.
- 관리자 엔드포인트는 ADMIN 역할+감사 로그. UI에서 관리자 메뉴를 숨기는 것은 권한 검사가 아닙니다.
- 비밀번호 정책 12~72자와 bcrypt UTF-8 72바이트 한도를 함께 검사합니다. 실제 서비스 정책과 마이그레이션 시 기존 비밀번호 로그인을 임의 차단하지 않도록 확인합니다.

## 페이징·필터

- `limit` 기본30, 1~100. 응답 `{items,nextCursor,hasNext}`. 마지막 nextCursor=null, hasNext=false.
- 정렬 기준과 ID를 함께 cursor에 담고 사용자·필터 해시로 서명합니다. 바뀐 기간/필터로 커서 재사용 시400입니다.
- 통합 일정: `(표시 날짜,종류,ID,회차키)` 오름차순. 업무/메모/게시글은 updatedAt DESC, id DESC. 채팅은 createdAt DESC, id DESC. 통계는 날짜 오름차순입니다.
- 기본 목록은 OWN 범위. 공개/공유를 합쳐도 서버 권한을 넘어서는 항목은 포함하지 않습니다.
- CSV 배열 필드 안은 OR, 서로 다른 필터는 AND. `types=EVENT,TASK,ROUTINE`로 일정 탭 전체/일정/할 일/루틴을 구현합니다. 빈 배열/중복 enum/알 수 없는 enum은400입니다.
- 페이지 이동 중 수정으로 항목이 이동할 수 있습니다. ID/회차키로 중복 제거하고 실시간 엄격한 snapshot이 필요한 내보내기는 작업 API를 사용합니다.

## 상태 코드·중복·동시 수정

| 상태 | 의미 |
|---|---|
| 200 | 조회·수정·상태 지정 성공 |
| 201 | 신규 생성; Location과 리소스 반환 |
| 202 | 비동기 접수; 완료 아님, Location의 작업 상태 확인 |
| 204 | 성공, 본문 없음; 클라이언트 JSON 파싱 금지 |
| 400 / 422 | 자료형·필수·enum 오류 / 시간 관계·유형별 도메인 제약 위반 |
| 401 / 403 / 404 | 인증 실패 / 기능 권한 부족 / 없음 또는 비공개 대상 |
| 409 / 412 / 428 | 도메인·멱등 충돌 / 최신 버전 불일치 / 조건 헤더 누락 |

- POST 생성/비동기 작업에는 Idempotency-Key(UUID), 보관24시간. 인증 코드는 별도 단회 정책이므로 동일한 일반 키 규칙을 사용하지 않습니다.
- 같은 사용자+메서드+정규 URL+키+본문 hash는 최초 결과를 재현합니다. 같은 키에 다른 본문은409. DB UNIQUE로 동시 처리를 막습니다.
- 서버 버전은 ETag `"1"` 형태. 수정/삭제의 If-Match 필요 여부는 엔드포인트 표에 명시합니다.
- upsert는 신규 `If-None-Match: *`, 기존 `If-Match: "n"` 중 정확히 하나 필수입니다. 두 헤더 동시 전달은400, 누락428, 버전 실패412. 최초201, 기존200입니다.
- 동일 목표 상태의 재요청은 부작용을 반복하지 않습니다. 버전 헤더가 오래되면 상태가 같더라도412일 수 있으므로 조회로 결과를 확인합니다.
- 본문을 읽지 않고 toggle을 재실행하는 구 API 방식은 새 계약에서 사용하지 않습니다.

## 오류 및 HTTP 클라이언트 예시

[오류 사전](errors.md)의 안정된 code로 분기합니다. SQL·스택·토큰·개인 본문은 오류 응답에 포함하지 않습니다.

```js
// 실제 base URL/인증 연결 후 사용하는 예시. 비밀값 하드코딩 금지.
export async function requestApi(baseUrl, path, { token, method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (response.status === 204) return null
  const payload = await response.json()
  if (!response.ok) {
    const error = new Error(payload.message ?? '요청 실패')
    Object.assign(error, { status: response.status, code: payload.error?.code, fields: payload.error?.fields, requestId: payload.meta?.requestId })
    throw error
  }
  return { data: payload.data, etag: response.headers.get('ETag') }
}
```

자동 retry는 위 예시에 포함하지 않았습니다. 인증 갱신 1회, 멱등키 보존, Retry-After 및 충돌 UI가 먼저 설계되어야 합니다. 실제 배포는 CORS allowlist와 노출 헤더 `ETag,Location,X-Request-Id,Retry-After`, 허용 헤더 `If-Match,If-None-Match,Idempotency-Key,X-CSRF-Token`을 추가해야 합니다.

## 이전 문서와의 우선순위

기존 [API 목록서](../api/api-catalog.md)의114개 ID를 모두 유지하고 누락 영역을 추가했습니다. 이번 상세 문서/OpenAPI가 목표 v1의 구체화 기준입니다. 변경점: WBS/근무/커뮤니티 생성/멤버십/챌린지/태그·멘션/대화방/배치 저장 추가, RoutineWrite durationMin·목표 필드 추가, 알림 사전시간 상한1440분, 본문 명칭 body 통일, native 인증 분리, 그룹 초대 수락·비동기 작업 조회 경로 보완. 현재 API의 `note`, `name`, `days` 등을 자동으로 새 필드로 바꾸지 않습니다.

기계 판독 계약은 [OpenAPI 3.1.1 공식 규격](https://spec.openapis.org/oas/v3.1.1.html)에 맞춰 작성했습니다. OAuth의 PKCE·redirect 검증·토큰 보호 원칙은 [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)을 참고했습니다. 특정 규격이 최신이라는 주장이나 실제 운영 보안 인증을 뜻하지 않습니다.
