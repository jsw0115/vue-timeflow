---
name: api-contract-review
description: API·WebSocket·외부 시스템 연동의 계약과 인증·권한·입력·오류를 검토할 때 사용한다.
---

# api-contract-review

문서·명령 경로는 프로젝트 루트 기준이다. 기존 `AGENTS.md`와 `PROJECT_CONTEXT.md`를 함께 따른다.

Timebar Diary는 REST·SSE와 Bearer JWT를 사용한다. `docs/api/README.md`, `frontend/src/features/auth/session.js`, `backend/src/main/java/kr/timebar/diary/security/SecurityConfig.java`를 실제 대상과 대조한다. WebSocket이 있다고 가정하지 않는다.


1. `API_SPEC.md`와 실제 Controller/Schema/클라이언트를 확인한다.
2. 인증·리소스 소유권(IDOR)·CSRF·CORS·입력 제한·오류 노출·재시도/멱등성 검토.
3. 스텁/목업/로컬/실연동 검증을 구분하고 시험 환경·승인 범위 기록.
4. 실제 외부 호출이나 비밀값 공유는 사용자 허가 없이 수행하지 않는다.
