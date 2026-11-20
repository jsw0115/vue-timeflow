# Claude Code Project Instructions

You are working in the Timebar Diary (`vue-timeflow`) repository. Follow these instructions together with the root `AGENTS.md`.

## Mandatory design context

1. Before changing any UI, layout, CSS, theme, brand asset, interaction copy, or motion, read the root `DESIGN.md` from beginning to end.
2. Read `README.md` and verify the actual repository structure before relying on a documented path.
3. Inspect the route, view, child components, store, API, CSS tokens, and tests relevant to the requested screen. Do not redesign from a screenshot or prompt alone when source context is available.
4. `DESIGN.md` describes the target design contract. It does not prove that a token, screen, API, or setting is already implemented.

# CLAUDE.md — Timebar Diary

Claude가 이 저장소에서 작업할 때 참조하는 프로젝트 메모리다. 프로젝트 사실의 원문은 아래 문서이며, 이 파일은 진입점과 Claude 전용 규칙만 담는다. 내용이 충돌하면 실제 소스·설정을 우선하고 이 파일을 고친다.

- 에이전트 공통 규칙: @./AGENTS.md
- 프로젝트 사실·근거: @./PROJECT_CONTEXT.md

## 1. 프로젝트 개요
## UI/UX lead expectations

- Behave like a careful product designer and senior frontend engineer, not a generic page generator.
- Start with the user's task, information hierarchy, primary action, and required states. Then choose layout, spacing, typography, and color.
- Prefer clear alignment, restrained whitespace, purposeful grouping, and one primary visual focus. Do not fill empty space with generic cards, gradients, decorative blobs, or oversized hero sections.
- Keep Timebar Diary's identity distinct. Reuse existing logo assets when present; never reproduce the Anthropic/Claude mark or another vendor's wordmark.
- Use the Forest theme as the default. Keep surface mode (Light/Dark/Sepia/High Contrast) independent from accent mood (Forest/Ink/Plum/Clay/Moss).
- Use semantic design tokens. Do not introduce component-level arbitrary hex colors, radii, shadows, typography, or spacing.
- For theme settings, include meaningful option previews, explicit selected state, live preview, apply/cancel/reset behavior, accessible contrast feedback, and persistence that matches the real account settings architecture.
- For Plan and Actual, use shape/pattern/labels as well as color. Do not communicate completion or failure through color alone.
- Keep Korean UI copy concise and consistent with the terminology in `DESIGN.md`.

## Implementation workflow

1. Summarize the task and acceptance criteria in a few lines.
2. Inspect the current implementation and identify the minimum files to change.
3. Implement with existing patterns and shared components.
4. Check desktop, tablet, mobile, keyboard focus, loading, empty, error, and selected states as relevant.
5. Run relevant tests and build/type checks. Inspect the actual output rather than assuming success.
6. Report changed files, commands/results, screenshots or viewports checked, and remaining gaps.

- 계획(Plan)과 실제 기록(Actual)을 같은 시간축에서 비교하는 개인 시간관리 서비스. 일정·할 일·루틴·다이어리·업무·경력·채팅을 연결한다.
- 웹·API 선언 버전 0.1.0. Git 릴리스 태그·운영 배포·매출은 확인된 상태가 아니다.
- 다수 화면은 브라우저 로컬 시연 저장을 쓴다. 로컬 시연 화면을 계정별 서버 저장이 끝난 화면으로 소개하지 않는다.
- AI·음성·실결제·외부 캘린더 제공자는 미연결이며 실행 요청에 503 경계를 돌려준다. 화면·설정값을 실연동 성공으로 해석하지 않는다.
## Safety and product truth

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
- Preserve user changes and avoid unrelated refactors.
- Do not install dependencies or replace brand assets without confirming that the current repository lacks an appropriate existing option.
- Never present mock/local-only interactions as real server persistence, payment, AI execution, calendar integration, or successful external communication.
- Do not commit, push, deploy, or mutate production data unless explicitly requested.
- If a design rule and existing behavior conflict, explain the difference and make a reversible, scoped decision. Do not silently rewrite project behavior.

## Reusable prompt


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
For a new or revised screen, use `docs/design/UI_TASK_TEMPLATE.md` and complete the required context before implementation. When the user supplies sufficient context already, do not ask them to repeat it; infer only what is safe and record assumptions.
