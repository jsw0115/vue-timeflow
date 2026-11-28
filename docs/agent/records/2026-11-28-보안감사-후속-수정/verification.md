# 검증 기록

- 실행 일시/환경: 2026-11-28, Windows 11, Git Bash. Java 17.0.12, Node v24.22.3. 백엔드 테스트는 H2(외부 DB 없음) `--offline`으로 실행했다.

## 명령과 결과

| 대상 | 명령 | 종료 코드 | 결과 |
|---|---|---|---|
| 1번 refresh | `sh gradlew --offline test --tests "kr.timebar.diary.auth.RefreshRotationTest" --tests "kr.timebar.diary.operations.AccountSecurityTest" --tests "*JwtConfigurationTest"` | 0 | PASS. 5/0, 4/0, 5/0 (tests/failures) |
| 2번 관리자 창 | `node --test --test-concurrency=1 tests/session-logout-broadcast.test.mjs tests/session-order.test.mjs tests/browser-check-fixes.test.mjs tests/backup.test.mjs` | 1 | 새 테스트 PASS. 28개 중 2개 FAIL(IMP-021·IMP-025)은 기존 실패다(아래). |
| 3번 포트폴리오 | `sh gradlew --offline test --tests "kr.timebar.diary.work.PortfolioUnlockConcurrencyTest" --tests "kr.timebar.diary.feature.FeatureHttpTest"` | 0 | PASS. 1/0, 27/0 |
| 3번 실패 재현 | 같은 테스트에서 `store.lock` 줄을 잠시 빼고 실행한 뒤 되돌림 | 1 | 수정이 없으면 FAIL함을 확인. 되돌린 뒤 `store.lock(FeatureStore.SYSTEM` 1건 존재를 확인 |
| 4번 비밀번호 변경 | `sh gradlew --offline test --tests "kr.timebar.diary.operations.PasswordChangeThrottleTest" --tests "...AccountSecurityTest" --tests "...FeatureHttpTest" --tests "...PortfolioUnlockConcurrencyTest"` | 0 | PASS. 3/0, 4/0, 27/0, 1/0 |
| 5번 채팅 차단 | `sh gradlew --offline test --tests "kr.timebar.diary.chat.*"` | 0 | PASS. ChatBlockTest 3/0, 기존 채팅 테스트 4개 클래스 11/0 |
| API 계약 | `node frontend/scripts/frontend-api-contract.mjs` 후 `--check` | 0 | PASS. "Verified 334 operations and 223 schemas". 내용 변경은 `PUT /api/user/password` 설명뿐 |
| 백엔드 전체 1회차 | `sh gradlew --offline test` | 1 | FAIL 1/379: `TimerRecordingTest.serverInstantsAreMillisecondsSoTargetEndIsExact` ("일시정지 구간은 기록 안에서 시간 순서로 겹치지 않아야 합니다.") |
| 백엔드 타이머 단독 | `sh gradlew --offline test --tests "kr.timebar.diary.feature.TimerRecordingTest"` | 0 | PASS. 시간 의존 테스트로 보인다(REVIEW) |
| 백엔드 전체 2회차 | `sh gradlew --offline cleanTest test` | 0 | PASS. 61개 클래스, 379개 테스트, 실패 0, 오류 0 |
| 프런트 전체 | `node --test --test-concurrency=1 tests/*.test.mjs` | 1 | 397개 중 391 PASS, 6 FAIL. 6건 모두 이번 변경 파일과 무관한 기존 실패(아래) |
| 프런트 빌드 | `npm run build:web` | 0 | PASS. "built in 5.65s" (청크 크기 경고만) |
| 지침 구조 | `python -B scripts/verify_agent_kit.py` | 0 | PASS |

## 프런트 기존 실패 6건 (이번 변경과 무관)

- IMP-021, IMP-025, `좁은 화면(760px 이하)`, UT-235: 테스트 정규식이 `\n` 줄바꿈을 기대한다. 대상 파일(`App.vue`, `ProfileCardView.vue`, 설정 CSS, 작성 모드 소스)은 체크아웃 시 CRLF(`core.autocrlf=true`)다. `App.vue`는 HEAD와 같다.
- `tests/i18n-dictionary.test.mjs`: `new URL(...).pathname`을 Windows에서 그대로 써서 `E:\E:\...` 경로 ENOENT가 난다.
- `i18n-shell.test.mjs:19`: 관리자 메뉴 경로(`/admin`, `/admin/cs`, `/admin/billing` 등)의 영어 이름이 `NAV_EN`에 없다. 라우터·사전 데이터 문제이며 이번에 추가한 문구는 없다.
- `--check`는 체크아웃된 생성 문서가 CRLF라서 재생성 전에는 항상 실패했다. 재생성 후 줄바꿈만 바뀐 `catalog.md`는 원래대로 되돌렸다.

## 범위별 상태

- 보안: 인증·세션(토큰 재사용, 로그아웃 후 세션 잔존), 무차별 대입 제한, 경쟁 조건, 접근 제어(차단)를 단위·H2 통합 테스트로 확인했다. 공식 SW 49·웹 28·OWASP ID 매핑은 하지 않았다(REVIEW).
- MySQL InnoDB에서의 `FOR UPDATE` 동작: NOT_RUN. H2 MySQL 모드로만 확인했다.
- 실제 브라우저 두 창(사용자 창·관리자 팝업) 로그아웃: NOT_RUN. Node의 BroadcastChannel 테스트로만 확인했다.
- 웹 접근성: N/A. 화면 구조·문구를 바꾸지 않았다.
- 오탐 제외: 없음.

## 남은 위험과 승인 필요

- 배포 후 `av`가 없는 기존 refresh 토큰은 모두 거부된다. 사용자는 한 번 다시 로그인해야 한다(사용자 결정).
- BroadcastChannel이 없는 브라우저에서는 관리자 창 자동 정리가 동작하지 않는다.
- 커밋·푸시는 하지 않았다(사용자 결정).
