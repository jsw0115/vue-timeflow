# 기동 오류 수정 검증 결과.

## 원인과 수정.

일반 실행 의존성에 테스트 출력이 함께 포함되면 일반 `@Configuration`으로 선언된 `FeatureTestConfig`와 `PlannerPersistenceTest.Config`가 운영 컴포넌트 스캔에 잡힌다. 두 설정이 모두 `dataSource`를 선언하므로 애플리케이션이 시작되지 않는다.

두 설정을 `@TestConfiguration`으로 변경했다. 필요한 테스트는 기존 `@SpringJUnitConfig`를 통해 명시적으로 로딩한다. 빈 덮어쓰기는 허용하지 않았다.

## 실제 확인한 결과.

| 검사 | 결과 |
|---|---|
| 수정 전 일반 실행 의존성 + 테스트 출력으로 main 실행 | 첨부와 동일한 두 설정 사이 `dataSource` `BeanDefinitionOverrideException` 재현 |
| 수정 전 전체 테스트 classpath에서 실제 서버 기동 테스트 | 테스트 설정이 생성한 `admin`과 운영 `adminService` 중복으로 실패 |
| `.\gradlew.bat test --tests kr.timebar.diary.config.ApplicationStartupTest --tests kr.timebar.diary.planner.PlannerPersistenceTest --tests kr.timebar.diary.feature.FeaturePersistenceTest --offline --console=plain` | 성공. 테스트 12개, 실패·오류·skip 0 |
| `.\gradlew.bat check bootJar --offline --console=plain` | 성공. 19개 suite, 테스트 180개, 실패·오류·skip 0 |
| Boot 테스트 라이브러리가 없는 classpath를 모사한 컴포넌트 스캔 | 운영 JpaConfig 발견, 두 테스트 설정 모두 제외 |
| `javap -v`로 IDE `bin/test`의 두 설정 검사 | 이전 Configuration 출력 확인 후 재컴파일하여 TestConfiguration으로 갱신 |
| 갱신된 `bin/main + bin/test` 및 일반 실행 의존성으로 main 기동 | Java 17, 기본 프로필, Hikari/JPA 정상 초기화. 빈 덮어쓰기 비활성화 유지 |
| 별도 MySQL 8.4의 Flyway 이력 직접 조회 | baseline 2 및 V3·V4·V5·V6 모두 success=1 |
| 실제 HTTP health 및 인증 경계 | `/actuator/health` HTTP 200 및 `{"status":"UP"}`, 인증 없는 `/api/tasks` HTTP 401 |
| 실제 기동 로그의 오류 수준 및 실패 메시지 검사 | ERROR, APPLICATION FAILED TO START, BeanDefinitionOverrideException 없음 |
| 이번 변경에 한정한 `git diff --check` | 통과 |

Gradle 명령은 `backend` 디렉터리에서 JDK 17 및 기존 로컬 Gradle 캐시를 지정해 실행했다.

## 검증 환경과 한계.

- 실제 MySQL 검증은 이번에 만든 일회용 `timeflow-startup-check-20261101` 컨테이너와 별도 schema를 사용했다. 서버 프로세스는 종료했고 컨테이너는 제거했다. 기존 MySQL/채팅 컨테이너는 유지했다.
- VS Code의 F5 UI를 직접 조작한 검증은 아니다. IDE가 사용하는 `bin/main`과 `bin/test`의 실제 클래스를 Java main으로 실행했다. standalone 검증에서는 DevTools restart를 비활성화했다.
- SQL/JPA 테스트를 유지하는 것에 더해, 새 회귀 테스트가 실제 SpringApplication 기동·운영 DataSource 구성·HTTP 응답을 확인한다. H2 회귀 테스트에서는 Flyway를 비활성화하고, MySQL 실기동 검사에서 실제 Flyway를 검증했다.
- 로그에는 기존 Flyway의 MySQL 8.4 지원 범위 안내와 SpringDoc 기본 활성화 WARN이 있었다. 이번 기동 실패의 원인은 아니며 의존성이나 문서 공개 정책은 수정하지 않았다.
- 저장소 전체 `git diff --check`는 기존 사용자 변경인 `frontend/src/components/Modal.vue` 51·53행의 trailing whitespace를 보고한다. 이번 수정 범위의 공백 검사는 통과했고 해당 사용자 변경은 유지했다.
- 빌드 검증 자료는 Git에 넣지 않는 `backend/build/startup-check/`의 before-ide.log, after-ide.log, ide-smoke-result.json 및 `backend/build/test-results/test/`에 있다.
- 초기 smoke 검증 스크립트는 PowerShell의 health 응답 byte 배열과 DEBUG 보고서의 ErrorMvc 문자열을 잘못 판정했다. 저장된 원본 응답을 UTF-8로 해석하고 실제 ERROR 로그 수준을 검사하여 HTTP 200/UP 및 기동 오류 없음으로 확인했다.
