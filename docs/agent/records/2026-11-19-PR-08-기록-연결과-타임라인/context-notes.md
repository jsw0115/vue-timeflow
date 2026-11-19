# 결정·근거·인수인계 메모

- 작업 브랜치: 세션 브랜치 `ccr-801282b0-ikvrk0`는 GitHub 초기 커밋(LICENSE)만 있고 실제 코드는 `origin/master`에 있었다. `origin/master`에서 브랜치를 다시 만들고 원격 브랜치의 초기 커밋을 `--allow-unrelated-histories`로 병합했다(LICENSE 추가). master에는 LICENSE가 없었다.
- 연결 저장 위치: Q-12 권장 결정대로 `record_link`(V10). 종류는 `task`·`schedule`·`actual`. 할 일과 일정·기록이 다른 저장소라 FK 대신 `RecordLinks`가 쓰기 전 양쪽 소유자를 확인한다.
- `task.event_id`: 구형 `events`용 열이라 연결에 쓰지 않는다. 정리는 PR-21 때 본다.
- 일정 삭제 후 "삭제된 일정" 표시(UT-144): 연결 행은 지우고, 실제 기록 payload의 `sourceKind`·`sourceId`는 남긴다. 화면(3단계)은 연결이 없고 원본 ID만 있으면 "삭제된 일정/할 일"로 보인다.
- 배치 제목: 비우면 할 일 제목을 복사한다. 그 뒤에는 따로 간다(UT-141).
- 백업: 원본 할 일·일정이 백업 범위 밖이라 실제 기록을 내보낼 때 `sourceKind`·`sourceId`를 뺀다. 복원 검사(`validateActual`)는 바꾸지 않았다.
- 할 일 삭제 API는 기존대로 200(본문 메시지)이다. 일정 삭제는 204다.
- 현재 DB 문서: 이 환경에서 새로 띄운 격리 MySQL은 Flyway가 V2 기준선으로 시작해 `db/chat-local-core` V1·V2를 적용하지 않았다. 기존 캡처(오래 쓴 개발 DB)와 FK·색인·열 길이가 달라 그 결과로 `current-database.md`를 덮어쓰지 않았다. 사용자 격리 DB에서 `python scripts/docs/build_current_database.py --capture-container timeflow-chat-mysql-1 --as-of <날짜>`로 재캡처해야 한다. 생성기에 `record_link` 설명은 더해 두었다. 기준선이 생긴 이유는 확인하지 않았다.
- 테스트 환경: JDK 17은 apt로 설치했다(툴체인 17 필요). Maven Central·Docker Hub가 429를 돌려 재시도했다. `frontend/tests/device-preview.test.mjs`의 Vite 개발 서버 테스트는 이 환경에서 끝나지 않는다(수정 전 코드도 같음).
- 문서 검사: `verify_documentation.py`는 01의 기존 깨진 링크(`../output/Timebar-Diary-검토보고서.md`) 1건으로 수정 전부터 실패한다. 이 작업에서 고치지 않았다.
- 2단계 날짜 기준: 경계 값은 새 테이블 없이 프로필 추가 정보(SETTING `profile`의 `value.dayStartHour`)에 둔다. 시간대는 기존 `users.tz`. `DayPolicy.of(user)`가 둘을 한 번 읽어 요청 안에서 같은 기준을 쓴다.
- 실제 기록 날짜 분할은 기록에 저장한 시간대 대신 사용자 시간대를 쓴다(Q-06). 일정 계획 시간은 벽시계 시각을 사용자 시간대 시점으로 바꿔 같은 범위로 자른다. 경계가 0시가 아니면 다음 날 새벽 회차까지 읽으려고 회차 조회를 하루 늘렸다.
- `DayPolicy.Day`는 패키지 안에만 둔다. API 계약 생성기가 `public record`를 모두 스키마로 읽어서 공개하면 `ZoneId`·`Clock` 스키마가 없다는 오류가 난다.
- 프로필 추가 정보는 `PUT` 때 보낸 키로 통째로 바뀐다(기존 동작). 4단계 설정 화면은 `dayStartHour`를 함께 보내야 한다.
- 범위 밖으로 남긴 것: 루틴 이력의 오늘(`ScheduleService`)과 메모 기본 날짜는 여전히 `Asia/Seoul`.
- 다음 작업: 3단계(연결 화면). 첫 명령은 `frontend/src/views/tasks/TaskDetailView.vue`, 일정 상세(`views/events` 또는 캘린더), `PlannerDailyView.vue`, `views/diary/DiaryEntryView.vue`와 `features/records/taskStore.mjs`·`scheduleStore.mjs`·`features/recording/useRecording.js` 대조다. DESIGN.md를 먼저 읽는다.
