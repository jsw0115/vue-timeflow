# 현재 시스템 구조

자세한 소스 위치와 요청 흐름은 [프로젝트 구조 원문](../handbook/source/03-프로젝트-구조.md)과 [Word 문서](../handbook/03-프로젝트-구조.docx)를 확인하세요.

```text
Vue 3 및 Vite
  -> 브라우저 로컬 store 또는 인증된 HTTP 요청
  -> Spring Boot 3.5.16 및 Java 17
  -> MySQL과 Flyway

채팅 REST 및 SSE
  -> MySQL 메시지와 읽음 및 outbox
  -> Redis 이벤트와 입력 중 및 활성 상태
```

개발 웹은 /api를 Vite 프록시로 전달하고 Linux 운영 웹은 Nginx로 전달합니다. Pages는 외부 HTTPS API 주소를 사용합니다. Capacitor와 Electron은 같은 웹 산출물을 포장하지만 설치형 클라이언트에는 Vite 프록시가 없습니다.

기존 auth, event, task, routine, planner 외에도 records, feature, work, social과 operations 등이 구현되어 있습니다. contract 패키지의 컨트롤러도 실제 서비스와 연결되어 있으므로 이름만으로 stub이라고 판단하지 않습니다. 외부 제공자 경계는 integration에서 미연결 상태를 반환합니다.

다수 프런트엔드 store는 현재 localStorage 기반 시연 데이터입니다. 서버 API 구현과 각 화면의 서버 연결은 별도로 확인합니다. 최신 계약은 [2026년 10월 API 문서](../api/frontend-backend-2026-10-10/README.md)이며 과거 목표 설계와 구분하세요.

