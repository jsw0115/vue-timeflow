# Java API 구현 검증 기록

2026-10-03/04 · 초기 소스·단위·MockMvc 검증 이후 Flyway 부팅 오류 대응을 추가했고, 실제 MySQL·Redis·HTTP 검증 및 로컬 DB 반영까지 완료했다. 이번 API 구현은 체크리스트 5개, 담당자 후보 3개, 플래너 기본 보기 2개다. [전체 목록](current-api-inventory.md)과 [신규 계약](task-planner-contract.md)의 상태는 지정 범위를 뜻한다.

## 완료한 검사

| 검사 | 결과 | 범위 |
|---|---|---|
| Java 컴파일·Gradle check·bootJar | 통과 | 신규 및 기존 백엔드 컴파일·JUnit 실행·서버 JAR 빌드 |
| 행동·HTTP 테스트 | 95개 통과 | 초기 80개에 schema adoption·JWT 설정·UUID 입력 회귀 검사 15개 추가 |
| Java 네이밍·서식 검사 | 42개 통과 | 신규 21개 Java 소스 파일, 파일명·패키지·공개 타입·LF·공백 4칸·명시적 import·마지막 줄바꿈 |
| 전체 테스트 | 137개 통과, 실패·오류 0 | build/test-results/test/TEST-*.xml 집계 |
| 실제 MySQL·Redis·HTTP | 13개 통과 | 복구·데이터 보존·로그인·동시 수정·채팅·재기동·FK 확장 |
| 실제 로컬 DB 반영 | 완료 | 기존 회원 6명·로그 13행 보존, health UP |
| API 소스·목록·상세 계약 대조 | 117개 경로 일치 | 목표 `/api/v1` 169개와 구분 |
| 기존 설계 ID 보존 | 114개 보존 | 목표안 API를 삭제하거나 구현 완료로 바꾸지 않음 |
| 변경 공백 검사 | 통과 | git diff --check |

MockMvc는 컨트롤러의 JSON 변환·Bean Validation·인증 주체 전달·200/201/204 응답·400/401/404/409/500 오류를 검증한다. 기존 JWT 필터 자체나 실제 네트워크 로그인 세션을 대체 검증하지 않는다. 지원하지 않는 HTTP 메서드·미디어는 405/415를 보존하는 것도 검사한다.

체크리스트 테스트는 부모 소유권 검사 선행, 다른 할 일 항목 접근 방지, 공백·초과 제목, 등록·활성 담당자, 최대 100개, 상태 지정 재호출, 기대 버전, 삭제 버전, flush 이후 응답을 검증한다. 담당자 테스트는 최대 50명, 한 번의 일괄 사용자 조회, 비활성 후보 제외, 본인·중복 등록 및 사용 중 후보 해제 충돌을 검증한다. 플래너 테스트는 기본값·지원 보기 4개·최초 저장·버전 0 덮어쓰기 방지·활성 계정·사용자 행 잠금 선행을 검증한다. 기존 할 일 수정·완료·삭제도 체크리스트와 같은 부모 잠금을 사용하는 회귀 검사를 추가했다.

네이밍·서식 검사는 `JavaConventionTest`와 Gradle test 입력으로 연결해 소스 공백만 변경해도 다시 실행되도록 했다. 전체 Google/Naver 가이드의 모든 항목을 검사하는 Checkstyle 적용이라고 주장하지 않는다. API 문서 생성기는 경로별 구현 상태를 보존하며 소스와 문서 차이가 나면 검사에 실패한다.

## 실행 명령

```powershell
cd backend
.\gradlew.bat --offline --no-daemon check bootJar --console=plain
```

프로젝트 루트에서 문서 일치 여부를 재검사한다.

```powershell
node frontend/scripts/api-inventory.mjs --check
node frontend/scripts/design-docs/build.mjs . --api-only --check
node frontend/scripts/design-docs/check.mjs .
node frontend/scripts/audit-api-docs.mjs --check --date=2026-10-03
```

## 추가 실제 DB 검증 및 남은 범위

최초 API 구현 단계에서는 DB·Redis 통합 검증을 하지 않았다. 후속 부팅 오류 수정에서는 실제 MySQL 9.0.1·Redis 7.4에 연결해 guarded baseline 2·core V3·workspace V4·core V5·chat V1~V4, JPA validate, 실제 로그인/JWT, DB 잠금·낙관 버전·동시 요청 200/409, DM·멘션·검색·활성 상태와 재기동을 검증했다. 검증 스키마에만 테스트 계정을 만들었다. 별도의 기존 26자 schema에서는 계정·할 일 값과 FK 보존도 확인했다. [사전 설계·13개 실제 검사·원본 DB 적용 기록](../development/database-recovery-2026-10-03.md)을 참고한다.

기존 V1의 `tbl_`/JPA 불일치는 역사적 [DB 정합성 보고서](../design/04-schema-gaps.md)에 보존한다. V1을 수정·재실행하지 않고 안전한 V3를 추가했다. 기존 데이터와 회원 ID·비밀번호 해시를 보존해 실제 timeflow에 반영했으며 원본 auth_db는 유지한다. [V4 SQL](../../backend/src/main/resources/db/workspace/V4__task_checklist_and_planner_preferences.sql)의 외부 FK 추가는 여전히 미뤄 서비스 잠금·권한 검사를 적용한다. 기존 물리 FK 확장 경로는 실제 검증했다.

실제 MariaDB 엔진, 프런트엔드 전체 API 연결, 공유·친구·관리자 stub 기능은 검증하거나 완료하지 않았다. 모든 기존 50개 Service API의 동작을 재검증했다는 뜻도 아니다. 공용 메모리 플래너 API도 영속 구현으로 표시하지 않는다.

실서버 OpenAPI는 `node frontend/scripts/audit-api-docs.mjs --live --base-url=http://127.0.0.1:8080 --date=2026-10-03`로 대조한다. [API 감사 JSON](api-audit-2026-10-03.json)의 `runtimeOperations`는 실제 매핑 수를 뜻하며 각 API 행동 검증 완료 수와 구분한다.
