# 채팅 API 목록서

2026-10-03 · 기본 경로 `/api/chat` · **아래 18개 엔드포인트 구현됨** · Bearer access JWT 필수

| ID | 메서드 | 경로 | 목적 | 정상 응답 | Redis |
|---|---|---|---|---|---|
| CHAT-01 | GET | /people?email= | 정확한 가입 이메일로 참여자 찾기 | 200 Person | 조회 제한 |
| CHAT-02 | GET | /rooms | 현재 참여 대화 목록 | 200 Page(Room) | — |
| CHAT-03 | POST | /rooms | 개인/그룹 생성, 기존 DM 재사용 | 200 Room | 생성 제한·outbox |
| CHAT-04 | GET | /rooms/{id} | 참여자·읽음·최근 메시지 | 200 Room | — |
| CHAT-05 | GET | /rooms/{id}/messages | 이전/이후 메시지, 선택적 태그 필터 | 200 Page(Message) | — |
| CHAT-06 | POST | /rooms/{id}/messages | 메시지·멘션·태그 원자 저장 | 200 Message | 전송 제한·outbox |
| CHAT-07 | PUT | /rooms/{id}/read | 방 읽음 위치 증가 | 200 ReadState | outbox |
| CHAT-08 | PUT | /rooms/{id}/owner | 그룹 방장 이전 | 200 null | outbox |
| CHAT-09 | DELETE | /rooms/{id}/members/me | 그룹 나가기 | 204 | outbox |
| CHAT-10 | POST | /rooms/{id}/typing | 입력 중 신호 | 204 | TTL·Pub/Sub |
| CHAT-11 | GET | /events | 본인의 참여 방 변경 알림 SSE | 200 text/event-stream | Pub/Sub 수신 |
| CHAT-12 | GET | /mentions | 내 멘션함, 안 읽음 필터 | 200 Page(InboxItem) | — |
| CHAT-13 | PUT | /mentions/{messageId}/read | 해당 멘션 읽음 | 200 null | — |
| CHAT-14 | GET | /tags | 현재 접근 가능한 태그와 건수 | 200 Page(TagCount) | — |
| CHAT-15 | GET | /tagged-messages?tag= | 참여 방 전체의 태그 메시지 | 200 Page(InboxItem) | — |
| CHAT-16 | GET | /search?q=&roomId=&before=&limit= | 현재 참여 대화의 전체 메시지 검색, 선택적 방 범위 | 200 SearchPage(InboxItem) | 검색 제한 |
| CHAT-17 | PUT | /presence | 클라이언트별 메신저 활성 상태 갱신 | 204 | TTL·ZSET |
| CHAT-18 | GET | /presence?userIds= | 함께 대화하는 사용자들의 메신저 활성 상태 | 200 List(Presence) | TTL·ZSET |

목록은 18개 경로/메서드 조합이다. CHAT-05의 태그 필터도 같은 엔드포인트로 제공하며 별도 HTTP API로 세지 않는다.

CHAT-16의 `q`는 1~100자이며 NFKC·소문자로 정규화한다. `limit`은 1~100, `before`는 이전 결과의 메시지 ULID, `roomId`는 선택적 참여 방 ID다. 응답은 `items`, `nextCursor`, `hasNext`, `indexing`을 포함한다. `indexing=true`이면 기존 메시지의 초기 색인을 만드는 중이다. gram 색인으로 후보를 좁힌 뒤 정확한 부분 문자열을 검사한다. 탈퇴한 방과 멤버 외의 메시지는 반환하지 않는다.

CHAT-17 요청은 `{ clientId: UUID, active: boolean }`이다. 화면에서 메신저를 열고 앱이 보일 때만 활성으로 갱신하며, 클라이언트별 상태가 35초 후 만료된다. 다른 탭에서 활성화한 클라이언트가 있으면 사용자 전체 상태는 계속 활성이다. CHAT-18의 `userIds`는 쉼표로 구분한 최대 100개의 ID다. 현재 함께 참여하는 방의 사용자만 `{ userId, nickname, active }`로 반환한다. Redis 조회 실패 시 프런트엔드는 상태를 알 수 없다고 표시한다.

정확한 요청·응답은 [설계서](design.md), Redis 명령/채널 단위 API는 [Redis API 목록서](../redis/api-catalog.md)에 분리했다. 서버 실행 시 `/v3/api-docs`에서도 실제 컨트롤러 계약을 조회할 수 있다.
