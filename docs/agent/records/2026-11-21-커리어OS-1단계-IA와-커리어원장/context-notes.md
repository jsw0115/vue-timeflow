# 맥락 메모

## 결정과 근거

| 결정 | 근거 | 되돌리는 방법 |
|---|---|---|
| 활동·지원 기록을 `feature_record`의 새 kind로 저장(새 테이블·마이그레이션 없음) | docs/design 12 DEC-03 "현재 제안: 기존 데이터 구조를 우선 재사용". 06 §8 "실제 DB 확인 전 migration 금지". 경력·이력서·포트폴리오가 이미 같은 구조 | 별도 테이블로 옮길 때 kind 단위로 이전 가능 |
| API 경로 `/api/career/activities`, `/api/career/applications` | 04 §4 경로 후보. 현재 컨트롤러는 모두 `/api` 접두어(`/api/v1` 0개) | 경로 alias 추가로 이전 가능 |
| 활동 유형 7종·지원 상태 9종은 문서 목록 그대로, "기타" 같은 값은 만들지 않음 | 04 §3 FD-85·FD-88 원문. 원문에 없는 값을 지어내지 않음 | `FeatureInput` 상수와 `careerModel.mjs`만 고치면 됨(테스트가 둘을 대조) |
| 지원 상태 전이 제한을 두지 않음 | 문서에 전이 규칙이 없음 | 규칙 확정 시 `FeatureInput`에 추가 |
| 활동 `visibility`는 `private`만 허용 | 09 §3 기본 PRIVATE. 공유 기능이 없는데 다른 값을 받으면 공유되는 것처럼 오해할 수 있음 | 공유 구현 시 허용값 확장 |
| 연결 경력이 없거나 남의 것이면 같은 400 | 09 §2 "존재 여부 비노출" | — |
| 로그아웃 상태에서는 활동·지원을 저장하지 않고 로그인 안내만 표시 | 01 §8-5, DESIGN.md "신뢰": 시연·로컬을 서버 저장처럼 보이지 않음. 기존 경력 화면도 로그아웃이면 브라우저에 저장하지 않음 | 로컬 저장을 원하면 `careerLedger.js`의 local을 영속 컬렉션으로 교체 |
| 커리어 목표: 로그인 시 `/api/settings/career`, 로그아웃 시 이 브라우저 | 03 §5, DEC-02 현재 제안. 테마 저장(`themeAccount.mjs`)과 같은 방식 | 설정 구역 제거 시 화면은 기본 목표로 동작 |
| 사이드바 IA는 경로를 바꾸지 않고 묶음만 이동 | 03 §1-1·§4 "기존 경로와 북마크를 갑자기 제거하지 않는다" | `navGroups` 배열 순서만 되돌리면 됨 |
| 관리자 콘솔 버튼은 `/api/admin/stats` 판정이 allowed일 때만 | 03 §8-5, 09 §2. 관리자 셸이 이미 같은 판정을 씀. 버튼 숨김은 보안 통제가 아니며 서버가 매 요청 검사 | `App.vue`의 `v-if` 제거 |
| J/P/B 하루 모드는 유지 | 01 §6, 02 §7, DEC-01 | — |
| 이력서 `skills`(문자열)와 충돌하지 않게 활동 필드를 `skillTags`로 명명 | 처음에 `skills`를 전역 배열 필드로 넣었다가 이력서 저장을 깨뜨리는 것을 OpenAPI 의미 비교로 발견해 고침. 회귀 테스트 `resumeSkillsStayAPlainString` 추가 | — |

## 확인한 기존 문제(이번 범위 밖, 고치지 않음)

- `scripts/docs/verify_documentation.py` 지적 4건은 변경 전부터 있음.
- `tests/device-preview.test.mjs`는 이 컨테이너에서 변경 전부터 멈춤.
- Gradle toolchain이 JDK 17을 요구하는데 컨테이너 기본은 JDK 21이라 apt로 JDK 17을 설치해 실행함.

## 다음 작업

1. `docs/design/14-baseline-reconciliation.md` §4의 미착수 범위 중 결정이 필요 없는 것부터: 지원 관리 캘린더 보기, 홈 커리어 요약 연결.
2. 원천 기록 연결(06 §6)은 `record_link` 연결 종류 확장 설계를 먼저 기록하고 사용자 확인.
3. 다음 명령: `cd frontend && node --test --test-concurrency=1 tests/career-ledger.test.mjs`, `cd backend && ./gradlew test --tests 'kr.timebar.diary.career.*'`(JDK 17 필요).
