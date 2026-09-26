# 오류 코드·예외 처리 사전

**목표 /api/v1 계약**. 현재 /api는 error.code를 직렬화하지 않습니다. [현재 계약](current-contract.md)과 구분하세요.

| HTTP | error.code | 원인 | 해결 방법 |
|---|---|---|---|
| 400 | VALIDATION_FAILED | 형식·필수 파라미터·알 수 없는 필드가 잘못됨 | error.fields의 path에 해당하는 입력을 수정 후 재요청 |
| 401 | TOKEN_INVALID | 인증 누락·서명 오류·폐기된 세션 | 세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음 |
| 401 | TOKEN_EXPIRED | access token 만료 | refresh 1회만 시도; refresh도 실패하면 로그인 |
| 401 | INVALID_CREDENTIALS | 이메일 또는 비밀번호 불일치 | 입력 확인; 어떤 항목이 틀렸는지 노출하지 않음 |
| 403 | FORBIDDEN | ADMIN·OWNER·멤버십 등 기능 권한 부족 | 승인된 권한을 확인; 같은 요청 자동 재시도 금지 |
| 403 | CSRF_REJECTED | Origin/CSRF token 불일치 | 등록된 브라우저 origin 및 CSRF 쿠키/헤더를 갱신 |
| 404 | NOT_FOUND | 대상 없음 또는 다른 사람의 비공개 리소스 | ID와 접근권한을 확인; 존재 여부 추측 금지 |
| 409 | DUPLICATE_EMAIL | 정규화 이메일 중복 | 로그인/비밀번호 재설정 안내; 공개 메시지는 과도한 정보 제외 |
| 409 | IDEMPOTENCY_CONFLICT | 같은 멱등키에 다른 요청 본문 | 동일 요청은 원래 키, 새 의도는 새 UUID 사용 |
| 409 | TIME_OVERLAP | ACTUAL 블록이 기존 실제 시간과 겹침 | 허용된 충돌 ID의 시간을 조회하고 조정 |
| 403 | MEMBERSHIP_REQUIRED | 승인된 커뮤니티 회원이 아님 | 가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지 |
| 409 | CAPACITY_EXCEEDED | 커뮤니티 정원 초과 | 모집 상태 재조회; 다른 커뮤니티 선택 |
| 409 | OWNER_REQUIRED | 마지막 소유자 탈퇴·제거 시도 | 소유권 이전 또는 그룹 삭제 정책 적용 |
| 409 | HAS_CHILDREN | WBS에 하위 작업이 있음 | 하위 작업 이동/삭제 후 다시 요청 |
| 409 | STATE_CONFLICT | 진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌 | 최신 상태를 조회하고 허용된 항목만 변경 |
| 410 | SYNC_RESET_REQUIRED | 변경 커서 보관기간 30일 경과 | 전체 스냅샷 재동기화; 미전송 로컬 변경은 별도 보존 |
| 412 | VERSION_CONFLICT | If-Match와 현재 버전 불일치 | 최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지 |
| 428 | PRECONDITION_REQUIRED | 필수 If-Match 또는 If-None-Match 누락 | GET의 ETag 또는 신규 생성 * 전송 |
| 422 | INVALID_RANGE | 종료<=시작, 날짜 범위 초과, 잘못된 조건 조합 | 해당 지역 시간과 타입별 필수 필드 확인 |
| 413 | CONTENT_TOO_LARGE | 목적별 본문/파일 크기 상한 초과 | 크기를 줄이거나 분할 업로드 |
| 415 | UNSUPPORTED_MEDIA | Content-Type/MIME 불허 | 허용 MIME 및 요청 Content-Type 사용 |
| 429 | RATE_LIMITED | 계정/IP/기기별 제한 | Retry-After 이후 jitter를 포함해 제한적 재시도 |
| 503 | UPSTREAM_UNAVAILABLE | 메일·푸시·AI·외부 캘린더 일시 장애 | 작업 상태 조회; 서버는 outbox 재시도, 중복 제출 금지 |
| 500 | INTERNAL_ERROR | 예상하지 못한 서버 오류 | requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지 |

## 오류 응답 예시

```json
{
  "success": false,
  "data": null,
  "message": "종료<=시작, 날짜 범위 초과, 잘못된 조건 조합",
  "error": {
    "code": "INVALID_RANGE",
    "fields": [
      {
        "path": "endAt",
        "reason": "시작보다 늦은 시각 입력"
      }
    ]
  },
  "meta": {
    "requestId": "req-example",
    "serverTime": "2026-09-26T00:00:00Z"
  }
}
```

파라미터 오류에는 원문 비밀번호/토큰/SQL/파일 경로를 넣지 않습니다. 401 재발급은 단일 실행 잠금으로 묶고, 403/404/409/412는 자동 반복하지 않습니다. 429/503은 Retry-After와 지수 backoff+jitter, 최대 시도 수를 적용합니다. 202 작업의 실제 실패는 조회 응답 status=FAILED와 errorCode로 표현합니다.
