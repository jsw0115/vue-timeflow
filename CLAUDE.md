<!-- omd:start v=1 hash=4c25bd97f142 -->
# Design System (oh-my-design)

Read the standalone design contract at **@./DESIGN.md** before any UI,
styling, microcopy, or motion work. When a valid adopted Core v2
`.omd/system/manifest.json` declares `profile: portable-core` and binds exact
graph/projection hashes, the System Graph is machine authority and DESIGN.md is
its standalone projection. A migration candidate is never adopted authority.

Preference log (pending corrections): @./.omd/preferences.md

Precedence: pending explicit preference corrections > adopted Bound System
graph/standalone DESIGN.md > your defaults. Fold pending corrections into the
graph and regenerate the projection before clearing them.
<!-- omd:end -->

# CLAUDE.md — Timebar Diary

Claude가 이 저장소에서 작업할 때 참조하는 프로젝트 메모리다. 프로젝트 사실의 원문은 아래 문서이며, 이 파일은 진입점과 Claude 전용 규칙만 담는다. 내용이 충돌하면 실제 소스·설정을 우선하고 이 파일을 고친다.

- 에이전트 공통 규칙: @./AGENTS.md
- 프로젝트 사실·근거: @./PROJECT_CONTEXT.md

## 1. 프로젝트 개요

- 계획(Plan)과 실제 기록(Actual)을 같은 시간축에서 비교하는 개인 시간관리 서비스. 일정·할 일·루틴·다이어리·업무·경력·채팅을 연결한다.
- 웹·API 선언 버전 0.1.0. Git 릴리스 태그·운영 배포·매출은 확인된 상태가 아니다.
- 다수 화면은 브라우저 로컬 시연 저장을 쓴다. 로컬 시연 화면을 계정별 서버 저장이 끝난 화면으로 소개하지 않는다.
- AI·음성·실결제·외부 캘린더 제공자는 미연결이며 실행 요청에 503 경계를 돌려준다. 화면·설정값을 실연동 성공으로 해석하지 않는다.

## 2. 구조와 기술 스택

| 영역 | 내용 | 위치 |
|---|---|---|
| 프런트엔드 | Vue 3, Vue Router 4, Vite 6, JavaScript SFC. Capacitor(android/ios)·Electron 포장 구성 | `frontend/src` (views·components·store·features·composables) |
| 백엔드 | Java 17, Spring Boot 3.5.16, Spring Security, JPA·Querydsl 5.1·JDBC, Gradle Wrapper | `backend/src/main/java/kr/timebar/diary` (auth·planner·records·routine·task·event·work·social·chat·integration 등) |
| DB·캐시 | MySQL 8.4, Redis 7.4. 테스트는 H2 | `infra/chat/compose.yml` (격리 개발 DB) |
| 스키마 | Flyway + JPA validate. 경로 db/migration·db/core·db/workspace, chat-local은 db/chat-local-core 포함. 채팅은 db/chat을 `flyway_chat_history`로 별도 실행 | `backend/src/main/resources/db`, `config/CoreMigrationStrategy.java` |
| 인증 | Stateless Bearer JWT, BCrypt, refresh 흐름 | `security/SecurityConfig.java`, `frontend/src/features/auth/session.js` |
| 배포 | GitLab Pages, 선택적 Linux 컨테이너(Nginx·Caddy) | `infra/deploy`, `scripts/deploy/release.sh`·`backup.sh` |

- 런타임: Node >=22.12, npm >=10, JDK 17. 보조 스크립트는 Python 3.10 이상.
- 새 라이브러리를 추가하기 전에 라이선스를 확인한다. 라이선스·외부 서비스 권한을 임의로 정하지 않는다.
- 스키마를 바꾸면 Flyway 마이그레이션을 새 번호로 추가하고 [현재 DB 문서](docs/database/current-database.md)를 함께 갱신한다. 이미 적용된 마이그레이션 파일은 수정하지 않는다.
- API를 바꾸면 `docs/api/`의 명세와 `frontend/scripts/frontend-api-contract.mjs` 계약 검사를 함께 맞춘다.

## 3. 실행·검증 명령

```powershell
# 격리 DB (루트)
docker compose -f infra/chat/compose.yml up -d --wait
# 백엔드 (backend)
.\gradlew.bat bootRun --args="--spring.profiles.active=chat-local"
.\gradlew.bat test --console=plain            # --tests 로 관련 클래스만 선택 가능
# 프런트엔드 (frontend)
npm run dev                                   # http://127.0.0.1:5173/
npm run build:web
$testFiles = (Get-ChildItem tests/*.test.mjs).FullName; node --test --test-concurrency=1 $testFiles
# 지침·문서 구조 (루트)
python -B scripts/verify_agent_kit.py
python scripts/docs/verify_documentation.py
```

`frontend/package.json`에는 `npm test` 스크립트가 없다. 자세한 범위는 [TEST_GUIDE.md](TEST_GUIDE.md)를 따른다.

## 4. 작업별 진입점

- 코딩 [CODING_GUIDE.md](CODING_GUIDE.md) · UI [DESIGN.md](DESIGN.md) 최우선(5절), 보조 [DESIGN_GUIDE.md](DESIGN_GUIDE.md) · API [API_SPEC.md](API_SPEC.md) · DB [DB_SCHEMA.md](DB_SCHEMA.md)
- 빌드 [BUILD_GUIDE.md](BUILD_GUIDE.md) · 테스트 [TEST_GUIDE.md](TEST_GUIDE.md) · 배포 [RELEASE_GUIDE.md](RELEASE_GUIDE.md) · 운영 [runbook](docs/operations/runbook.md)
- 기획 [docs/planning](docs/planning/) (project-definition·requirements·business-plan·wbs) · 날짜별 개선·버그 [backlog](docs/releases/backlog.md)
- 보안 [security/SECURITY_POLICY.md](security/SECURITY_POLICY.md) · 재사용 스킬 `.agents/skills/` ([선택 안내](README_적용가이드.md))
- 운영 점검·연동 시험·배포 문서 작성은 루트 [SKILL.md](SKILL.md)(timebar-diary-ops-docs)를 따른다.

## 5. UI·UX 작업 기준

- 화면·컴포넌트·스타일·문구·모션 코드를 작성하거나 수정할 때는 [DESIGN.md](DESIGN.md)를 최우선 기준으로 삼는다. 작업 전에 DESIGN.md를 읽는다.
- 기존 코드 스타일, DESIGN_GUIDE.md, 외부 레퍼런스, 라이브러리·브라우저 기본값이 DESIGN.md와 충돌하면 DESIGN.md를 따른다. 예외는 그 작업에 대한 사용자의 직접 지시뿐이다(DESIGN.md 부록 A 적용 우선순위 1).
- 색·글자·간격·모서리·그림자는 DESIGN.md 2~6장의 토큰(CSS 변수)으로만 쓴다. 팔레트·스케일 밖의 값이 필요하면 새로 만들지 말고 먼저 사용자에게 알린다.
- 작업을 마치기 전에 DESIGN.md 7장(Do's and Don'ts)과 9장의 생성 전 점검 목록을 확인한다.
- 코드를 DESIGN.md 부록 B(현재 코드와의 차이)의 값으로 맞췄으면 부록 B에서도 그 항목을 갱신한다.
- `.omd/preferences.md`의 pending 항목은 훅이 자동으로 남긴 추정 기록(`confidence: inferred`)이라 DESIGN.md보다 앞서지 않는다. 상단 omd 블록의 우선순위는 사용자가 명시한 교정에만 적용한다.

## 6. 주의할 기존 문서 상태

- DESIGN.md는 2026-11-18에 9장 형식(Visual Theme ~ Agent Prompt Guide)으로 다시 썼고, 하단에 섞여 있던 ezConference Master를 제거했다. `.omd/system` 그래프의 해시는 이전 7장 형식에 묶여 있어 지금은 DESIGN.md가 독립 계약으로 쓰인다. 목표 값과 코드 값의 차이는 DESIGN.md 부록 B를 본다.
- 루트 SECURITY.md에는 다른 프로젝트(Artibot)의 신고·버전 정보가 섞여 있다. Timebar Diary의 확정 사실로 인용하지 않는다.
- `.omd/preferences.md`에 pending 항목이 쌓여 있다. 팔레트 밖 색·radius를 새로 쓰지 말고, 정리는 `/omd-learn`으로 한다.

## 7. 작업 프로토콜

1. 시작 전: Git 변경 상태와 진행 중인 `docs/agent/records/` 작업 폴더를 확인한다. 사용자의 미커밋 변경은 보존한다.
2. 비단순 작업: `python scripts/start_task.py --task 작업명`으로 plan·checklist·context-notes·verification 양식을 만든다. 같은 작업의 폴더가 있으면 이어 쓴다.
3. 작업 중: 결정과 근거는 context-notes.md에, 완료 상태는 checklist.md에 남긴다.
4. 완료 전: 변경 범위에 맞는 검증을 실행하고 명령·종료 코드·결과를 verification.md에 기록한다. 결과는 `PASS / FAIL / REVIEW / NOT_RUN / N/A`로 표기하고, 실행 증빙이 없는 PASS는 쓰지 않는다.
5. 커밋: 검증한 자체 변경만 의미 단위로 커밋한다(AGENTS.md 12절). 푸시·배포·운영 DB 변경·외부 스캔은 요청에서 허용한 범위만 수행한다.
6. 중단 전: 완료 항목, 마지막 검증, 미해결 원인, 다음 명령을 작업 기록에 남긴다.
