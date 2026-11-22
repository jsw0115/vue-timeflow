# 검증 기록

- 실행 일시/환경: 2026-11-22, Windows 11, Node(프로젝트 런타임), Vite dev 서버 127.0.0.1:5173, Chrome(playwright-core 1.49.1, 세션 임시 폴더에만 설치 — 프로젝트 의존성 아님). 백엔드는 띄우지 않고 `/api/**`를 `{ success, data }` 가짜 응답으로 대체해 로그인 상태를 캡처했다.
- 명령/버전/종료코드:
  - `node --test tests/career-ledger.test.mjs tests/career-store.test.mjs` → 17/17 통과, 종료 0 — PASS
  - `node --test tests/design-tokens.test.mjs` → 8/8 통과 — PASS (처음에는 `.career-mark.next`의 accent 채움으로 1건 실패 → 고리 강조로 바꿔 해결)
  - `$testFiles = (Get-ChildItem tests/*.test.mjs).FullName; node --test --test-concurrency=1 $testFiles` → 322건 중 321 통과, 1 실패, 종료 1 — FAIL(기존): `UT-235`(weekday-mode.test.mjs:19)는 이번에 손대지 않은 `PostComposer.vue`·`RoutineListView.vue` 원문을 검사한다. 두 파일의 마지막 수정 커밋은 a1266b5이고 이번 작업에서는 수정하지 않았다.
  - `npm run build:web` → 빌드 성공, 종료 0 — PASS (기존 청크 크기 경고만 출력)
- 실제 화면 확인: 1440·1024·390·320px, 라이트·다크·세피아+플럼, 목표 4종 중 취업 준비·이직 준비·재직 중 성장의 영역 순서, 목표 선택 창 열림(선택됨 표시), 지원 기록 불러오기 실패, 경력 빈 상태, 로그아웃 — 모두 가로 넘침 0px. 시간축은 2배율로 확대해 확인했다 — PASS(눈으로 확인)
- 보안: 입력·인증·권한·업로드·쿼리 변경 없음, v-html 없음 — N/A
- 웹 접근성: 색 외 구분(●/◆/고리 모양 + "지원 마감"·"면접" 글), 장식 그래픽 `aria-hidden` + 같은 정보의 목록·범례, 목표 안내 문장 `aria-describedby`, 한국어 keep-all — REVIEW(눈으로 확인). 자동 대비 측정·스크린리더 실기 — NOT_RUN
- 오탐 제외: 없음
- 남은 위험과 승인 필요: 누적 막대 30% 단계의 비텍스트 대비가 3:1 미만일 수 있다(수치는 글로 제공). 커밋은 요청 없어 하지 않았다.
