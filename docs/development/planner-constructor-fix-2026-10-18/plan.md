# 플래너 생성자 진단 오류 수정 계획.

1. Java 17 설정과 설치된 VS Code Java/JDT·Lombok 버전을 대조하고 동일 컴파일러로 최소 재현을 확인한다.
2. PlannerItemQueryRepositoryImpl의 Lombok 생성자만 명시적 생성자로 교체해 기존 Spring 주입과 final 필드를 유지한다.
3. 동일 JDT 검사와 Gradle Java 17 컴파일·플래너 JPA 테스트를 실행하고 실제 결과를 기록한다.

다른 클래스, Java 버전, IDE 사용자 설정은 변경하지 않는다.
