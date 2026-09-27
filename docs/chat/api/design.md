# 채팅 API 설계서

## 공통

URL 접두사 `/api/chat`, HTTPS 운영을 전제로 한다. `Authorization: Bearer <accessToken>` 헤더로 인증하고 요청 본문의 senderId/userId로 발신자를 지정하지 않는다. 사용자 신원은 기존 `/api/auth`와 동일하다. JSON 응답은 기존 프로젝트 구조인 `{ "success": true, "data": ..., "message": null }`를 사용한다. 204는 본문이 없고 SSE는 JSON 응답 래퍼를 사용하지 않는다.

날짜는 ISO-8601 UTC, ULID와 UUID는 문자열이다. BIGINT 순번도 응답에서는 문자열이다. 요청 sequence/before/after는 0 이상의 십진 정수 또는 이를 표현한 문자열이며 Java Long 범위 내여야 한다. 프런트엔드는 Number로 순번을 바꾸지 않는다.

모든 페이지는 `{ items: [], nextCursor: null|string, hasNext: boolean }`. 기본 limit=50, 1~100만 허용한다. 목록의 커서는 불투명 문자열로 재사용한다. 사용자 지정 userId를 쿼리로 받아 타인의 목록을 반환하는 API는 없다.

## 참여자 및 대화방

`GET /people?email=정확한이메일`은 이메일을 trim·소문자 처리한 후 활성 계정 한 건을 `{id,nickname}`으로 반환한다. 이메일 주소나 전체 사용자 목록은 반환하지 않으며 자신은 제외한다. 없는 상대는 404. 호출자당 20회/60초 제한, Redis 장애 시 이 조회는 429로 닫는다. 현재 정책은 등록 사용자끼리 즉시 대화를 시작할 수 있는 초기 서비스 기준이다.

`POST /rooms`:

```json
{ "kind": "GROUP", "name": "목요일 회고", "memberIds": ["01J00000000000000000000001", "01J00000000000000000000002"] }
```

kind는 정확히 DM/GROUP. memberIds에는 본인을 제외하며 중복·비활성 계정은 거부한다. DM은 정확히 한 명, GROUP은 1~19명과 공백 아닌 이름 1~80자. 본인은 서버가 추가한다. DM의 이름은 저장하지 않고 상대 닉네임으로 표시한다. 방 생성은 초대 수락 흐름을 포함하지 않는다. 동일 DM은 200으로 기존 방을 반환한다. 그룹 생성 자체에는 멱등키를 적용하지 않으므로 자동 재시도하지 않는다.

`GET /rooms?before=<roomId>&limit=50`은 **roomId 내림차순**으로 페이지한다. UI는 불러온 항목들을 최근 활동순으로 표시한다. 검색은 현재 불러온 대화 이름에 적용한다. `GET /rooms/{id}`는 같은 Room 구조 한 건이다.

```json
{
  "id": "01J00000000000000000000010",
  "kind": "GROUP",
  "name": "목요일 회고",
  "ownerId": "01J00000000000000000000001",
  "lastSequence": "12",
  "unreadCount": 2,
  "lastMessage": null,
  "members": [{ "userId": "01J00000000000000000000001", "nickname": "지수", "lastReadSequence": "10" }],
  "updatedAt": "2026-09-27T00:00:00Z"
}
```

lastMessage는 저장된 최신 Message 요약 또는 null이며 요약의 tags/mentionUserIds는 빈 배열이다. 상세 어노테이션은 메시지 조회 결과를 사용한다. unreadCount는 본인이 보낸 메시지를 제외한 미열람 개수다.

## 메시지 전송·재시도

`POST /rooms/{id}/messages`:

```json
{
  "clientMessageId": "bcb9b7f7-45a1-49fb-8e01-1a5ce5fcf291",
  "body": "@서연 오늘 #회고 에서 #Plan 을 나눠요.",
  "mentionUserIds": ["01J00000000000000000000002"]
}
```

- clientMessageId는 클라이언트가 한 번 생성한 canonical 소문자 UUID. 네트워크 오류 후 재시도에도 같은 값을 보낸다.
- body는 공백 아닌 1~4,000 Java/JS UTF-16 코드 단위. 앞뒤 공백은 저장 전 strip한다. HTML/Markdown을 해석하지 않는다.
- mentionUserIds는 생략 또는 빈 배열 가능. 다른 활성 참여자 최대 19명, 중복은 집합 처리. @문자열만 작성하면 멘션 알림이 생성되지 않는다. UI의 참여자 선택이 기준이다.
- 태그는 요청 별도 배열을 신뢰하지 않고 본문에서 추출한다. 최대 10개, 태그당 1~32자, NFKC+소문자 정규화. SQL 저장과 같은 트랜잭션이다.
- `(roomId,senderId,clientMessageId)`가 같고 정규화 본문·멘션 집합이 같으면 같은 저장 결과를 반환한다. 내용이 다르면 409. 영속 메시지가 남아 있는 동안 멱등성이 유지되며 Redis TTL에 의존하지 않는다.
- 메시지 ACK는 SQL COMMIT 성공을 의미한다. 상대가 온라인인지, 이미 읽었는지와는 별개다. Redis가 중단돼도 저장이 가능하고 outbox가 나중에 알린다.

Message:

```json
{
  "id": "01J00000000000000000000020",
  "roomId": "01J00000000000000000000010",
  "sequence": "13",
  "senderId": "01J00000000000000000000001",
  "senderName": "지수",
  "clientMessageId": "bcb9b7f7-45a1-49fb-8e01-1a5ce5fcf291",
  "body": "@서연 오늘 #회고 에서 #Plan 을 나눠요.",
  "createdAt": "2026-09-27T00:00:00Z",
  "tags": ["plan", "회고"],
  "mentionUserIds": ["01J00000000000000000000002"]
}
```

## 메시지 조회·태그 필터

| 요청 | 의미 |
|---|---|
| GET /rooms/{id}/messages | 최근 50개 |
| GET /rooms/{id}/messages?before=13&limit=50 | 순번 13 미만의 직전 페이지 |
| GET /rooms/{id}/messages?after=13&limit=50 | 순번 13 초과의 누락 메시지, 오래된 것부터 |
| GET /rooms/{id}/messages?tag=회고 | 해당 방의 회고 태그 메시지만 |
| GET /rooms/{id}/messages?tag=회고&before=13 | 태그 결과의 이전 페이지 |

before와 after는 동시 사용 불가. before는 1 이상, after는 0 이상. 응답 items는 항상 순번 오름차순으로 표시한다. nextCursor는 **쿼리 방향**에 따른 마지막 조회 위치이며, 이전 페이지 요청에서는 items[0] 쪽 순번이다. after 페이지는 hasNext가 false일 때까지 따라가야 한다. 동일 메시지 ID는 클라이언트에서 중복 제거한다. 태그 필터 결과를 보는 행위로 모든 메시지를 읽음 처리하지 않는다.

## 읽음·참여 관리

`PUT /rooms/{id}/read` body `{ "sequence": "13" }` → `{roomId,lastReadSequence}`. 기존 값보다 작은 요청은 현재 값을 유지한다. 방에 저장된 마지막 순번을 초과하면 400. 브라우저 탭이 보이고 메시지 목록의 하단을 확인했을 때 호출한다.

`PUT /rooms/{id}/owner` body `{ "userId": "새방장ID" }`: 현재 그룹 방장만 호출하며 대상은 현재 활성 참여자여야 한다. DM은 403. 변경 성공은 data:null.

`DELETE /rooms/{id}/members/me`: 그룹에서 본인만 나갈 수 있다. 다른 참여자가 남은 방장은 이전 후 나간다(그 전 요청 409). DM에서는 나가기 미지원(409). 나간 뒤 메시지·멘션·태그 조회 권한을 즉시 잃고, 발신 이력은 보존된다.

`POST /rooms/{id}/typing`: body 없음, 204. 입력 중 알림은 2초 간격으로 제한하고 UI에서 약 3.5초 뒤 숨긴다. 실패해도 메시지 전송에 영향이 없다.

## 멘션함·태그함

| API | 파라미터·본문 | 결과/규칙 |
|---|---|---|
| GET /mentions | before=messageId, unread=true/false(기본 false), limit | 현재 참여 방에서 본인에게 온 멘션, messageId 내림차순 |
| PUT /mentions/{messageId}/read | 본문 없음 | 본인 멘션만, 최초 확인 시각 유지, 여러 번 호출 가능 |
| GET /tags | after=tagName, limit | 현재 참여 방에서 사용된 태그, 이름순 오름차순 |
| GET /tagged-messages | tag 필수, before=messageId, limit | 현재 참여 방 전체의 해당 태그 메시지, messageId 내림차순 |

InboxItem은 `{ message: Message, roomName: string, read: boolean }`. read는 멘션 확인 상태이며 태그 결과에서는 false이다. 태그 결과의 false를 미열람 메시지 의미로 사용하지 않는다. TagCount는 `{name:string,messageCount:number}`이며 카운트에도 참여 권한 필터를 적용한다. 다른 사용자의 비공개 태그 이름·개수를 노출하지 않는다. 멘션 읽음은 방 읽음과 독립이며 Redis에 저장하지 않는다.

## SSE

`GET /events`, Accept:text/event-stream, Authorization 헤더 필수. URL에 JWT를 넣지 않는다. 브라우저 기본 EventSource 대신 인증 fetch의 ReadableStream을 해석한다.

```text
event: connected
data: {"reconcile":true}

event: changed
data: {"roomId":"01J00000000000000000000010","type":"MESSAGE","userId":null}
```

type은 MESSAGE/READ/ROOM/TYPING. TYPING만 userId가 있고 본문은 없다. 15초 heartbeat, 연결 수명은 최대 60초 또는 JWT 만료까지이며 재연결 때 토큰을 다시 검증한다. 클라이언트는 필요하면 기존 refresh API를 한 번 호출한다. 노드당 사용자 SSE 연결 5개 제한. Last-Event-ID 재생 계약은 제공하지 않으며 connected 수신 후 REST로 동기화한다. 프록시는 버퍼링을 끄고 읽기 타임아웃을 60초 이상으로 설정한다.

## 오류

실패 응답은 `{success:false,data:null,message:"사용자 안내"}`. 기존 공통 API 계약에 맞추어 별도 문자열 error code 필드는 도입하지 않았다.

| HTTP | 경우 | 처리 |
|---|---|---|
| 400 | 빈 본문, 형식 오류, 잘못된 UUID/커서/순번, 태그 한도 | 입력 수정 |
| 401 | 인증 누락·만료 | refresh 1회, 실패하면 로그인 |
| 403 | 비활성 계정, 방장 권한 없음 | 재시도하지 말고 권한 확인 |
| 404 | 방·멘션 없음 또는 참여 권한 없음, 상대 없음 | 목록 새로고침; 존재 여부를 구별하지 않음 |
| 409 | 멱등키 내용 충돌, 방장 이전 필요, DM 나가기 | 새 전송은 새 UUID, 기존 재전송은 본문 유지 |
| 429 | Redis 요청 제한, SSE 연결 한도 | 잠시 후 재시도. Retry-After 헤더는 현재 미제공 |
| 500 | DB·예상하지 못한 서버 오류 | 메시지는 같은 clientMessageId로 재시도 |

Redis 장애 시 전송·생성 제한은 가용성을 위해 fail-open이며 조회 제한은 fail-closed다. 공개 운영에서는 게이트웨이 측 인증 사용자/IP rate limit을 함께 둔다. 애플리케이션의 그룹 초대/차단 정책이나 서비스 레벨 권한을 FK가 대신하지 않는다.
