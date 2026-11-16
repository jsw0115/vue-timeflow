# 검증 기록

- 실행일. 2026-11-16, Windows 로컬 작업 공간.
- P0-1 상태 테스트. PASS. `frontend`에서 `node --test tests/capability-status.test.mjs tests/integration-status.test.mjs`, 종료 0, 7개 통과. 미연결·잘못된 응답·조회 실패·재시도·계정/기능 전환·로그아웃·화면 종료 검증.
- 웹 빌드. PASS. `frontend`에서 `npm run build:web`, 종료 0. 기존 500 kB 초과 번들 경고는 남아 있다.
- 문서 검사. PASS. `python scripts/docs/verify_documentation.py`, 종료 0, 검사 범위의 오류 0.
- 전체 작업 트리 공백 검사. REVIEW. `git diff --check`에서 기존 사용자 변경인 `Modal.vue` 51·53행의 공백 경고가 있다. 해당 파일은 수정하지 않는다. 자체 변경은 별도로 검사한다.
- 검증 범위. Node 화면/상태 테스트, Vite 빌드, H2/MySQL 모드·MockMvc 서버 회귀, API 계약·문서 검사.
- 운영 MySQL migration·실제 프록시 업로드·외부 제공자·보조공학 전체 검사. NOT_RUN. 운영 승인이나 외부 계약 검수를 수행한 것으로 표시하지 않는다.
- 오탐 제외. 없음. JSP는 변경 범위에 없어 N/A다.
- P0-1 보안. PASS. 변경 범위에서 외부 실행·카드 정보 입력과 로컬 성공 변조를 제거했다. 상태는 인증 API로 확인하고 Vue 텍스트로 표시한다. SC-37·38·44, 웹 PV·XS, OWASP A06·A10에 해당한다.
- UI 접근성. 상태/오류의 role, 시맨틱 재시도 button과 기존 focus-visible 스타일을 소스에서 확인했다. 실제 키보드·320px·200% 확대·화면낭독기 검사는 NOT_RUN이며 KWCAG 전체 통과를 뜻하지 않는다.
