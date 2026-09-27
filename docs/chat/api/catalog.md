# 채팅 API 목록서

2026-09-27 · 기본 경로 `/api/chat` · **아래 15개 엔드포인트 구현됨** · Bearer access JWT 필수

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

목록은 15개 경로/메서드 조합이다. CHAT-05의 태그 필터도 같은 엔드포인트로 제공하며 별도 HTTP API로 세지 않는다.

정확한 요청·응답은 [설계서](design.md), Redis 명령/채널 단위 API는 [Redis API 목록서](../redis/api-catalog.md)에 분리했다. 서버 실행 시 `/v3/api-docs`에서도 실제 컨트롤러 계약을 조회할 수 있다.
