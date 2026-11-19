# 검증 기록(1단계)

- 실행 일시/환경: 2026-11-19, Windows 11, JDK 17(Gradle Wrapper)·H2, Node 20.18.0(요구 버전 미달은 PR-06), Python 3.12.4. 격리 MySQL·브라우저는 쓰지 않았다(화면 변경 없음).
- 명령/버전/종료코드
  - 수정 전 `backend`에서 `gradlew.bat test --tests kr.timebar.diary.task.TaskVersionTest`: 종료 1(컴파일 오류, version 없음). 의도한 실패. FAIL
  - 수정 전 `frontend`에서 `node --test tests/record-client.test.mjs`: 종료 1(모듈 없음). 의도한 실패. FAIL
  - 수정 후 `gradlew.bat test --tests "kr.timebar.diary.task.*"`: 종료 0. TaskVersionTest 5, TaskMutationLockTest 1, 체크리스트·담당자 48. PASS
  - 수정 후 `node --test tests/record-client.test.mjs`: 6개 통과. PASS
  - `frontend`에서 Node 테스트 전체(`--test-concurrency=1`): 115개 실패 0. PASS
  - `npm run build:web`: 종료 0(500 kB 청크 경고는 기존, PR-18). PASS
  - `node scripts/frontend-api-contract.mjs`(생성) 후 `--check`: 종료 0, 286개 작업·198개 스키마. `node scripts/api-inventory.mjs --check`: 종료 0. PASS
  - `backend`에서 `gradlew.bat test --rerun --console=plain`: 종료 0, 27개 클래스 223개 실패·오류 0. PASS
  - `python scripts/docs/verify_documentation.py`, `python -B scripts/verify_agent_kit.py`, 자체 변경 `git diff --check`: 결과는 07 RUN-69.
  - `node frontend/scripts/audit-api-docs.mjs`, `python scripts/docs/build_current_database.py --check`: 종료 1. 변경 전 HEAD 사본에서도 같은 실패(기존 상태). REVIEW
- 실제 테스트 결과: 07 RUN-67~RUN-69.
- 보안: 다른 계정 404, 오래된 version 409, 동시 수정 하나만 성공, version 입력 범위 400, 계정 전환 뒤 늦은 응답 폐기. PASS(변경 범위 한정)
- 웹 접근성: 화면 변경 없음. N/A
- 오탐 제외: 없음.
- 남은 위험과 승인 필요: V8은 H2로만 확인했다. 격리 MySQL 적용·현재 DB 문서 재캡처, 운영 적용(새 서버·클라이언트와 함께)은 별도다. 화면은 아직 로컬 저장이다.
