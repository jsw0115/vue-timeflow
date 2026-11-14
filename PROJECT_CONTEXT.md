# Timebar Diary 프로젝트 맥락

확인일 2026-11-14. 현재 저장소의 소스·설정 기준이며 운영 환경이나 모든 기능의 검증 완료를 뜻하지 않는다.

| 항목 | 확인된 내용과 근거 |
| --- | --- |
| 목적 | 계획과 실제 기록을 같은 시간축에서 비교하며 일정·할 일·루틴·개인 기록·업무·경력·채팅을 연결한다. [README](README.md). |
| 프런트엔드 | Vue 3, Vue Router 4, Vite 6, JavaScript 중심 SFC. 선언 범위·실제 해석 버전은 [package.json](frontend/package.json)과 [lockfile](frontend/package-lock.json)을 각각 확인한다. |
| 백엔드 | Java 17, Spring Boot 3.5.16, Spring Security, JPA·Querydsl·JDBC, Gradle Wrapper. [build.gradle](backend/build.gradle). |
| 런타임 요구 | Node >=22.12.0, npm >=10, JDK 17. Python 3.10 이상은 새 에이전트 보조 스크립트용이다. 현재 설치 버전은 실행 시 따로 확인한다. |
| DB·캐시 | 격리 Compose는 MySQL 8.4, Redis 7.4. H2는 백엔드 테스트용이다. [Compose](infra/chat/compose.yml). |
| 스키마 | Flyway와 JPA validate. 기본 경로는 db/migration·db/core·db/workspace, chat-local은 db/chat-local-core·db/core·db/workspace. 채팅 migration은 별도 설정도 확인한다. [resources](backend/src/main/resources). |
| 인증 | Stateless Bearer JWT, BCrypt, refresh 흐름. [서버 설정](backend/src/main/java/kr/timebar/diary/security/SecurityConfig.java), [클라이언트](frontend/src/features/auth/session.js). CSRF가 현재 비활성화된 사실은 모든 인증 방식에 안전하다는 판정이 아니다. |
| 모듈 | frontend/src의 views·components·store·features와 backend/src/main/java/kr/timebar/diary의 도메인 패키지. [구조](docs/architecture/modules-and-interfaces.md). |
| 환경 | 격리 실행 프로파일 chat-local, 환경변수·.env 설정, 테스트별 H2/mock. 실제 접속정보·키는 문서에 복사하지 않는다. [실행 안내](BUILD_GUIDE.md). |
| 배포 | GitLab Pages, 선택적 Linux 컨테이너 파이프라인, Capacitor·Electron 구성. 실제 배포·서명·스토어 검수 성공 여부는 별도다. [릴리스](RELEASE_GUIDE.md). |
| 연계 | 파일·공유·채팅/SSE 경로가 있다. AI·음성·실결제 등 외부 제공자 미연결 경계는 [integration 소스](backend/src/main/java/kr/timebar/diary/integration/IntegrationController.java)와 [연계 명세](docs/api/frontend-backend-2026-10-10/integrations.md)를 확인한다. |
| UI 계약 | [DESIGN.md](DESIGN.md), 유효하게 채택된 해시 결합 System Graph, .omd/preferences.md의 명시적 수정에 대한 기존 AGENTS 규칙을 유지한다. |
| 검토 기준 | ZIP의 SW 49·웹 28·KWCAG 33 및 OWASP 참고표를 변경 범위에 적용한다. 공식 인증이나 계약 의무를 새로 선언하지 않는다. [적용 범위](security/README.md). |
| 작업·권한 | 계획·체크리스트·맥락·검증 기록을 남긴다. 검증된 자체 변경은 의미 단위 커밋한다. 푸시·배포·운영 변경은 실제 요청의 권한 범위에 따른다. |
| 미확정 | 라이선스·조직 보안 담당·운영 승인 책임자는 저장소만으로 확정하지 않는다. 새 라이선스나 외부 서비스 권한을 임의로 부여하지 않는다. |

## 작업별 진입점

- [코딩](CODING_GUIDE.md), [UI](DESIGN_GUIDE.md), [API](API_SPEC.md), [DB](DB_SCHEMA.md).
- [빌드](BUILD_GUIDE.md), [테스트](TEST_GUIDE.md), [배포](RELEASE_GUIDE.md).
- [Codex 적용·스킬](README_적용가이드.md), [작업 기록](docs/agent/README.md), [기존 문서 목차](docs/README.md).

## 적용 경계

현재 추적·비무시 소스 검색에서 JSP/JSPX/tag/tagx는 발견되지 않았다. JSP 전용 진단은 N/A이며 Vue의 HTML 출력·DOM XSS·접근성 검토는 계속 적용한다. 로컬 시연 저장 화면을 계정별 서버 저장이 완료된 화면으로 소개하지 않는다.
