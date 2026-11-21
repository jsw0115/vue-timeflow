# 결정·근거·인수인계 메모

## 스테이지 항목 판정

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| `backend/.../PlannerItemQueryRepositoryImpl.java` | 제외 | import 사이 빈 줄 하나뿐인 변경 |
| `backend/src/main/resources/application.yml` (기본 포트 8080→8081) | 제외 | 로컬 환경 값. `vite.config.js`·`frontend/.env.example`·`backend/.env.example`·README·API 문서가 모두 8080 기준이고, `backend/.env.example`은 포트가 겹치면 `SERVER_PORT`로 바꾸라고 안내한다. `backend/.env`는 `spring.config.import`로 읽힌다 |
| `frontend/src/features/career/careerGoal.mjs` | 제외 | 어디서도 import하지 않는다. `/api/settings/general`에 저장하던 초안이고, 커밋 5d47e1b의 `careerGoalAccount.mjs`(`/api/settings/career`)가 대신한다. 목표 id·이름도 현재 `careerModel.mjs`와 다르다 |
| `docs/agent/records/2026-11-20-Career-OS-개편-적용/` | 제외 | 체크리스트 전부 미완료, 맥락·검증은 빈 양식. 같은 작업은 커밋된 `2026-11-21-커리어OS-1단계-IA와-커리어원장`에서 끝났다 |
| `frontend/src/components/Modal.vue` | 마무리 후 커밋 | 색 선택 입력이 전역 `.modal-card input{width:100%}`로 늘어나는 문제를 고치려던 변경. `!important`는 선택자 우선순위가 이미 높아 필요 없고, 임의 px(50·64)는 토큰 규칙에 어긋나 `--input-height`·`--space-xs`로 바꿨다. 모바일 툴바만 아래 여백 0이던 것을 12px로 맞췄다 |
| `docs/dev-docs/04`·`11`·`README` | 그대로 한 번 커밋 + 갱신 커밋 | 스테이지 판(v1.20·v1.0·v1.35)은 개편안 v2.0이 근거로 인용한 판이라 먼저 그대로 남겼다. 그 뒤 5d47e1b 사이드바 재구성이 04의 "메뉴 변경 절차 1"에도 불구하고 반영되지 않아 v1.21·v1.1·v1.36으로 갱신했다 |
| `docs/Career_OS_통합_개편안_v2.0.md` | 그대로 커밋 | 변경 이력·부록까지 끝난 v2.0 제안안. 커밋된 작업 기록이 입력 문서로 인용한다 |
| `docs/output/` 검토보고서·근거집 | 그대로 커밋 | 2026-11-16 분석 결과물로 완결. 개인 경로·비밀값 없음 |

## 문서 갱신 결정

- MN-130·MN-131·MN-133은 `docs/design/03`의 후보 ID이고 `docs/design/14` §2가 "원본 문서에 정식 등록하지 않았다"고 적었다. 04·11에는 "(후보)"를 붙여 실제 메뉴로 적고 정식 등록은 하지 않았다.
- 커리어 목표 이름은 소스(`careerModel.mjs`) 기준 취업 준비·이직 준비·재직 중 성장·프로젝트 참여다(제외한 초안의 "커리어 성장"이 아니다).
- 헤더 통합 검색 설명은 바꾸지 않았다. 서버 `SearchController`에는 커리어 kind가 들어갔지만 프런트는 `/api/search`를 부르지 않는다.

## 사용자 변경과 자체 변경 구분

- 사용자 변경(보존, 미커밋): 위 제외 4건. 작업 트리에 그대로 있다. 포트 8081로 로컬 실행 중이면 `application.yml` 대신 `backend/.env`에 `SERVER_PORT=8081`을 두는 방법이 있다(이번에 `.env`는 고치지 않았다).
- 자체 변경: `Modal.vue` 마무리, 04·11·README 갱신, 이 작업 기록.

## 다음 작업

1. 브라우저에서 새 글 작성 창(일정)의 색 선택 크기와 툴바 간격을 데스크톱·390px에서 확인한다(`cd frontend; npm run dev`).
2. 제외한 4건은 필요 없으면 지우고(`careerGoal.mjs`, 2026-11-20 작업 기록 폴더), 포트는 `backend/.env`로 옮긴 뒤 `application.yml`을 되돌린다. 사용자 판단 사항이다.
3. 후보 ID 정식 등록 여부는 커밋된 2026-11-21 커리어 작업 기록의 "다음 단계"를 따른다.
