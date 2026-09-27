# 채팅 모듈

2026-09-27 · 구현 기준: Spring Boot 3.5 / Vue 3 / MySQL 8.4 / Redis 7.4

채팅은 기존 시연용 브라우저 배열에서 서버 저장 방식으로 전환했다. **SQL이 메시지의 원본이고 Redis는 서버 간 알림과 짧은 수명의 상태를 담당한다.** API 경로는 현재 애플리케이션의 `/api/chat`이다. 기존 `docs/api-info`의 `/api/v1` 목표안과 구분한다.

| 문서 | 내용 |
|---|---|
| [구현 기능·모듈 구조](architecture.md) | 기능 범위, 데이터 흐름, 패키지·폴더 책임 |
| [채팅 DB 설계서](database/design.md) | 메시지·멘션·태그를 포함한 8개 테이블, 관계·인덱스 |
| [채팅 API 목록서](api/catalog.md) | 실제 구현한 HTTP 엔드포인트 |
| [채팅 API 설계서](api/design.md) | 요청·응답, 커서, 멱등성, 권한·오류 |
| [Redis 데이터 설계서](redis/database-design.md) | 키·채널·TTL·내구성·장애 정책 |
| [Redis 연동 API 목록서](redis/api-catalog.md) | Redis 사용 HTTP API와 내부 이벤트·명령 |
| [실행·운영 방법](operations.md) | 격리 개발 환경, 기존 DB 적용 조건, 운영 점검 |
| [검증 기록](verification/README.md) | 실행한 검사와 남은 운영 검증 |

코드는 `backend/.../chat`, `frontend/src/features/chat`, 실행 DDL은 `backend/src/main/resources/db/chat`, 개발 인프라는 `infra/chat`에 각각 격리했다. 기존 일반 DB/API 문서를 채팅 문서로 덮어쓰지 않았다.

사용 화면은 `/chat`, `/chat/mentions`, `/chat/tags`이다. 멘션은 작성창의 **@ 멘션**에서 참여자를 선택하며, `#회고`처럼 입력한 태그는 저장 시 서버가 추출한다. 이름이 같은 사용자를 잘못 알리지 않도록 멘션은 사용자 ID로 확정한다.

로그인 전에는 검증 스크린샷과 같은 목요일 회고 모임·서연·민준의 **샘플 미리보기**를 바로 보여준다. 메시지 작성·멘션 읽음·태그 필터도 동작하며 변경은 현재 페이지의 메모리에만 남고 새로고침하면 초기화된다. 로그인하면 실제 계정 API로 전환한다. `/mentions`, `/tags`에서도 같은 화면을 열 수 있다. 샘플 어댑터는 `frontend/src/features/chat/api/demoChatApi.js`에 분리했으며 서버 JWT 검사를 변경하지 않는다.
