# 검증 기록

- 실행 일시/환경: 2026-11-23, Windows 11, 격리 DB(infra/chat compose) + chat-local 백엔드 + Vite, Chrome(playwright-core, 세션 임시 폴더). 데모 계정 김지원, 브라우저 시계 2026-11-22 16:20 KST 고정.
- 명령/결과
  - `node --test tests/design-tokens.test.mjs` → 8/8 — PASS (중간에 components.css의 날 px 2건으로 실패 → `--row-height` 토큰·간격 토큰으로 바꿔 해결)
  - 전체 `node --test --test-concurrency=1 tests/*.test.mjs` → 322 중 321 통과 — FAIL(기존): UT-235는 Windows 작업본 CRLF 때문에 로컬에서만 실패(손대지 않은 PostComposer·RoutineListView, 색인은 LF).
  - 채팅 빈 상태 수정 뒤 `design-tokens·stats-client·career-ledger` 26/26 — PASS, `vite build` — PASS
  - `npm run build:web` → 성공 — PASS
  - 가로 넘침 점검(sweep.mjs): 390px·320px에서 사용자 화면·플래너 보기·환경설정·로그인·가입·약관 72개, 넘침 0 — PASS
  - 1440px 전 화면 재캡처 106장(r2) 썸네일 검수 — REVIEW(눈으로 확인). 마지막 수정 뒤 재캡처(r3)는 94장에서 메모리 부족으로 자동 종료됨. 통계 보드·머니로그는 r3에서 확인.
  - 390px 홈·할 일·머니로그·통계 보드 — REVIEW(눈으로 확인)
- 보안: 입력·인증·권한·쿼리 변경 없음 — N/A
- 접근성: aria-label 바인딩 버그 2곳 수정, 메뉴 묶음 aria-expanded, 아이콘 버튼 이름, 고정 버튼 aria-pressed — REVIEW. 자동 대비 측정·스크린리더 실기 — NOT_RUN
- 남은 위험: r3 나머지 12장(관리자 화면 일부·커뮤니티/채팅 보정 화면) 미재확인. 다크·세피아 테마 전 화면 재확인 NOT_RUN(토큰만 써서 영향은 작을 것으로 봄).
