# Timebar Diary 작업 요청 예문

예문은 사용자가 선택해 요청할 때의 참고 자료이며 지금 실행할 지시가 아니다. 프로젝트 루트 기준 경로를 사용한다.

- 기능. `$feature-with-security로 [기능]을 구현해줘. 실제 Vue·Spring 소스와 관련 테스트를 확인하고 변경 범위의 보안·접근성을 검증해줘.`
- UI. `$ui-with-accessibility로 [화면]을 수정해줘. DESIGN.md 전체와 .omd/preferences.md를 먼저 읽고 키보드·초점·오류 상태를 확인해줘.`
- 버그. `$safe-debug로 [오류]를 재현하고 최소 수정해줘. 원인과 실제 회귀 테스트 결과를 남겨줘.`
- API. `$api-contract-review로 [API]의 DTO·클라이언트·소유권·version 충돌·실패 응답을 검토해줘.`
- DB. `$database-change-review로 [변경]의 Flyway 경로·이력·기존 데이터·락·복구 영향을 검토해줘.`
- 보안. `$secure-code-review로 [범위]를 검토해줘. 근거·위치·수정안과 미실행 검사를 구분해줘.`
- 웹. `$web-vulnerability-review로 [허가된 로컬 시험 범위]를 검토해줘. 운영·외부 시스템은 범위에 포함하지 마.`
- 접근성. `$web-accessibility-review로 [화면]을 점검하고 자동·키보드·보조기술 결과를 나눠 기록해줘.`
- 릴리스. `$release-security-gate로 후보 변경을 검토하고 테스트·보안·DB 복구·미확인을 보고해줘. 배포는 실행하지 마.`
- 재개. `$document-evidence-handoff로 docs/agent/records/2026-11-14-codex-kit의 기록과 현재 git status를 확인하고 미완료 항목부터 이어서 진행해줘.`
- JSP 자료. `JSP 진단 보고서를 별도로 제공했을 때만 $jsp-finding-triage로 후보를 분류해줘. Vue 파일에 JSP 예외를 적용하지 마.`
