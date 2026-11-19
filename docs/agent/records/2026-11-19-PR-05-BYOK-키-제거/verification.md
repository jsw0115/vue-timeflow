# 검증 기록

- 실행 일시/환경: 2026-11-19, Windows 11, Node 20.18.0(PC 기본, 요구 버전 미달은 PR-06), Python 3.12.4, Chrome(헤드리스), Vite 개발 서버. 백엔드는 실행하지 않았다.
- 명령/버전/종료코드
  - 수정 전 `frontend`에서 `node --test tests/ai-settings.test.mjs`: 종료 1. 10개 모두 실패(의도한 실패). FAIL
  - 수정 후 같은 명령: 종료 0. 10개 통과. PASS
  - `frontend`에서 `node --test --test-concurrency=1 tests/*.test.mjs`: 종료 0. 102개, 실패 0. PASS
  - `npm run build:web`: 종료 0. 500 kB 청크 경고는 기존 항목(PR-18). PASS
  - `node scripts/frontend-api-contract.mjs --check`: 종료 0, 286개 작업·198개 스키마. PASS
  - 헤드리스 Chrome CDP 점검(임시 스크립트, 제공 상태 응답 가로채기): 24개 항목 통과. 첫 실행은 가로채기 패턴 `*/api/*`가 앱 모듈 `features/chat/api/chatApi.js`를 잡아 앱이 뜨지 않아 무효였고, 패턴을 `http://127.0.0.1:5173/api/*`로 좁혀 재실행. PASS
  - `python scripts/docs/verify_documentation.py`: 종료 0, 오류 0. PASS
  - `python -B scripts/verify_agent_kit.py`: 종료 0. PASS
  - `git diff --check`(자체 변경 파일): 오류 없음. PASS. 전체 작업 트리는 사용자 미커밋 `Modal.vue` 줄 끝 공백으로 종료 2(이번 변경 아님)
- 실제 테스트 결과: 07 RUN-57~RUN-61에 기록.
- 보안: 중요정보 평문 저장 제거(UT-110·UT-112·UT-113), 사실과 다른 상태 표시 제거(UT-115·UT-116). 서버·권한 변경 없음. PASS(변경 범위 한정)
- 웹 접근성: BYOK `disabled`·`aria-disabled`, 비활성 스위치 이유 문구 `aria-describedby`, 상태 배지 `role="status"`, 조회 실패 `role="alert"`, 새 문장은 대비 기준 통과 색. 키보드·화면낭독기·320px·200% 실점검은 NOT_RUN. KWCAG 전체 통과를 뜻하지 않는다.
- 오탐 제외: 없음.
- 남은 위험과 승인 필요: 경력 문장 생성은 규칙 기반이라 서버 `ai=true`가 되면 문구가 실제와 달라질 수 있다(PR-15에서 함께 수정). 상용 AI 경로의 서버 키 관리·자료 동의 설계는 PR-15. 실제 백엔드와 연결한 종단 점검은 NOT_RUN(모의 응답).
