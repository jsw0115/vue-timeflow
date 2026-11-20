# 검증 기록

## 1단계 타이머 서버(2026-11-20)

| 명령 | 환경 | 종료 코드 | 결과 |
| --- | --- | --- | --- |
| `backend`: `gradlew.bat compileTestJava`(수정 전 코드) | JDK 17.0.12 | 1 | FAIL(의도). `TimerRecordingTest`의 `pause`·`cancel` 기호 없음. 07 RUN-162 |
| `backend`: `TimerRecordingTest`를 잠시 scratchpad로 옮기고 `gradlew.bat test --tests "kr.timebar.diary.social.ChallengeCheckinTest" --tests "kr.timebar.diary.feature.BackupTest"`(수정 전 코드) | JDK 17·H2 | 1 | FAIL(의도). 12개 중 2개 실패. 챌린지는 일시정지를 포함한 30분으로 인증됨, 백업은 새 필드를 거부. 07 RUN-162 |
| `backend`: `gradlew.bat test --tests TimerRecordingTest --tests ActualRecordingTest --tests ChallengeCheckinTest --tests BackupTest --tests "kr.timebar.diary.records.*"`(수정 후) | JDK 17·H2·MockMvc | 1 → 0 | 첫 실행 FAIL 1건(테스트가 복원 기록을 원래 ID로 찾음. 복원은 새 ID 규칙이라 테스트를 고침), 다시 실행 PASS 59개. 07 RUN-163 |
| `backend`: `gradlew.bat test --console=plain` | JDK 17·H2 | 0 | PASS. 296개(실패 0, 건너뜀 0). 07 RUN-164 |
| `frontend`: `node scripts/api-inventory.mjs`·`frontend-api-contract.mjs`로 생성 뒤 각각 `--check` | Node 20.18 | 0 | PASS. 298개 경로, 298개 operation·204개 schema(생성 전 `--check`는 1로 차이 확인) |
| `frontend`: Node 테스트 전체(`device-preview` 제외) | Node 20.18 | 0 | PASS. 209개 |
| `frontend`: `node --test tests/device-preview.test.mjs` | Node 20.18 | 0 | PASS. 3개 |
| `frontend`: `npm run build:web` | Node 20.18·Vite 6 | 0 | PASS. 빌드 성공(기존 청크 크기 경고만) |
| 루트: `python -B scripts/verify_agent_kit.py`, `python scripts/docs/verify_documentation.py` | Python | 0 | PASS. errors 0 |
| 루트: `git diff --check`(사용자 변경 3개 파일 제외) | Git | 0 | PASS |
| 격리 MySQL·실제 백엔드 HTTP 점검 | - | - | NOT_RUN. 스키마 변경이 없고(JSON 본문 필드 추가) H2 MySQL 모드 서비스·HTTP 테스트로 확인했다. 2단계 화면 점검 때 실제 백엔드로 함께 확인한다 |

- 보안(SW 49·웹 28·OWASP 중 해당 항목)
  - 입력 데이터 검증: 허용 키 목록(`ownerId` 주입 400), `version` 정수, `mode` 열거값, `targetMinutes` 1~1,440 정수, 시각 ISO 8601, 일시정지 구간 순서·겹침·기록 안 위치를 서버에서 확인한다. PASS(TimerRecordingTest, BackupTest).
  - 부적절한 인가(OWASP A01): 일시정지·재개·취소는 소유자 조건으로 잠근 행만 바꾼다. 다른 계정 기록은 404, 로그인 없이는 401. PASS(`cancellingRightAfterStartLeavesNoRecord`, `httpPauseResumeAndCancel`).
  - 경쟁 조건: 계정 `FOR UPDATE`와 행 잠금 뒤 version을 비교한다. 오래된 version은 409. PASS.
  - 신뢰할 수 없는 시각(OWASP A04): 일시정지·재개 시각은 서버가 찍고 화면이 보내지 않는다. 종료 시각은 기존 규칙(시작 이후, 현재+5초 이내)에 마지막 일시정지·재개 이후를 더했다. 챌린지 근거(`finishKey`) 규칙은 그대로다.
  - 자원 제한: 일시정지는 한 기록에 100번까지(101번째 400). PASS(`pauseCountIsBounded`).
  - 무결성(OWASP A08): 백업 복원은 경과 시간이 일시정지를 뺀 값과 같아야 하고 기록 밖 일시정지·목표가 있는 스톱워치를 거부한다. PASS(`timerRecordsKeepPausesThroughBackup`).
  - 오류 메시지: 원인 안내 문장만 있고 내부 경로·SQL을 담지 않는다.
- 웹 접근성: N/A(1단계 화면 변경 없음).
- 오탐 제외: 없음.
- 남은 위험과 승인 필요: 통계 "집중" 수치 기준(FOCUS만 셀지, 타이머 기록도 셀지)은 2단계 전에 정해야 한다. 푸시는 이번 요청에 없어 하지 않았다.

## 2단계 타이머 화면(2026-11-20)

| 명령 | 환경 | 종료 코드 | 결과 |
| --- | --- | --- | --- |
| `backend`: `gradlew.bat test --tests "kr.timebar.diary.feature.TimerRecordingTest"`(집중 수치 수정 전) | JDK 17·H2 | 1 | FAIL(의도). 11개 중 2개(`pomodoroFinishedEarlyKeepsActualMinutes`, `focusMinutesCountTimerRecordsButNotPlannerRecords`). 07 RUN-165 |
| `frontend`: `node --test tests/timer-client.test.mjs`(구현 전) | Node 20.18 | 1 | FAIL(의도). `timer.mjs` 없음. 07 RUN-165 |
| `backend`: 같은 테스트 + `ActualRecordingTest` + `records.*`(수정 후) | JDK 17·H2 | 0 | PASS |
| `frontend`: `node --test tests/timer-client.test.mjs tests/recording.test.mjs tests/challenge-client.test.mjs tests/stats-client.test.mjs`, `npm run build:web` | Node 20.18 | 0 | PASS. 23개, 빌드 성공 |
| 실제 백엔드·MySQL·Vite·Chrome 점검 `scratchpad/pw/check-p9-2.mjs`(1~3회차) | MySQL 8.4·Chrome | 1 | FAIL. 1회차 스크립트 선택자 오류, 2회차 20/23, 3회차 22/23. 결함 2건(59초 저장, 일시정지 직후 시계). 07 RUN-166 |
| `backend`: `TimerRecordingTest.serverInstantsAreMillisecondsSoTargetEndIsExact`(밀리초 수정 전 → 후) | JDK 17·H2 | 1 → 0 | 수정 전 FAIL(의도), 수정 후 PASS. 07 RUN-166 |
| 같은 브라우저 점검 4회차 | MySQL 8.4·Chrome | 0 | PASS 23/23, 페이지 오류 0건. 07 RUN-167 |
| `backend`: `gradlew.bat test --console=plain` | JDK 17·H2 | 0 | PASS. 298개 |
| `frontend`: Node 테스트 전체(device-preview 포함), `npm run build:web`, 계약·목록 `--check` | Node 20.18 | 0 | PASS. 219개, 빌드 성공, 298개. 07 RUN-168 |
| 루트: `verify_agent_kit.py`, `verify_documentation.py`, `git diff --check`(사용자 변경 제외) | Python·Git | 0 | PASS |

- 보안: 화면은 서버 응답만 보이고 권한 판단을 하지 않는다. 일시정지·재개 시각은 여전히 서버가 찍는다(밀리초로 자른 것은 정밀도만 바꿈). 목표 도달 시각은 화면이 보내지만 서버가 기존 규칙(시작 이후, 마지막 일시정지·재개 이후, 현재+5초 이내)으로 검사한다. 챌린지 근거 규칙(`finishKey`)은 그대로다.
- 웹 접근성(KWCAG 해당 항목): 탭 `aria-pressed`, 분 입력 라벨·`aria-invalid`·`aria-describedby`, 상태 `role=status`, 오류 `role=alert`, 시계 `role=timer`, 제목 입력 `aria-label`, 비활성 0.45·`cursor: not-allowed`, 처리 중 `aria-busy`·progress 커서, 취소 확인 창. 320px 넘침 0px(로그인·로그아웃). 키보드·화면낭독기 전체 점검은 하지 않았다(REVIEW).
- 남은 위험: 화면을 다시 열지 않은 카운트다운은 진행 중으로 남는다(다음에 열거나 플래너에서 끝낼 때 목표 시각으로 저장). 예전 기록의 나노초 시각은 그대로라 목표 계산에 1초 미만 차이가 날 수 있다.
