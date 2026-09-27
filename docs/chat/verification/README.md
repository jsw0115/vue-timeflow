# 채팅 검증 기록

2026-09-27. 테스트 계정과 메시지는 `example.test` 검증용 데이터이며 기존 업무 데이터와 별도인 chat-local 환경을 사용했다.

| 검사 | 결과·범위 |
|---|---|
| Spring Boot | Gradle test 및 bootJar 성공, 태그 정규화·개수 제한 단위 검사 |
| Vue | Vite production build 성공, BigInt 메시지 병합·SSE 청크 파싱 단위 검사 3개 |
| 실제 API | [16개 시나리오 통과](api-results.json): MySQL 8.4/Redis 7.4/서버 2개 |
| 로그인 UI | [7개 시나리오 통과](ui-results.json): 실제 인증, 전송, 멘션, 태그, 390px 모바일·한글 IME |
| 로그인 전 UI | [7개 시나리오 통과](preview-results.json): 직접 URL 진입, 샘플 전송·멘션·태그, 320/390px, 서버 API 요청 0건 |
| API 문서 | [소스·문서·실행 서버 대조](../../api/api-audit-2026-09-27.md) |

실제 API 검사에는 멤버 외 접근 거부, 중복 요청 멱등성, 변경된 재시도 409, 읽음 커서 단조 증가, 병렬 전송 순번, 탈퇴 후 멘션/태그 접근 차단, 같은 초의 토큰 회전, Redis 중단 중 메시지 저장 및 REST 복구가 포함된다. SSE는 다른 서버 노드에서 수신했다.

## 화면 확인

- [실계정 데스크톱 채팅](screenshots/desktop-chat.png) · [모바일](screenshots/mobile-chat.png)
- [멘션함](screenshots/mentions.png) · [태그함](screenshots/tags.png)
- [로그인 전 데스크톱](screenshots/preview-desktop.png) · [로그인 전 모바일](screenshots/preview-mobile.png)

코드 기반 Playwright와 시스템 Chrome headless로 검사했다. 새 샘플 화면의 테스트는 `/api/` 요청을 차단한 상태에서 실행하여 백엔드 없이 표시됨을 검증한다. 토큰·비밀번호는 결과 파일과 스크린샷에 저장하지 않는다. 재실행 명령은 [운영 문서](../operations.md)에 있다.

## 검증 범위의 한계

운영 트래픽 부하 시험, iOS/Android 네이티브 키보드, 화면 낭독기, 기존 업무 DB에 대한 migration 적용은 수행하지 않았다. 전역 번들 크기가 500kB를 넘는 Vite 경고는 남아 있으며 기능 빌드를 실패시키지는 않는다. SQL 초기화는 새 로컬 스키마에서 검증했으며 기존 DB의 V1 명칭 불일치는 별도 배포 전 점검 대상이다.
