# 작업 맥락과 판단 근거.

## 2026년 11월 1일.

- 첨부 로그는 Java 17, Spring Boot 3.5.16, VS Code 실행의 `backend/bin/main` 경로를 사용하며 `FeatureTestConfig`와 `PlannerPersistenceTest.Config`의 `dataSource` 빈 충돌로 컨텍스트 초기화를 취소한다.
- 실제 소스에서 두 테스트 설정은 모두 일반 `@Configuration`이다. `backend/bin/test`에도 해당 클래스가 존재한다. 테스트 클래스가 classpath에 포함된 일반 기동 경로를 검증해야 한다.
- 기존 관련 검증은 Gradle SQL/JPA 테스트 위주였고 일반 애플리케이션의 테스트 설정 스캔 여부를 검사하지 않았다.
- Spring Boot 3.5 공식 문서는 테스트 설정을 `@TestConfiguration`으로 선언하고 필요한 테스트에서 명시적으로 가져오도록 안내한다. 실제 일반 기동에서도 필터가 적용되는지는 회귀 테스트로 검증한다.
  - https://docs.spring.io/spring-boot/3.5/reference/testing/spring-boot-applications.html#testing.spring-boot-applications.excluding-configuration
- 최초 worktree에는 AGENTS.md, DESIGN.md, PlannerItemQueryRepositoryImpl.java, Modal.vue 수정 및 SECURITY.md, .claude/settings.local.json, my-skill/ 미추적 항목이 있었다. 이번 작업에서 건드리거나 커밋하지 않는다.
- 기본 DB 및 격리 개발 DB 포트에 리스너가 확인되지 않았다. 실제 기동 검증에서는 기존 데이터를 사용하지 않는 별도 환경을 우선한다.
- 샌드박스 안에서는 네트워크/프로세스 조회가 제한되었다. 승인된 Docker 조회에서는 기존 MySQL과 채팅용 MySQL/Redis 컨테이너가 실행 중이었다. 기존 환경을 중지하거나 변경하지 않는다.
- 수정 전 `ApplicationStartupTest`는 `FeatureTestConfig`가 만든 `admin`과 운영용 `adminService`의 중복으로 실패했다. 전체 테스트 의존성이 있을 때 Boot 테스트 필터가 플래너의 중첩 설정은 제외하지만 일반 `FeatureTestConfig`는 제외하지 않기 때문이다.
- 일반 실행 의존성과 테스트 클래스 출력만 포함한 classpath로 실제 main을 실행하자, 첨부와 같은 `PlannerPersistenceTest$Config` 대 `FeatureTestConfig`의 `dataSource` `BeanDefinitionOverrideException`이 정확히 재현되었다. 증거는 미추적 빌드 출력 `backend/build/startup-check/before-ide.log`에 있다.
- 수정은 두 설정의 `@Configuration`을 `@TestConfiguration`으로 바꾸는 것으로 한정한다. 기존 `@SpringJUnitConfig`의 명시적 설정 로딩은 유지한다.
- 회귀 검증은 전체 테스트 classpath에서 실제 HTTP 서버를 기동하는 검사와, Boot 테스트 라이브러리가 없는 일반 classpath의 컴포넌트 스캔 검사를 함께 수행한다. 빈 덮어쓰기는 계속 비활성화한다.
- 수정 후 `ApplicationStartupTest` 2개, `PlannerPersistenceTest` 2개, `FeaturePersistenceTest` 8개가 통과했다. H2 기반 실제 서버의 `/actuator/health`는 HTTP 200 및 UP이었다.
- 전체 `check bootJar`는 19개 suite, 테스트 180개가 실패·오류·skip 없이 통과했다.
- IDE `backend/bin/test`에는 수정 전 애노테이션이 남아 있어 두 설정만 Java 17로 재컴파일했다. `javap -v`로 두 클래스 모두 `TestConfiguration`임을 확인했다.
- 별도 일회용 MySQL에서 실제 `bin/main + bin/test` main 기동, core Flyway v6, health 200/UP, 인증 없는 API 401을 확인했다. 검증 서버를 종료하고 일회용 컨테이너를 제거했다.
- 이번 변경에 한정한 공백 검사는 통과했다. 저장소 전체 공백 검사의 실패는 기존 사용자 Modal.vue 수정에 해당하므로 변경하지 않는다.
- 상세 실행 근거와 검증 한계는 verification.md에 기록했다. 새 코드의 추가 변경은 없으며 기존 사용자 변경은 커밋 대상에서 제외한다.
