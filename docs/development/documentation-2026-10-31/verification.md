# 문서와 로컬 실행 재검증 결과

검증일은 2026년 10월 31일입니다. 조사 기준 소스는 98ae7c7이며 발견한 CI 오류 수정은 a076a6a에 기록했습니다. 기존 사용자 변경인 AGENTS.md, PlannerItemQueryRepositoryImpl.java와 Modal.vue는 수정하거나 커밋하지 않았습니다.

## 실제 실행 환경

- Windows PowerShell, JDK 17.0.12, npm 10.8.2를 사용했습니다.
- PC 기본 Node는 20.18.0이어서 프로젝트의 22.12 이상 요구를 충족하지 않았습니다. 실제 설치, 테스트, Vite와 빌드는 지원 버전인 Node 24.22.1을 명시해 실행했습니다. PC 기본 PATH의 Node를 교체한 작업은 아닙니다.
- Docker Engine 27.2.0과 Compose 2.29.2를 사용했습니다. 격리 개발 Compose의 MySQL 8.4 및 Redis 7.4 이미지가 healthy가 됐습니다.
- 기존 개인 DB의 .env 내용과 비밀값을 출력하거나 변경하지 않았습니다. 테스트 계정과 데이터는 격리 chat-local DB에만 생성했습니다.

## 실행한 명령과 결과

아래 npm과 node 명령은 위의 Node 24 런타임으로 실행했습니다. 백엔드는 backend, 프런트엔드는 frontend를 작업 디렉터리로 사용했습니다.

| 위치 | 실제 확인 명령 또는 동작 | 결과 |
| --- | --- | --- |
| 프로젝트 루트 | docker compose -f infra/chat/compose.yml up -d --wait | MySQL 및 Redis healthy |
| backend | .\gradlew.bat test bootJar --console=plain | 성공. JUnit 178개, 18개 suite |
| backend | .\gradlew.bat bootRun --args="--spring.profiles.active=chat-local" | 8080 기동 성공, actuator health UP |
| frontend | npm ci --cache .npm --no-audit | 성공. 잠금파일 기준 394개 패키지 설치 |
| frontend | npm run dev | 127.0.0.1:5173 기동 성공 |
| frontend | npm run build:web | 성공 |
| frontend | node --test --test-concurrency=1 $testFiles | 47개 통과. 전체 테스트 파일 배열을 전달했으며 CI 수정 후 재실행도 통과 |
| frontend | npm run build:pages | 성공. API 미설정 시연 빌드 안내는 정상 출력 |
| 프로젝트 루트 | node frontend/scripts/api-inventory.mjs --check | 277개 경로 일치 |
| 프로젝트 루트 | node frontend/scripts/frontend-api-contract.mjs --check | 277개 operation 및 190개 schema 일치 |
| 프로젝트 루트 | sh -n scripts/deploy/release.sh 및 backup.sh | 두 스크립트 구문 검사 통과 |
| 프로젝트 루트 | Docker Compose config --quiet | Linux 기본 구성과 HTTPS overlay 모두 통과. 검증용 값으로 보간 |
| 문서 | python scripts/docs/verify_handbook.py | DOCX 6개 필드, 제목, 한국어 속성, 무매크로와 ZIP 무결성 통과 |
| 문서 | render_docx.py로 DOCX 6개 렌더링 | 총 34쪽 PNG 생성 및 전체 페이지 시각 검수 완료 |
| 문서 | 수정 문서의 상대 링크 및 Python AST 검사 | Markdown 20개, 상대 링크 67개와 제작 도구 구문 검사 통과 |

PowerShell의 테스트 파일 배열은 `$testFiles = (Get-ChildItem tests/*.test.mjs).FullName`으로 만들었습니다. 실제 GitLab Runner에서 파이프라인을 실행하거나 Pages와 운영 서버를 게시한 것은 아닙니다.

## 실제 HTTP와 브라우저 검증

[실행 시나리오 결과 JSON](runtime-results.json)에 15개 성공 항목을 남겼습니다. 토큰과 비밀번호는 결과 파일에 포함하지 않았습니다.

- API health, 웹 5173 응답, 실제 MySQL 회원가입과 로그인.
- 비로그인 401, 일반 계정의 관리자 API 403, 타인 일정 404.
- 일정 생성과 재조회, 반복 회차 두 건, 시간 역전 400, 오래된 version의 409와 삭제.
- 신규 메모 생성과 DB 재조회 및 삭제.
- Redis Pub/Sub 및 인증된 SSE의 실제 메시지 이벤트 수신.
- 메시지 저장, 중복 전송 멱등성, 읽음 위치, 멘션과 활성 상태 및 입력 중 API.
- 제공자 미연결 AI 실행의 예상된 503 응답.
- Vite /api 프록시를 통한 실제 인증 요청.
- headless Chrome의 로그인, 채팅 메시지 전송과 새로고침 후 유지, 화면 회원가입.
- 홈, 캘린더, 플래너, 할 일, 일정, 루틴, 다이어리, 메모, 통계, WBS, 위키, 경력, 프로필, 보안 설정, 기기 미리보기와 목업의 16개 경로 렌더링.
- 390px 모바일 채팅의 가로 넘침 없음과 브라우저 pageerror 0건.

예상된 400, 401, 403, 404, 409와 503은 오류 처리 규칙을 확인하기 위한 성공 시나리오입니다. 무조건 HTTP 200을 반환하게 변경하지 않았습니다.

## 처음 설치하는 개발자의 빈 DB 검증

기존 개발 볼륨 재사용과 별개로 timeflow-manual-20261031 Compose 프로젝트를 새로 만들었습니다. 검증 전용 포트는 MySQL 14316, Redis 17389, API 18080입니다. 새 볼륨이 생성된 것을 확인하고 JAR를 chat-local 프로필과 검증 포트로 실행했습니다.

core 마이그레이션은 안전한 baseline 뒤 V3부터 V6까지, chat 마이그레이션은 V1부터 V4까지 적용됐습니다. JPA validate와 API 기동이 성공했고 health는 UP입니다. [빈 DB 시나리오 JSON](fresh-results.json)에 주요 HTTP 9개 성공 결과를 남겼습니다.

이 검증은 기존 개인 MySQL DB에 과거 V1을 실행하거나 데이터를 덮어쓰는 작업을 포함하지 않습니다. 마무리 검사에서 5173, 8080, 18080 포트의 검증용 서버 리스너가 없음을 확인했습니다. 두 Compose 프로젝트의 MySQL과 Redis는 중지 상태이며 데이터 볼륨은 유지했습니다.

## 발견한 문제와 반영 내용

1. 기본 Node 20.18.0의 버전 불일치를 확인했습니다. 지원 Node로 검증하고 매뉴얼에 설치 전 버전 확인과 터미널 재시작을 명시했습니다.
2. 새 로컬 가이드의 테스트 순서가 production HTML을 읽는 테스트의 전제와 맞지 않을 수 있어 웹 빌드 후 테스트하도록 고쳤습니다. 터미널별 경로, Docker Desktop 준비와 기존 MySQL의 DB 및 계정 생성도 보완했습니다.
3. Pages CI의 과거 설계 생성 및 2026-10-03 감사 명령은 오래된 catalog와 current-operations 비교에서 실패했습니다. 과거 스냅샷을 덮어쓰는 대신 최신 API inventory 및 frontend-api-contract를 검사하도록 수정하고 47개 테스트와 새 검사 명령을 다시 통과시켰습니다.
4. 기존 실행, 운영 배포와 구조 안내의 MariaDB 기본 구성 및 stub 설명, Linux 안내의 관리자 권한 미구현 설명을 실제 MySQL과 최신 API 기준으로 정정했습니다.
5. Word 렌더링에서 기본 제목 스타일의 파란 선을 발견해 제거했습니다. 자동 목차와 날짜 필드를 계산한 뒤 자동 갱신 설정을 복원하고 최종 34쪽을 다시 렌더링했습니다.

## Word 검수 범위

| 문서 | 최종 렌더 쪽수 |
| --- | --- |
| 문서 이용 안내 | 4 |
| 로컬 실행 가이드 | 7 |
| 배포 가이드 | 5 |
| 프로젝트 구조 | 6 |
| 버전과 릴리스 이력 | 4 |
| 기능 명세서 | 8 |

모든 페이지에서 한글 표시, 제목, 표의 반복 헤더, 명령어와 쪽수를 확인했습니다. CREATEDATE, SAVEDATE, TOC와 제목 스타일을 보존하며 매크로는 없습니다. 필드 계산과 시각 검수는 임시 LibreOffice 25.8.7.3 및 관리 Python 런타임으로 수행했습니다. Microsoft Word 자체 실행은 포함하지 않으며 Word에서 내용 변경 후 Ctrl+A와 F9로 목차 전체를 갱신해야 합니다.

## 남은 범위와 경고

기본 Node는 여전히 20.18.0이므로 일반 터미널에서 매뉴얼을 시작하기 전에 22.12 이상으로 맞춰야 합니다. Vite는 약 710 kB 번들 경고를, Flyway는 MySQL 8.4 지원 범위에 관한 기존 경고를 출력했지만 기동과 검증은 통과했습니다. 이번 문서 작업에서 무관한 의존성 업그레이드나 번들 분할은 수행하지 않았습니다.

277개 API 전체의 실 DB 검증, 실제 GitLab CI 및 운영 HTTPS, 외부 제공자 연결, Android 및 iOS와 Electron 설치 파일 검증은 포함하지 않습니다. 로컬 시연 store가 서버와 자동 동기화되지는 않습니다.
