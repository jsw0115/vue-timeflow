# 결정·근거·인수인계 메모

- 현재 확인된 구현/설정: 사용자 격리 DB의 Flyway 이력은 Core V12·채팅 V5까지(2026-11-20 UTC 적용)였다. chat-local 백엔드 시작 때 V13만 적용됐다(v12→v13, 채팅은 변경 없음, JPA validate 통과).
- 선택한 대안/이유: 손으로 쓴 행을 고치지 않고 생성기로 문서 전체를 다시 만들었다. 생성기는 열 의미를 열 이름으로만 찾아서 `record_link.target_id`가 `feature_block.target_id`의 "차단 대상 사용자 식별자"를 받게 되므로, 테이블별 의미(`TABLE_MEANINGS`)를 먼저 찾게 했다. `challenge_checkin` 역할이 없으면 `PURPOSES`에서 KeyError가 나므로 더했다. 마이그레이션 기준 문구(workspace V4·V6~V13, 채팅 V1~V5)와 예시 날짜(캡처 날짜)를 고쳤다.
- 오탐/예외와 근거·승인 상태: `verify_documentation.py`의 오류 3건(`README.md` 작성일·목차 누락, `docs/api-info/README.md` 링크 대상 없음)은 이번에 건드리지 않은 파일이다. 이번 범위에서 고치지 않았다.
- 다음 작업·미확인: 운영 DB 적용 여부는 확인 대상이 아니다. 05 미해결 쟁점의 "빈 격리 DB가 V2 기준선으로 시작" 메모는 이번 DB(V1·V2 적용 이력 있음)와 다른 환경 이야기라 그대로 두었다.
- 마지막 실행 명령·종료 코드·증거 경로: `python -B scripts/docs/build_current_database.py --check` 종료 0. 백엔드 로그는 세션 임시 폴더에만 있다(저장소에 넣지 않음).
- 완료한 체크리스트 항목과 남은 작업: 전부 완료. 커밋은 요청받지 않아 하지 않았다.
- 중단 원인과 재개 시 첫 명령: 없음. 다시 확인하려면 `python -B scripts/docs/build_current_database.py --check`.
- 사용자 변경과 자체 변경 구분: 사용자 미커밋 변경(`PlannerItemQueryRepositoryImpl.java` 빈 줄, `application.yml` 포트 8081, Career OS 기록 폴더, `careerGoal.mjs`)은 건드리지 않았다. bootRun은 이 변경을 포함한 채 실행됐다(포트 8081). 자체 변경은 `scripts/docs/build_current_database.py`, `docs/database/current-database.md`·`current-schema.json`, `docs/dev-docs/05`·`07`·`README.md`, 이 기록 폴더다.
