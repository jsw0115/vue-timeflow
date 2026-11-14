# API 검토 진입점

현재 명세는 [API 안내](docs/api/README.md) → [operation 목록](docs/api/frontend-backend-2026-10-10/catalog.md) → [상세 계약](docs/api/frontend-backend-2026-10-10/specification.md) → [OpenAPI](docs/api/frontend-backend-2026-10-10/openapi.json) 순서로 읽고 실제 Controller·DTO·Service와 대조한다.

- 일반 응답은 success·data·message이나 SSE·파일·채팅·HTTP 상태는 각 계약을 따른다.
- Bearer JWT, 익명·만료·타인 소유권·ADMIN, 입력 한도, 중복·version 충돌, 오류 정보 노출을 검토한다.
- 클라이언트 인증·갱신은 [session.js](frontend/src/features/auth/session.js), 서버 인가는 [security 패키지](backend/src/main/java/kr/timebar/diary/security)에서 시작한다.
- CORS·CSRF는 실제 인증 운반 방식과 상태 변경 경로를 기준으로 검토한다. 현재 설정을 모든 미래 기능의 안전 근거로 쓰지 않는다.
- [채팅 프로토콜](docs/chat/api/design.md)과 [외부 제공자 미연결 경계](docs/api/frontend-backend-2026-10-10/integrations.md)를 구분한다.

프로젝트 루트에서 현재 계약 검사를 실행한다.

```powershell
node frontend/scripts/api-inventory.mjs --check
node frontend/scripts/frontend-api-contract.mjs --check
```

정적 계약 검사는 실제 HTTP·DB·외부 서비스 연동 시험을 대체하지 않는다.
