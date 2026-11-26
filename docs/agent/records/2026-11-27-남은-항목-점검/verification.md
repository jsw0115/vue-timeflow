# 검증 기록

- 실행 일시/환경: 2026-11-27(KST), 컨테이너 Linux, Node 22.23.5, Chromium(Playwright), Docker(격리 MySQL 8.4·Redis 7.4), `chat-local` 백엔드.

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
|---|---|---:|---|---|
| 프런트 전체(device-preview 포함) | `node --test --test-concurrency=1 tests/*.test.mjs` | 0 | 400개 통과 | PASS |
| 프로덕션 빌드 | `npm run build:web` | 0 | 빌드 성공 | PASS |
| 관리자 버튼 재확인 | 가짜 API(첫 응답 503) + Chromium | 0 | 실패 뒤 화면 이동 때 다시 확인해 버튼 보임 | PASS |
| 실제 글꼴 | Pretendard 7조건 × 106개 경로 | 0 | 오류·넘침·대비 부족 0 | PASS |
| 사용자 지정 색·시스템 설정 | 8조건 × 106개 경로 | 0 | 오류·넘침·대비 부족 0 | PASS |
| 실제 백엔드 다중 계정 | 커뮤니티·채팅·공유·파일·관리자·로그인 제한 | 0 | 모두 기대대로 | PASS |
| 정지된 계정의 열린 화면 | 관리자 정지 후 새로고침 | 0 | 안내 없이 로그아웃(BUG-015) | FAIL |
| 접근성 구조(화면 읽기 프로그램 대신) | 106개 경로 | 0 | 페이지 제목 같음(BUG-016), main·h1(IMP-023) | FAIL |
| 기기 에뮬레이션(실기기 대신) | 4기기 × 106개 경로 | 0 | 넘침·오류 0, 메뉴 정상, 작은 터치 대상(IMP-024) | REVIEW |
| 뒤로 가기와 대화 상자 | 5가지 | 0 | 앱 셸 창이 남음(IMP-025) | REVIEW |
| 화면 읽기 프로그램·실기기 | 실행하지 않음 | - | 이 환경에 없다 | NOT_RUN |
| 문서 구조 | `python3 scripts/docs/verify_documentation.py` | 0 | 오류 0 | PASS |
| 에이전트 키트 | `python3 -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |

- 보안: 관리자 API 권한 검사는 서버가 그대로 한다. 역할 변경·정지는 격리 DB의 점검용 계정에만 했다.
- 웹 접근성: 6.4.2 제목 제공(BUG-016), 터치 대상(IMP-024). 정식 KWCAG 점검 아님.
- 남은 위험과 승인 필요: BUG-015·BUG-016 수정과 IMP-023~IMP-025 결정.
