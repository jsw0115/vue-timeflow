# 검증 기록

실행 환경: 클라우드 컨테이너(Linux), Node v22.23.5, npm 10.9.9, OpenJDK 17.0.21(Gradle toolchain용으로 apt 설치), Python 3.13. 운영 DB·외부 제공자·실기기는 쓰지 않았다.

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
|---|---|---:|---|---|
| 기준선(변경 전) 프런트 테스트 | `node --test --test-concurrency=1 <tests/*.test.mjs 중 device-preview 제외>` | 0 | 221 통과 | PASS |
| 기준선(변경 전) API 계약 | `node scripts/frontend-api-contract.mjs --check` | 0 | 298 operations, 204 schemas 일치 | PASS |
| 커리어 API 테스트 | `gradlew test --tests 'kr.timebar.diary.career.*' --tests 'kr.timebar.diary.feature.FeatureHttpTest' --tests 'kr.timebar.diary.quality.*'` | 0 | CareerHttpTest 7, FeatureHttpTest 24, 코드 규칙 통과 | PASS |
| 백엔드 전체(최종 소스) | `gradlew test --rerun --console=plain` (JAVA_HOME=JDK 17) | 0 | 39개 클래스, 305개 테스트, 실패·오류·건너뜀 0 | PASS |
| API 계약 재생성·검사 | `node scripts/frontend-api-contract.mjs` 후 `--check` | 0 | 308 operations, 212 schemas. 의미 비교 결과 기존 경로·스키마 변경 0건, 추가는 `/api/career/*` 4경로와 스키마 8개 | PASS |
| 프런트 전체(최종 소스) | `node --test --test-concurrency=1 <tests/*.test.mjs 중 device-preview 제외>` | 0 | 230 통과(새 `career-ledger.test.mjs` 9건 포함) | PASS |
| device-preview 테스트 | `timeout 100 node --test tests/device-preview.test.mjs` | 124 | 변경 전 기준선에서도 같은 지점에서 멈춤. Vite 개발 서버·API 프록시를 띄우는 테스트로, 이 컨테이너의 HTTP 프록시 환경 영향으로 보인다(원인 미확정) | NOT_RUN |
| 프로덕션 빌드 | `npm run build:web` | 0 | 빌드 성공. 500kB 초과 청크 경고는 기존과 같은 내용 | PASS |
| 화면 목록 재생성 | `python -B scripts/docs/build_screen_catalog.py` 후 `--check` | 0 | 경로 87 → 90개(추가 3개만). 생성기 정규식 기존 결함 수정 | PASS |
| 라우트 보존 | 이전 커밋 router와 경로·이름 비교(스크립트) | 0 | 삭제 0, 이름 변경 0, 추가 3 | PASS |
| 에이전트 키트 구조 | `python -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |
| 문서 구조 | `python scripts/docs/verify_documentation.py` | 1 | 지적 4건. 변경 전과 목록이 같음(README 목차, 기존 깨진 링크 등). 이번 변경으로 늘어난 지적 없음 | REVIEW |

## 브라우저 확인(Playwright, 가짜 API 응답)

`vite preview`로 빌드 결과를 띄우고 `/api/**`를 메모리 가짜 응답으로 가로채 확인했다. 실제 백엔드와 붙인 확인은 아니다.

| 항목 | 결과 |
|---|---|
| 페이지 가로 넘침(`scrollWidth - clientWidth`) | `/career`, `/career/activities`, `/career/applications` × 1440·1024·768·390·320px 모두 0px, 페이지 오류 0건 |
| 사이드바 묶음 순서 | 메인, 커리어, 플래너, 업무·프로젝트, 기록, 인사이트, 소셜 |
| 관리자 콘솔 버튼 | `/api/admin/stats`가 403이면 0개, 200이면 1개 |
| 커리어 목표 변경 | 취업 준비 → 이직 준비로 바꾸면 영역 순서가 바뀜(마감·면접 우선 → 최근 활동 우선) |
| 활동 작성 | `?new=1`로 작성 창이 열림. `javascript:` 링크 입력 시 저장 버튼 비활성. https 링크로 저장 후 목록에 표시 |
| 지원 보드 | 끝난 상태(합격·불합격·철회) 열은 기본으로 숨김. 768px 이하에서는 보드 영역 안에서만 가로 스크롤 |
| 로그아웃 상태 | 커리어 대시보드가 로그인 안내만 보이고 시연 자료를 보이지 않음 |
| 키보드 | Tab 이동 시 포커스 요소에 실선 outline 확인(1건 표본) |
| 헤더 위치 표시 | 묶음 재구성 뒤 `/work/history`가 `업무·프로젝트`로 잘못 표시되는 결함을 찾아 고침. 수정 후 `/work/history`=인사이트, `/work`·`/work/wbs`=업무·프로젝트, `/work/career`·`/career*`=커리어, `/dday/x1`=메인 |

미확인: 200% 확대, 화면낭독기 실제 낭독, 다크·세피아·고대비 테마별 대비 수치, 실제 백엔드·MySQL과의 연동, iOS·Android 실기기.

참고: 앱은 `base: './'`로 빌드되어 `vite preview`에서 2단계 경로(`/career/activities` 등)를 직접 새로 고치면 자산 경로가 어긋난다. `/planner/daily` 같은 기존 경로도 같은 동작이며 이번 변경과 무관하다. 확인은 앱 안 이동으로 했다.
