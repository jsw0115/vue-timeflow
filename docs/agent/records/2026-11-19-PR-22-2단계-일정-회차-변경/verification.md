# 검증 기록

- 실행 일시/환경: 2026-11-19, Windows 11, JDK 17(Gradle Wrapper)·H2, Node 20.18.0(요구 버전 미달은 PR-06), Python 3.12.4, Chrome(헤드리스), Vite 개발 서버. 백엔드 서버는 실행하지 않았다(일정 화면은 브라우저 저장).
- 명령/버전/종료코드
  - 수정 전 `backend`에서 `gradlew.bat test --tests OccurrenceOverrideTest --tests InsightServiceTest`: 종료 1. 10개 중 5개 실패(의도한 실패). 통과 2개는 기존 동작을 지키는 회귀 검사. FAIL
  - 수정 전 `frontend`에서 `node --test tests/occurrence-edit.test.mjs`: 종료 1(새 도우미 내보내기 없음). `writing-flows`의 UT-256: 종료 1. FAIL
  - 수정 후 서버 OccurrenceOverrideTest 6·InsightServiceTest 4·RecurrenceExceptionTest 7, 프런트 occurrence-edit 6·recurrence-exceptions 4·writing-flows 16: 모두 통과. PASS
  - `backend`에서 `gradlew.bat test --rerun --console=plain`: 종료 0, 26개 클래스 218개, 실패·오류·건너뜀 0. PASS
  - `frontend`에서 Node 테스트 전체(`--test-concurrency=1`): 109개 실패 0. PASS
  - `npm run build:web`: 종료 0(500 kB 청크 경고는 기존, PR-18). PASS
  - `node scripts/frontend-api-contract.mjs`(생성) 후 `--check`: 종료 0, 286개 작업·198개 스키마. `node scripts/api-inventory.mjs --check`: 종료 0. PASS
  - 헤드리스 Chrome CDP 점검(임시 스크립트): 17개 항목 통과. 첫 실행 2개 실패는 점검 스크립트 선택자 문제. 시간 입력 정렬을 고친 뒤 재실행. PASS
  - 마지막 수정 뒤 전체 재실행(프런트·백엔드·빌드·계약·문서·키트·`git diff --check`): 결과는 07 RUN-66.
- 실제 테스트 결과: 07 RUN-62~RUN-66.
- 보안: override 입력 검증(UT-253), 루틴 override 거부, 소유권 경로 변경 없음, 텍스트 보간 출력. PASS(변경 범위 한정)
- 웹 접근성: 범위 선택 `aria-pressed`, 라벨·`fieldset`, 되돌리기 `aria-label`, 상태 문구 `role="status"`, 320px 넘침 없음. 키보드·화면낭독기·200% 확대 실점검 NOT_RUN. KWCAG 전체 통과가 아니다.
- 오탐 제외: 없음.
- 남은 위험과 승인 필요: PR-07 서버 연결 때 분할의 두 요청 실패 처리(06 IM-14 위험 표). 회차 날짜 옮기기 미지원. Q-19·Q-20 결정 대기.
