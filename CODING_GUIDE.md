# Vue·Spring 코딩 안내

기준 원문은 [코딩·커밋 규칙](docs/standards/coding-standards.md), [용어 사전](docs/standards/glossary.md), [모듈 책임](docs/architecture/modules-and-interfaces.md)이다.

- Vue는 현재 JavaScript SFC와 주변 스타일을 유지한다. 화면·로컬 store·서버 API의 저장 경계를 확인한다. 사용자가 입력한 HTML을 v-html·innerHTML에 전달하는 경로와 URL 프로토콜을 검토한다.
- Spring의 Controller는 HTTP·DTO·현재 사용자, Service는 인가·도메인·트랜잭션, Repository/Store는 영속 접근을 담당한다. 인증 필터의 존재만으로 객체별 인가를 통과했다고 보지 않는다.
- 쿼리 값은 바인딩하고 동적 정렬·식별자는 허용 목록으로 처리한다. version 충돌과 409 동작을 보존한다.
- 비밀값·개인정보·로그 원본을 문서·응답·커밋·외부 도구에 넣지 않는다. 외부 호출·파일·예외 처리의 경계를 관련 테스트로 확인한다.
- 새 소스에는 한국어 역할 주석을 둔다. 기존 JavaConventionTest의 헤더 충돌은 기존 코딩 규칙에 기록된 사항이며 이번 도구 적용에서 테스트를 바꾸지 않는다.
- [보안 49개](security/SW_SECURE_CODING_49.md)·[웹 28개](security/WEB_VULNERABILITY_28.md) 중 변경과 관련된 항목을 선택한다. 전체 감사 요청이 없는 작업에 전체 감사를 추가하지 않는다.
