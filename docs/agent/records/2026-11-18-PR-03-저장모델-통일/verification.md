# 검증 기록

- 실행 일시/환경: 2026-11-18, Windows 11, JDK 17(Gradle Wrapper), H2(MySQL 모드)·MockMvc, Node 20.18.0.
- 명령/버전/종료코드
  - 수정 전 `gradlew.bat test --tests "kr.timebar.diary.records.InsightServiceTest"`: 종료 1. 3개 중 2개 실패(계획 시간 150, 기대 90. 홈 요약에 구형 루틴). 의도한 실패. FAIL
  - 수정 후 `InsightServiceTest`, `ApiDeprecationTest`, `ActualRecordingTest`: 11개 통과. PASS
  - 템플릿 적용 수정 전 `FeatureHttpTest`: 23개 중 1개 실패(`applyingAnEventTemplateCreatesANewModelSchedule`, 응답 data null). 의도한 실패. FAIL
  - `backend`에서 `gradlew.bat test --rerun --console=plain`: 종료 0. 24개 클래스 204개, 실패·오류·건너뜀 0. PASS
  - `frontend`에서 Node 테스트 전체(`--test-concurrency=1`): 69개, 실패 0. PASS
  - `node frontend/scripts/api-inventory.mjs --check`: 종료 0, 286개 경로. PASS
  - `node frontend/scripts/frontend-api-contract.mjs --check`: 종료 0, 286개 작업·197개 스키마. PASS
  - `python scripts/docs/verify_documentation.py`: 종료 0, 오류 0. PASS
  - `git diff --check`(자체 변경 파일 범위): 종료 0. PASS. 전체 작업 트리는 사용자 미커밋 `Modal.vue` 51·53행 줄 끝 공백으로 종료 2(이번 변경 아님)
- 실제 테스트 결과: 07 RUN-23~RUN-29에 기록.
- 보안: context-notes의 보안 점검 참조. 소유권 404·입력 검증 400을 테스트로 확인.
- 웹 접근성: UI 변경 없음. N/A
- 오탐 제외: 없음.
- 남은 위험과 승인 필요: 운영 DB에 구형 `events`·`routine` 자료가 있으면 통계에서 빠진다. 자료 확인과 이전은 PR-21(사용자 승인 필요). Node 요구 버전 재실행은 PR-06.
