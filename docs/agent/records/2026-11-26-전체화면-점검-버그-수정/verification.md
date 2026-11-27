# 검증 기록

- 실행 일시/환경: 2026-11-26, 클라우드 컨테이너(Linux), Node 22.23.5, Chromium(Playwright), `vite preview`. 실제 백엔드·운영 DB는 쓰지 않았다.
- 명령/버전/종료코드: 아래 표.
- 실제 테스트 결과: 아래 표. 상세는 dev-docs 07 RUN-289.
- 보안: N/A. 입출력·인증·권한·저장 경로를 바꾸지 않았다.
- 웹 접근성: REVIEW. 입력칸 이름 7곳, 스위치 역할·상태, 약관 뒤로 가기 키보드 접근을 브라우저로 확인했다. 정식 KWCAG 점검은 하지 않았다.
- 오탐 제외: 글양식 스위치 "이름 없는 버튼"(자동 점검 오탐, context-notes.md).
- 남은 위험과 승인 필요: IMP-015~IMP-018은 사용자 결정 대기. 업무 히스토리 값은 여전히 시연 예시다(표시만 붙임).

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
|---|---|---:|---|---|
| 새 회귀 시험 | `node --test tests/browser-check-fixes.test.mjs` | 0 | 6개 통과 | PASS |
| 프런트 전체 | `node --test --test-concurrency=1 <tests/*.test.mjs 중 device-preview 제외>` | 0 | 387개 통과 | PASS |
| 프로덕션 빌드 | `npm run build:web` | 0 | 빌드 성공 | PASS |
| 브라우저 자동 점검 | `vite preview` + Chromium, 106개 경로 × 5조건 | - | 페이지 오류 0, 가로 넘침 0, lang 불일치 0, 라벨 없는 입력칸 0 | PASS |
| 목록 불러오기 실패 | 로그인 + 목록 API 404·500, 화면 10개 | - | 20/20 실패 안내, 다시 시도 시 재요청 | PASS |
| 접근성 동작 | 접근성 스냅숏·키보드 | - | 스위치 checked 전환, 뒤로 가기 Tab·Enter | PASS |
| device-preview 시험 | 실행하지 않음 | - | 이 컨테이너에서 기존부터 멈추는 시험 | NOT_RUN |
| 문서 구조 | `python3 scripts/docs/verify_documentation.py` | 0 | 오류 0 | PASS |
| 에이전트 키트 | `python3 -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |

## 이어서: IMP-015~IMP-018

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
|---|---|---:|---|---|
| 회귀 시험 | `node --test tests/browser-check-fixes.test.mjs` | 0 | 10개 통과(4개 추가) | PASS |
| 프런트 전체 | `node --test --test-concurrency=1 <tests/*.test.mjs 중 device-preview 제외>` | 0 | 391개 통과 | PASS |
| 프로덕션 빌드 | `npm run build:web` | 0 | 빌드 성공 | PASS |
| 브라우저 확인 | `vite preview` + Chromium, 고친 6개 화면 × 영어·한국어 1440px, 영어 320px | 0 | "G" 대비 13.3:1, 시연 표시 2곳, 처음 열 이름 영어·바꾼 열 그대로·저장값 한국어, 루틴 "1 time"/"1회", 점검 버튼 0, 가로 넘침 0, 페이지·콘솔 오류 0 | PASS |
| 다른 표면의 "G" 대비 | 실행하지 않음 | - | 다크·세피아·고대비는 확인하지 않음. K·A 글자와 같은 토큰이다 | NOT_RUN |
| device-preview 시험 | 실행하지 않음 | - | 이 컨테이너에서 기존부터 멈추는 시험 | NOT_RUN |
| 문서 구조 | `python3 scripts/docs/verify_documentation.py` | 0 | 오류 0 | PASS |
| 에이전트 키트 | `python3 -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |
