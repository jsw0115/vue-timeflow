# 작업 맥락.

- 기준일 2026-10-18. backend/build.gradle의 toolchain과 .vscode/settings.json의 프로젝트 런타임은 Java 17이다.
- 대상 클래스에는 생성자 선행문이나 Java 25 문법이 없고, RequiredArgsConstructor와 final JPAQueryFactory 필드가 있다. QuerydslConfig가 해당 bean을 제공한다.
- 설치 확장은 redhat.java 1.57.0이며 내장 compiler.batch는 3.46.200.v20260930-0211, jdt.core는 3.48.0.v20260930-0211이다. 확장 내장 Lombok은 lombok-1.18.39-4050.jar이고 Gradle 캐시에는 1.18.46이 있다. IDE와 Gradle의 Lombok 처리 경로가 다르다.
- JDT 공식 이슈 https://github.com/eclipse-jdt/eclipse.jdt.core/issues/5489 와 수정 PR https://github.com/eclipse-jdt/eclipse.jdt.core/pull/5490 에 동일 진단과 생성자 AST 호환성 원인이 설명되어 있다. 실제 로컬 최소 재현으로 확정할 예정이다.
- 전체 Java 업그레이드나 확장 설치 대신 대상 클래스만 변경해 기존 Java 17 배포 계약과 주입 동작을 유지한다.

## 최소 재현과 수정.

- 설치 확장의 Java 25 실행기로 동일 compiler.batch를 -17 옵션과 내장 Lombok javaagent로 실행했다. RequiredArgsConstructor 최소 소스에서 사용자와 동일한 Flexible Constructor Bodies 진단을 재현했다. 명시적 생성자 대조 소스는 같은 -17 옵션에서 오류 없이 통과했다.
- 수정 전 Gradle compileJava + PlannerPersistenceTest는 Java 17로 통과했다. 실제 소스 문법 오류가 아니라 편집기의 Lombok/JDT 생성자 처리 경로에서 발생하는 진단임을 확인했다.
- import와 RequiredArgsConstructor를 제거하고 JPAQueryFactory를 받는 public 생성자를 직접 선언했다. final 필드, Repository, QueryDSL 검색 메서드는 유지한다.
- 대상 파일에 사용자 import 위치·공백 변경이 이미 있었음을 Git diff로 확인했다. 명시적 생성자 수정 이외의 사용자 변경은 보존하고 커밋에서도 분리한다.

## 최종 검증.

- 실제 대상 클래스의 수정 전 사본을 동일한 설치 JDT + IDE 내장 Lombok javaagent + -17로 컴파일했다. 사용자 진단과 동일하게 15행 RequiredArgsConstructor에서 오류 1개가 재현됐다.
- 수정된 실제 클래스를 같은 JDT/javaagent/-17/의존성 classpath로 검사했고 exit 0 및 Java 진단 오류 0을 확인했다. IDE 내장 Lombok agent의 Unsafe deprecation 경고는 별개로 출력된다.
- 수정 후 gradlew.bat compileJava test --tests kr.timebar.diary.planner.PlannerPersistenceTest --offline --console=plain이 통과했다. XML에 tests=2, failures=0, errors=0, skipped=0이다.
- 수정 전후 Gradle은 모두 성공하고 JDT만 생성자 어노테이션에서 실패하므로, Java 25 문법 사용 문제가 아니라 IDE Lombok/JDT AST 호환성 문제임을 확인했다.
- 실제 VS Code UI의 진단 목록은 직접 조회하지 않았다. 같은 설치 컴파일러로 실제 수정 소스를 검증했다. 기존 오류 표시가 캐시에 남으면 Java: Clean Java Language Server Workspace로 재구성한다.
