# 검증 기록

- 실행 일시/환경: 2026-11-20(한국 시간), JDK 17.0.21, Gradle Wrapper, Node 22.23.5.
- 1단계(상세는 07 RUN-115~RUN-117)
  - 수정 전 코드에서 `IdempotencyHttpTest`: FAIL 1개(의도, 재전송 수정 409).
  - 수정 후 `IdempotencyHttpTest`·`kr.timebar.diary.task.*`: PASS.
  - `gradlew test --rerun`: PASS, 30개 클래스 247개.
  - `frontend-api-contract.mjs --check`, `api-inventory.mjs --check`: PASS(288).
- 2단계(상세는 07 RUN-118·RUN-119)
  - 모듈 없이 `outbox.test.mjs`: FAIL(의도). 첫 실행 1개 실패(반응형 객체 복제), 고친 뒤 10개 PASS.
  - 프런트 Node 테스트 169개, `npm run build:web`, `verify_agent_kit.py`, `git diff --check`: PASS.
  - IndexedDB 저장소: NOT_RUN(Node에 IndexedDB 없음). 3단계 브라우저에서 확인한다.
- 보안(2단계): 대기열은 계정 색인으로만 읽고, 보내는 중 계정이 바뀌면 멈춘다. 기기 저장소에는 요청 본문만 두고 토큰은 두지 않는다. 충돌은 자동으로 덮지 않는다.
- 보안(1단계): 멱등 키는 계정별이고 요청 해시에 기록 ID와 본문을 넣는다. 같은 키·다른 기록·다른 본문은 409. 실패한 요청은 트랜잭션이 되돌려 키가 남지 않는다.
- 웹 접근성: 1·2단계 화면 변경 없음(N/A).
- 남은 위험: 7일이 지난 키는 지워져, 오래 남은 대기 항목의 재전송은 처음 요청처럼 처리된다(이미 반영된 수정이면 409로 확인 필요).
