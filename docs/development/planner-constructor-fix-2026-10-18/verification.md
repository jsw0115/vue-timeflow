# 검증 결과.

## 원인.

프로젝트는 Java 17이며 해당 소스는 Java 25 생성자 문법을 사용하지 않는다. 설치된 VS Code Java 확장 1.57.0의 JDT와 내장 Lombok이 생성자 AST를 처리하는 조합에서 생성된 필드 대입을 super 호출 전 코드로 판단한다. 이로 인해 Java 17 소스에 Flexible Constructor Bodies 진단이 발생한다. 동일 동작은 [JDT 공식 이슈 #5489](https://github.com/eclipse-jdt/eclipse.jdt.core/issues/5489)와 [대응 PR #5490](https://github.com/eclipse-jdt/eclipse.jdt.core/pull/5490)에 설명되어 있다.

로컬 버전은 compiler.batch 3.46.200.v20260930-0211, jdt.core 3.48.0.v20260930-0211, IDE 내장 lombok-1.18.39-4050.jar이다. Gradle은 별도 Lombok 1.18.46을 사용한다.

## 수정.

PlannerItemQueryRepositoryImpl의 RequiredArgsConstructor와 import를 제거하고 JPAQueryFactory를 받는 public 생성자를 직접 선언했다. final 필드·Repository·QueryDSL 검색 동작과 Java 17 설정을 유지한다.

## 실제 실행 결과.

| 확인 | 결과 |
|---|---|
| 설치된 JDT + IDE 내장 Lombok javaagent + -17로 최소 재현 소스 컴파일 | 수정 전 동일 진단 재현, 명시적 생성자 대조 소스 exit 0 |
| 같은 JDT/javaagent/-17로 실제 클래스의 수정 전 사본 컴파일 | 15행 RequiredArgsConstructor에서 동일 오류 1개 재현 |
| 같은 JDT/javaagent/-17 및 같은 classpath로 수정된 실제 클래스 컴파일 | exit 0, Java 진단 오류 0 |
| backend에서 `.\gradlew.bat compileJava test --tests kr.timebar.diary.planner.PlannerPersistenceTest --offline --console=plain` | 수정 전후 모두 BUILD SUCCESSFUL. 수정 후 테스트 2개, 실패/오류/skip 0 |
| 변경 diff 및 `git diff --check` | 생성자와 사용하지 않는 Lombok import·annotation만 변경, 공백 오류 없음 |

JDT 검증은 확장에 포함된 JRE 25 실행기로 source level -17을 지정했다. JVM 실행 버전과 프로젝트 소스 언어 수준은 별개다. 실행 인자·로그·최소 재현 소스는 임시 생성물 `backend/build/constructor-check/`에 남겼으며 Git에는 포함하지 않는다. DB/Redis 서버나 전체 애플리케이션 E2E를 실행한 검증은 아니다.

실제 VS Code UI의 진단 목록은 직접 조회하지 않았다. 파일 변경 뒤 이전 표시가 남으면 명령 팔레트의 `Java: Clean Java Language Server Workspace`로 언어 서버 캐시를 새로 구성한다. 다른 클래스에도 같은 어노테이션 오류가 보이면 JDT/Lombok 호환성 문제를 함께 점검해야 한다. 이번에는 대상 클래스만 수정했다.
