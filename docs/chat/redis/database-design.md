# Redis 데이터 설계서

2026-09-27 · Redis 7.4 · 코드: `chat/infrastructure/redis`

Redis는 메시지 원문·멘션함·태그함·읽음 위치의 원본 저장소가 아니다. 해당 정보는 [관계형 DB 8개 테이블](../database/design.md)에 저장한다. 아래 자료는 Redis의 키·채널 모델이며 SQL CREATE TABLE과 구분한다.

| 구분 | 키/채널 패턴 | 자료형·값 | TTL | 용도 |
|---|---|---|---|---|
| 변경 이벤트 | timeflow:chat:events:v1 | Pub/Sub 채널, JSON Signal | 저장되지 않음 | 모든 API 노드에 방 변경 알림 |
| 전송 제한 | timeflow:chat:rate:send:{userId} | String 정수 카운터 | 최초 증가부터 10초 | 사용자당 30회 제한 |
| 방 생성 제한 | timeflow:chat:rate:create:{userId} | String 정수 카운터 | 60초 | 사용자당 10회 제한 |
| 사용자 조회 제한 | timeflow:chat:rate:lookup:{userId} | String 정수 카운터 | 60초 | 정확 이메일 조회 20회 제한 |
| 입력 중 억제 | timeflow:chat:typing:{roomId}:{userId} | String "1" | 2초 | 동일 사용자 연속 TYPING 발행 억제 |

환경별 Redis 인스턴스를 분리한다. 모든 키에 서비스/모듈 prefix를 두고 사용자 입력 문자열을 키에 그대로 쓰지 않는다. API 요청에서 인증된 사용자 ID와 검증한 방 ID만 사용한다. prod와 dev가 같은 Pub/Sub 인스턴스를 공유하지 않도록 한다. Redis 논리 DB 번호만 달리해도 Pub/Sub 채널은 분리되지 않는다.

## 원자성

요청 카운트와 최초 TTL을 Lua 한 번으로 처리하여 INCR 직후 프로세스 중단으로 만료 없는 키가 남는 문제를 피한다.

```lua
local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return n
```

TYPING은 SET key 1 NX EX 2가 성공한 요청만 PUBLISH한다. 클라이언트는 마지막 입력 신호 후 3.5초가 지나면 표시를 제거한다. Redis 키 만료 이벤트 수신에 의존하지 않는다.

## 내구성과 복구

- Pub/Sub 전달은 at-most-once다. Redis 수신 노드가 끊긴 동안 이벤트가 사라질 수 있다. [공식 문서](https://redis.io/docs/latest/develop/pubsub/).
- SQL outbox는 메시지 저장과 원자적으로 생성한다. 1초 간격 worker가 최대 25개를 SKIP LOCKED로 획득하고 PUBLISH한다. 실패 시 지수형 대기(현재 계산 최대 256초)를 설정하고 다음 실행에서 재시도한다. 여러 노드에서도 같은 행을 동시에 발행하지 않는다. 발행 후 DB 커밋 전 장애는 중복을 만들 수 있다.
- published_at은 Redis PUBLISH 명령 성공이며 구독자 수신 ACK가 아니다. 구독자 수가 0이어도 발행 완료로 처리하고, 브라우저는 REST로 복구한다. exactly-once 또는 “모든 클라이언트 수신 보장”을 주장하지 않는다.
- 재연결 즉시 및 탭 활성 상태에서 15초마다 SQL 메시지를 after 커서로 다시 조회한다. 태그·멘션·읽음 정보는 Redis를 잃어도 소실되지 않는다.
- 개발 Compose는 AOF yes/noeviction/128MB를 사용한다. 이 설정이 채팅 원본 내구성을 담당하는 것은 아니다. 메모리 부족·Pub/Sub 단절·명령 지연은 모니터링해야 한다.

## 접근·운영

로컬 Compose는 127.0.0.1만 바인딩한다. 운영 Redis는 사설망·인증·TLS를 적용하며 `REDIS_PASSWORD` 및 Spring Redis SSL 설정을 배포 환경에서 구성한다. 사용 명령은 GET/SET/INCR/EXPIRE/EVAL/PUBLISH/SUBSCRIBE 계열로 제한 가능한 ACL을 준비한다. 브라우저에서 Redis로 직접 접속하지 않는다.

요청 제한은 Redis 사용 불가 시 메시지 전송·생성에는 fail-open, 이메일 조회에는 fail-closed 정책이다. DB의 메시지 유일성·소유권 제약은 계속 유지된다. 장애 중 가용성 정책과 별개로 운영 게이트웨이의 요청 제한은 필요하다. 미발행 outbox 수, 가장 오래된 대기 시간, attempts, Redis latency/memory/connection count, SSE 연결 수를 운영 지표로 수집한다.
