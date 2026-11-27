# 검증 기록

- 실행 일시/환경: 2026-11-27(KST), 컨테이너 Linux, Node 22.23.5, Vite 6.4.3, Chromium(Playwright), Docker(격리 MySQL 8.4·Redis 7.4), `chat-local` 백엔드.

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
|---|---|---:|---|---|
| 회귀 시험 | `node --test tests/browser-check-fixes.test.mjs` | 0 | 19개 통과(3개 추가) | PASS |
| 미리보기 시험 | `node --test tests/device-preview.test.mjs`(캐시 있음 2번, 캐시 치운 상태 1번) | 0 | 3개 통과 | PASS |
| 프런트 전체 | `node --test --test-concurrency=1 tests/*.test.mjs` | 0 | 403개 통과 | PASS |
| 프로덕션 빌드 | `npm run build:web` | 0 | 빌드 성공 | PASS |
| 세션 종료 안내 | 실제 백엔드, 관리자 정지 뒤 새로고침(한국어·영어) | 0 | 안내·로그인 화면 안내·재로그인 뒤 사라짐·직접 로그아웃 뒤 없음 | PASS |
| 탭 제목 | `vite preview` + Chromium, 106개 경로(한국어·영어) | 0 | 기본 제목 0, 영어 제목 한글 0 | PASS |
| 자동 점검 | 2조건 × 106개 경로 | 0 | 오류·넘침·대비 부족·lang 불일치 0 | PASS |
| 문서 구조 | `python3 scripts/docs/verify_documentation.py` | 0 | 오류 0 | PASS |
| 에이전트 키트 | `python3 -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |

- 보안: 세션을 지우는 조건은 바꾸지 않았다. 관리자 정지는 격리 DB의 점검용 계정에만 했다.
- 웹 접근성: 6.4.2 제목 제공. 정식 KWCAG 점검 아님.
- 남은 위험과 승인 필요: IMP-023~IMP-025 결정.
