# Redis 연동 API 목록서

2026-10-03 갱신. Redis 연동 HTTP 10개와 내부 명령 계약 6개를 구분한다. 전체 채팅 HTTP 18개 계약은 [채팅 API 목록](../api/catalog.md)과 [채팅 API 설계서](../api/design.md)를 따른다. Redis 서버를 공개 HTTP API처럼 노출하지 않는다. 아래 경로는 기존 구현·서비스 연결이며 이번 작업의 실 Redis 재검증을 뜻하지 않는다.

## HTTP → Redis 연동

| HTTP API | Redis 역할 | Redis 장애 시 |
|---|---|---|
| POST /api/chat/rooms/{id}/messages | send 카운터, SQL outbox 이후 변경 발행 | 저장 허용, 발행 재시도 |
| POST /api/chat/rooms | create 카운터, ROOM 발행 | 생성 허용, 발행 재시도 |
| PUT /api/chat/rooms/{id}/read | READ outbox 발행 | SQL 읽음 저장, 발행 재시도 |
| PUT /api/chat/rooms/{id}/owner | ROOM outbox 발행 | SQL 변경, 발행 재시도 |
| DELETE /api/chat/rooms/{id}/members/me | ROOM outbox 발행 | SQL 탈퇴, 발행 재시도 |
| POST /api/chat/rooms/{id}/typing | SET NX EX + PUBLISH | 204, 일시 상태 생략 |
| GET /api/chat/events | Redis 구독을 각 서버의 SSE로 중계 | REST 재조회로 복구 |
| GET /api/chat/people | lookup 카운터 | 조회 차단 429 |
| PUT /api/chat/presence | presence 카운터, 사용자별 클라이언트 ZSET 갱신·만료 정리 | 500 오류; UI는 활성 상태 미확인 처리 |
| GET /api/chat/presence | presence-read 카운터, 공통 대화방 사용자 ZSET 조회·만료 정리 | 500 오류; UI는 활성 상태 미확인 처리 |

멘션함·태그함·태그 필터·메시지 조회·전체 메시지 검색 API는 SQL 권한 검사/조회이며 Redis를 원본으로 조회하지 않는다. 활성 상태는 접속 세션 ID마다 35초 만료 점수를 저장하고 ZSET 키 TTL은45초다. 어느 클라이언트든 살아 있으면 사용자 활성 상태가 유지된다. 읽기 요청은 만료 클라이언트를 정리하며 키 만료 시간을 연장하지 않는다.

## 내부 명령 API

| ID | 명령 | 입력 | 반환·효과 | 구현 |
|---|---|---|---|---|
| REDIS-01 | EVAL INCR/EXPIRE | purpose/userId, 기간 초 | 현재 카운터, 한도 초과면 HTTP 429 | ChatEphemeral.limit |
| REDIS-02 | SET NX EX | roomId/userId, 값 1, 2초 | 최초 입력 신호만 허용 | ChatEphemeral.typing |
| REDIS-03 | PUBLISH | 채널 + Signal JSON | 방 변경 알림, 본문 없음 | ChatOutboxPublisher |
| REDIS-04 | PUBLISH | 채널 + TYPING Signal | 일시적인 입력 상태 | ChatEphemeral.typing |
| REDIS-05 | SUBSCRIBE | timeflow:chat:events:v1 | 여러 API 노드가 같은 변경 신호 수신 | ChatConfiguration, ChatEventHub |
| REDIS-06 | EVAL ZREMRANGEBYSCORE/ZADD/ZREM/ZCARD/EXPIRE | 사용자 키, 현재 시각, 만료 시각, active 또는 read, 클라이언트 UUID | 만료 항목 정리 및 클라이언트별 활성 갱신; 남은 클라이언트 수 | ChatEphemeral.presence / isActive |

Signal 계약:

```json
{"roomId":"01J00000000000000000000010","type":"MESSAGE","userId":null}
```

type: MESSAGE/READ/ROOM/TYPING. TYPING은 userId가 발신자 ID이며 그 외는 null. 문자열 JSON을 UTF-8로 직렬화한다. 서버는 현재 연결 사용자의 참여 여부를 조회한 뒤에만 SSE로 신호를 보낸다. 본문·토큰·이메일을 이벤트에 넣지 않는다. 소비자는 signal을 최종 데이터로 사용하지 않고 해당 방을 REST 재조회한다.

이 구조는 consumer group 작업 큐가 아니다. 한 consumer group으로 Redis Streams를 연결하면 노드 간 이벤트가 분산 소비되어 일부 SSE 노드가 알림을 받지 못할 수 있다. 향후 Streams를 도입하려면 노드별 replay/fan-out 모델과 consumer 수명주기를 별도로 설계해야 한다. 현재 구현은 SQL outbox+Pub/Sub+REST 복구를 사용한다.
