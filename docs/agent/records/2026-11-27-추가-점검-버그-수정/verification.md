# 검증 기록

- 실행 일시/환경: 2026-11-27(KST), 컨테이너 Linux, Node 22.23.5, Chromium(Playwright), Docker(격리 MySQL 8.4·Redis 7.4), `chat-local` 백엔드.

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
|---|---|---:|---|---|
| 회귀 시험 | `node --test tests/browser-check-fixes.test.mjs` | 0 | 16개 통과(6개 추가) | PASS |
| 프런트 전체 | `node --test --test-concurrency=1 <tests/*.test.mjs 중 device-preview 제외>` | 0 | 397개 통과 | PASS |
| 프로덕션 빌드 | `npm run build:web` | 0 | 빌드 성공 | PASS |
| 링크 색 전후 비교 | `vite preview` + Chromium, 106개 경로 × 라이트 로그인·다크 로그아웃 | 0 | 의도한 링크만 바뀜, 기본 파랑 0 | PASS |
| 자동 점검 | 106개 경로 × 4조건(다크 한국어·다크 영어 로그인·라이트 영어 로그인·320px 영어) | 0 | 오류 0, 넘침 0, 대비 부족 0, lang 불일치 0 | PASS |
| 키보드 | 본문 바로가기(사용자·관리자 셸) | 0 | 첫 Tab 표시, Enter로 main 초점, 주소 그대로 | PASS |
| 실제 백엔드 | `vite` 개발 서버 + Chromium | 0 | 영어 서버 문구, 관리자 버튼(일반·관리자), 메모 수정·409 비교·삭제 | PASS |
| device-preview 시험 | 실행하지 않음 | - | 이 컨테이너에서 기존부터 멈추는 시험 | NOT_RUN |
| 화면 읽기 프로그램·실기기 | 실행하지 않음 | - | 이 환경에 없다 | NOT_RUN |
| 문서 구조 | `python3 scripts/docs/verify_documentation.py` | 0 | 오류 0 | PASS |
| 에이전트 키트 | `python3 -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |

- 보안: 관리자 API 권한 검사는 서버가 그대로 한다. 버튼은 표시 편의일 뿐 보안 통제가 아니다. 점검용 계정의 역할 변경은 격리 DB에서만 했다.
- 웹 접근성: 대비, 6.4.1 반복 영역 건너뛰기, 버튼 이름. 정식 KWCAG 점검 아님.
- 오탐 제외: 글양식 스위치 이름(이전 점검과 같음).
- 남은 위험과 승인 필요: 없음(푸시 허용 범위 안).
