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

# 검증 기록(2단계)

- 실행 일시/환경: 2026-11-19, Windows 11, Node 20.18.0(요구 버전 미달은 PR-06), Python 3.12.4, Docker 격리 MySQL 8.4·Redis 7.4(`infra/chat/compose.yml`), 백엔드 `bootRun` chat-local(포트 18080, 8080은 다른 컨테이너 사용 중), Vite 개발 서버(포트 15173, chat-local CORS 허용 출처), 헤드리스 Chrome(CDP, 작업 폴더 밖 임시 스크립트).
- 명령/버전/종료코드
  - 수정 전 `frontend`에서 `node --test tests/task-store.test.mjs`: 실패(모듈 없음). 의도한 실패. FAIL(07 RUN-70)
  - 수정 후 같은 명령: 8개 통과. 첫 실행 1개 실패는 테스트 데이터 ID 겹침이라 테스트만 고침. PASS(07 RUN-71)
  - 브라우저 점검: 17/17 통과. 첫 실행은 Vite 5174 포트가 CORS 허용 출처에 없어 POST 403이라 무효, 15173으로 재실행. PASS(07 RUN-72)
  - Node 테스트 전체(`--test-concurrency=1`): 123개 실패 0. PASS
  - `npm run build:web`: 종료 0(500 kB 청크 경고는 기존, PR-18). PASS
  - `node scripts/frontend-api-contract.mjs --check`: 종료 0(286개 작업·198개 스키마). `node scripts/api-inventory.mjs --check`: 종료 0. PASS
  - 백엔드: 바꾸지 않아 다시 실행하지 않았다. N/A
  - `verify_documentation.py`, `verify_agent_kit.py`, `git diff --check`: 07 RUN-73.
- 보안: 다른 계정 할 일 안 보임(브라우저), 계정 전환 중 남은 체크리스트 요청 중단(`scoped` 요청), 담당자는 계정 ID만 보냄(Q-21), 오래된 version 저장은 비교 화면으로만 덮어씀. PASS(변경 범위 한정)
- 웹 접근성(변경 범위): 상태 문구 `role="status"`, 400 입력란 `aria-invalid`·`aria-describedby`, 요청 중 `aria-busy`와 진행형 라벨, 비교 화면 제목에 초점, 320px 비교 화면 넘침 없음. 키보드 전체·화면낭독기 실사용은 하지 않았다. REVIEW
- 남은 위험: 2·3단계 함께 배포. 홈·캘린더의 서버 목록 갱신 시점은 할 일 목록 화면 진입.

# 검증 기록(3단계)

- 실행 일시/환경: 2026-11-19, 2단계와 같은 환경. 백엔드는 V9·서버 변경 뒤 재시작해 격리 MySQL에 V9를 적용했다.
- 명령/버전/종료코드
  - 수정 전: HEAD 사본에서 `gradlew.bat test --tests ...IdempotencyHttpTest --tests ...TaskVersionTest` 컴파일 실패, `node --test tests/local-migration.test.mjs` 모듈 없음. 의도한 실패. FAIL(07 RUN-74·RUN-75)
  - 수정 후: 백엔드 task·feature 묶음 통과(IdempotencyHttpTest 6, TaskVersionTest 6), local-migration 7개 통과. PASS(07 RUN-76)
  - 브라우저: 3단계 7/7, 2단계 회귀 17/17. PASS(07 RUN-77)
  - 격리 MySQL V9 확인, 현재 DB 문서 재캡처와 `build_current_database.py --check` 종료 0. PASS(07 RUN-78)
  - Node 전체 130개, 빌드, 계약 생성·검사(286개 작업), 경로 검사, 백엔드 전체 `--rerun` 28개 클래스 230개, 문서·키트 검사: 종료 0. PASS(07 RUN-79)
  - `audit-api-docs.mjs`: 종료 1, 변경 전과 같은 기존 실패. REVIEW
- 보안: 키는 계정 범위(다른 계정의 같은 키는 별도 기록), 같은 키에 다른 본문은 409, 키 형식 400, 지운 기록은 다시 만들지 않음(404), 동시 요청 하나만 생성, 계정 전환 시 남은 이전 중단. PASS(변경 범위 한정)
- 웹 접근성: 이전 안내는 기존 Modal(대화상자) 안에 있고 결과 문구는 `role="status"`, 진행 중 버튼 `aria-busy`, 320px 넘침 없음. 화면낭독기 실사용은 하지 않았다. REVIEW
- 남은 위험: V9 운영 적용 대기(PR-13).

# 검증 기록(4단계)

- 명령/결과
  - 수정 전 `node --test tests/schedule-store.test.mjs`: 모듈 없음. 의도한 실패. FAIL(07 RUN-80)
  - 수정 후 같은 명령: 7개 통과. PASS(07 RUN-81)
  - 브라우저(실제 백엔드·MySQL): 9/9. PASS(07 RUN-82)
  - Node 전체 137개, 빌드, 계약·경로 검사, 문서·키트 검사: 종료 0. 백엔드 변경 없음. PASS(07 RUN-83)
- 보안: 참석자는 계정 ID만 보냄, 분할 실패 시 겹친 회차를 남기지 않음, 오래된 version은 비교 화면으로만 덮어씀. PASS(변경 범위 한정)
- 웹 접근성: 저장 버튼 진행형 라벨과 `aria-busy`, 400 메시지 `role="alert"`, 비교 화면 320px 넘침 없음. 날짜 입력의 `aria-invalid`는 하지 않았다. REVIEW

# 검증 기록(5단계)

- 명령/결과
  - 수정 전: 서버 새 테스트 1개 실패(이력 version 없음), 프런트 모듈 없음. 의도한 실패. FAIL(07 RUN-84)
  - 수정 후: 서버 feature·records 묶음, 프런트 routine-store 7개 통과. PASS(07 RUN-85)
  - 브라우저(실제 백엔드·MySQL): 7/7. PASS(07 RUN-86)
  - Node 전체 144개, 빌드, 계약·경로, 백엔드 전체 231개, 문서·키트: 종료 0. PASS(07 RUN-87)
- 보안: 수행 기록 변경은 version이 맞아야 저장, 계정 전환 중 이력 응답 버림, 서버 검증(쉬는 날·미래 날짜) 메시지 그대로 표시. PASS(변경 범위 한정)
- 웹 접근성: 체크박스 `aria-busy`, 실패 안내 `role="status"`, 수정 창 진행형 라벨. 화면낭독기 실사용 없음. REVIEW

# 검증 기록(6단계)

- 명령/결과
  - 수정 전: 서버 기분 검사 테스트 1개 실패, 프런트 모듈 없음. 의도한 실패. FAIL(07 RUN-88)
  - 수정 후: 서버 feature 묶음, 프런트 feature-records 5개 통과. PASS(07 RUN-89)
  - 브라우저(실제 백엔드·MySQL): 8/8. 둘째 실행에서 D-Day 고정 뒤 저장 충돌 결함을 찾아 고친 뒤 통과. PASS(07 RUN-90)
  - Node 전체 149개, 빌드, 계약·경로, 백엔드 전체 232개, 문서·키트: 종료 0. PASS(07 RUN-91)
- 보안·입력: 기분 값 허용 목록(서버), D-Day 날짜 ISO 검사(서버 기존), 오래된 version은 비교 화면으로만 덮어씀. PASS(변경 범위 한정)
- 웹 접근성: 기분 선택을 키보드로 고를 수 있는 버튼(`aria-pressed`)으로 바꿈, 실패 안내 `role="status"`, 400 `role="alert"`. 화면낭독기 실사용 없음. REVIEW

# 검증 기록(7단계와 최종 회귀)

- 명령/결과
  - 수정 전 `node --test tests/career-store.test.mjs`: 모듈 없음. 의도한 실패. FAIL(07 RUN-92)
  - 수정 후 같은 명령: 4개 통과. PASS(07 RUN-93)
  - 브라우저(실제 백엔드·MySQL) 7단계: 6/6. PASS(07 RUN-94)
  - 최종 회귀(07 RUN-95): 브라우저 2단계 17/17, 3단계 7/7, 4단계 9/9, 5단계 7/7, 6단계 8/8(연달아 실행한 첫 회 7/8 대기 초과 1건, 바로 두 번 재실행 모두 8/8), 7단계 6/6. 프런트 153개, 백엔드 232개 실패 0, 빌드·계약·경로·문서·키트 종료 0. PASS
  - `audit-api-docs.mjs`: 변경 전과 같은 기존 실패. REVIEW
- 보안: 경력·이력서·포트폴리오는 서버 소유권 검사(기존)와 version으로 저장, 공개 링크는 만들지 않음(공개된 것처럼 보이지 않게 "준비 중"). PASS(변경 범위 한정)
- 웹 접근성: 편집 창 진행형 라벨·`aria-busy`, 실패 안내 `role="status"`. 화면낭독기·키보드 전체 점검은 하지 않았다. REVIEW
- 남은 위험: 6단계 UT-121 점검의 일시적 대기 초과 1건(재현 안 됨). 운영 DB 적용(V8·V9)과 실제 배포 검증은 PR-13.
