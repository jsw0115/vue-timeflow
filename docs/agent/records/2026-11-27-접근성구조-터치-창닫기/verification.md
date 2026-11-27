# 검증 기록

- 실행 일시/환경: 2026-11-27(KST), 컨테이너 Linux, Node 22.23.5, Chromium(Playwright).

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
|---|---|---:|---|---|
| 프런트 전체 | `node --test --test-concurrency=1 tests/*.test.mjs` | 0 | 406개 통과 | PASS |
| 프로덕션 빌드 | `npm run build:web` | 0 | 빌드 성공 | PASS |
| 화면 비교 | 수정 전 커밋 빌드(4174)와 수정 후(4173), 106개 경로 × 390·1440px | 0 | 시각·일간 통계 영역 말고 같음 | PASS |
| 접근성 구조 | 106개 경로 | 0 | main·h1 문제 0 | PASS |
| 터치 영역 | iPhone 13 에뮬레이션 | 0 | 넓힌 대상 100% 반응, 24px 미만 92→46 | PASS |
| 뒤로 가기와 창 | 빈 창·쓴 창·주소로 여는 창 | 0 | 기대대로 | PASS |
| 자동 점검 | 4조건 × 106개 경로 | 0 | 오류·넘침·대비 부족·lang 불일치 0 | PASS |
| 남은 작은 터치 대상 | - | - | IMP-026으로 등록 | REVIEW |
| 문서 구조 | `python3 scripts/docs/verify_documentation.py` | 0 | 오류 0 | PASS |
| 에이전트 키트 | `python3 -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |
