# 채팅 실행·운영 가이드

## 새 로컬 환경

프로젝트 루트의 PowerShell에서 실행한다. 기존 업무 DB와 다른 MySQL 13316/Redis 16389 포트 및 `timeflow-chat` Compose 프로젝트를 사용한다. 아래 로컬 기본 비밀번호/JWT는 개발 전용 값이며 운영에 사용하지 않는다.

```powershell
docker compose -f infra/chat/compose.yml up -d --wait
cd backend
.\gradlew.bat bootRun --args='--spring.profiles.active=chat-local'
```

다른 터미널:

```powershell
cd frontend
npm run dev
```

`/auth/signup`에서 별도 테스트 계정을 만들고, `/chat`에서 상대의 정확한 가입 이메일로 대화를 생성한다. 서로 다른 사용자 검증은 별도 브라우저 프로필/시크릿 창을 사용한다. 인증정보는 탭별 sessionStorage에 저장하고 refresh를 한 번만 병행 실행한다. HttpOnly 쿠키 인증은 현재 서버 계약에 없으므로 이번 구현에서는 도입하지 않았다. 운영 웹의 CSP/XSS 방어와 인증 토큰 보관 정책은 배포 검토에 포함한다.

UI만 확인할 때는 프런트엔드만 실행해 `/chat`, `/mentions`, `/tags`를 연다. 인증 세션이 없으면 검증 스크린샷과 같은 샘플 데이터를 자동으로 표시한다. 샘플 메시지/멘션 읽음 변경은 페이지 메모리에만 저장되며 새로고침 시 초기화된다. 실제 계정으로 로그인하면 서버 API로 전환된다.

포트 변경이 필요한 경우:

```powershell
# backend
.\gradlew.bat bootRun --args='--spring.profiles.active=chat-local --server.port=18080'
# frontend
$env:DEV_API_TARGET='http://127.0.0.1:18080'
npm run dev -- --port 15173
```

Java 실행 시 `java '-Duser.timezone=UTC' -jar build/libs/timeflow-api-0.1.0.jar --spring.profiles.active=chat-local`을 사용한다. 로컬 프로필의 MySQL JDBC는 UTC 세션을 강제한다. 기존 엔티티가 LocalDateTime.now()를 사용하는 부분까지 UTC로 맞추려면 JVM도 UTC로 실행한다. Gradle bootRun은 `JAVA_TOOL_OPTIONS=-Duser.timezone=UTC` 또는 적절한 JVM 옵션을 사용할 수 있다.

개발 환경 종료는 `docker compose -f infra/chat/compose.yml stop`이다. 볼륨은 남아 있어 다음 실행에 메시지가 유지된다. `down -v`는 데이터를 삭제하므로 일상 종료 명령으로 사용하지 않는다.

## 기존 DB에 추가하기

기존 [V1의 테이블명/FK 불일치](../design/04-schema-gaps.md)는 별도 기존 문제다. `chat-local` 프로필은 이를 우회하여 **새로운 전용 로컬 DB**에 현재 JPA 8개 테이블을 부트스트랩하는 경로다. 운영 V1을 덮어쓰거나 이미 적용된 이력을 repair하지 않는다.

기존 환경에서는 `CHAT_ENABLED=true`, 올바른 `spring.datasource.*`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `JWT_SECRET`을 주입한다. 기존 core Flyway 및 JPA 검증이 먼저 성공해야 채팅 migration이 실행된다. 적용 전 실제 테이블/이력·백업을 확인하고 새 `chat_` 테이블과 `flyway_chat_history`가 충돌하지 않는지 점검한다. `db/chat-local-core`를 기존 DB의 Flyway 경로로 설정하지 않는다.

별도 채팅 DB 서버를 사용하는 구성은 아직 아니다. 현재는 같은 데이터소스 안의 별도 모듈/테이블/이력 테이블이다. 물리 DB를 나누려면 ChatRepository에 별도 DataSource/transaction manager를 연결하고 인증 투영 수명주기를 분리해야 한다.

## Redis와 SSE 운영

- Redis는 최초 서버 기동 시 연결 가능해야 한다. 실행 중 단절에서는 메시지는 SQL에 저장되고 outbox가 재시도한다. 브라우저의 15초 재조회가 현재 메시지를 복구한다.
- SSE 프록시 버퍼링 비활성화, 60초 이상의 읽기 타임아웃, origin/CORS allowlist를 적용한다. 브라우저 fetch 스트림에 Authorization을 사용하고 URL에 토큰을 넣지 않는다.
- Redis Pub/Sub는 모든 노드가 같은 채널을 구독한다. 모든 브라우저 연결이 같은 노드에 고정될 필요는 없다. 서버별 emitter는 로컬 메모리이며 노드 재시작 후 브라우저가 다시 연결한다.
- outbox는 최대 25행씩 처리하고 게시 성공 행을 7일 뒤 정리한다. 쌓이는 미발행 행과 오래된 available_at을 경고로 감시한다. Redis 메모리/연결 수/명령 timeout과 SQL room lock 대기도 감시한다.
- 방별 메시지 순번을 위한 행 잠금으로 같은 방 전송을 직렬화한다. 소규모 협업 채팅을 목표로 하며 수천 명 공개 채널의 처리량을 보장하지 않는다. 트래픽 측정 후 room partition/sequence allocator/batch hydration을 검토한다.
- API DTO의 4,000자 제한 외에 reverse proxy request body 크기 제한, 사용자/IP 요청 제한, 부하 테스트, 보존·파기·신고·차단 정책을 운영 환경에 맞춘다.

## 검증 실행

### 메신저와 통합 작성 변경 (2026-10-03)

채팅은 모든 화면의 이동 가능한 버튼으로 열린다. 메신저 목록의 활성 상태 버튼과 대화의 참여자 창에서 접속 상태를 확인한다. `@` 자동완성은 현재 대화 참여자만 제안하며 클릭·방향키·Enter로 선택한다. 통합 검색은 실제 로컬 글과 서버의 전체 채팅 기록을 조회한다. 글 색인은 Web Worker에서 갱신·조회하며, 메시지 검색은 DB gram 색인과 ULID 페이지 이동을 사용한다.

서버를 갱신하면 `V3__message_search.sql`이 적용된다. 새 메시지는 전송 트랜잭션 안에서 색인을 저장하고, 기존 메시지는 20개 단위로 초기 색인을 만든다. 준비 중에는 검색 응답의 `indexing`과 화면 안내로 표시한다. 초기 색인 완료 전 기존 메시지 검색 결과는 일부일 수 있다. 운영 데이터 전체의 부하 시험은 별도로 필요하다.

일정·할 일·루틴·다이어리·위키·업무 기록 등의 편집 상태는 현재 글 저장소가 브라우저 로컬 데이터이므로 같은 브라우저의 창들에서 BroadcastChannel로 공유한다. 다른 기기의 사용자 간 공동 편집 상태와 문서 동기화는 구현된 범위에 포함되지 않는다. 채팅 입력·활성 상태는 실제 인증 사용자를 대상으로 서버에서 처리한다.

기존 Playwright 설치를 사용하는 미리보기 UI 검사 (실제 API 요청을 차단함):

```powershell
# frontend 개발 서버를 15179 포트로 실행한 뒤 프로젝트 루트에서 실행
node scripts/chat/workspace_ui_check.mjs
```

결과와 320px·390px 화면 캡처는 `backend/build/chat-ui/workspace`에 저장한다.

```powershell
cd backend
.\gradlew.bat test bootJar
cd ../frontend
node --test tests/chat.test.mjs
npm run build
```

통합 검사에는 같은 DB/Redis를 사용하는 두 서버를 18080/18081에서 실행한다. 개발 JWT 설정도 동일해야 한다.

```powershell
python scripts/chat/integration_check.py --redis-outage
```

이 검사는 `example.test` 사용자·대화를 생성하며 이 프로젝트의 Redis 개발 컨테이너만 중단·재시작한다. 운영 엔드포인트를 받지 않고 127.0.0.1 고정 주소를 사용한다.

브라우저 검사는 코드 테스트용 Playwright를 빌드 임시 폴더에 설치하여 실행한다. 시스템 Chrome 경로는 `scripts/chat/ui_check.mjs`의 환경값을 확인한다.

```powershell
npm install --prefix backend/build/chat-ui --no-save --package-lock=false playwright
node scripts/chat/ui_check.mjs
node scripts/chat/preview_ui_check.mjs
```

미리보기 검사는 15173 프런트엔드만 필요하며 `/api/` 요청을 전부 차단하여 샘플 화면의 서버 비의존성을 확인한다. 실제 계정 검사는 18080 서버도 필요하다.

검사 결과는 `docs/chat/verification`에 저장하며 토큰·비밀번호를 결과 파일에 저장하지 않는다. 캡처의 사용자·메시지는 검증용으로 생성한 가상 데이터다.
