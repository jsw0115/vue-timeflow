# 검증 기록

- 실행 일시/환경: 2026-11-19, 클라우드 작업 환경(Linux), JDK 17.0.21(apt), Gradle 8.14.3 Wrapper, Node 22.23.5, Python 3, Docker 29.10(격리 MySQL 8.4.13·Redis 7.4).
- 1단계 명령과 결과(상세는 07 RUN-96~RUN-99)
  - 수정 전 코드에서 `gradlew test --tests "kr.timebar.diary.records.RecordLinkTest"`: FAIL(의도, `RecordLinks` 없음).
  - 수정 후 `gradlew test --tests "kr.timebar.diary.records.*" --tests "kr.timebar.diary.feature.*" --tests "kr.timebar.diary.task.*"`: PASS, 128개.
  - `gradlew test --rerun --console=plain`: PASS, 29개 클래스 239개, 실패·오류 0.
  - `node --test --test-concurrency=1`(`device-preview.test.mjs` 제외): PASS, 150개. `device-preview.test.mjs` 나머지 2개 PASS, Vite 개발 서버 테스트 1개 NOT_RUN(환경에서 끝나지 않음, 수정 전 코드도 같음).
  - `npm run build:web`: PASS. `frontend-api-contract.mjs --check`: PASS(288 operation, 198 schema). `api-inventory.mjs --check`: PASS(288 경로).
  - `verify_agent_kit.py`: PASS. `git diff --check`: PASS. `verify_documentation.py`: FAIL(01의 기존 깨진 링크 1건, 수정 전과 같음).
  - 실제 백엔드(chat-local, 새 격리 MySQL): 12개 점검 PASS, V10 적용 확인.
- 보안: 소유권(SW 49의 권한 검사, OWASP A01) — 연결·배치·기록 시작 모두 양쪽 기록의 소유자 확인, 다른 계정은 404. 입력 검증(A03) — 종류 허용 목록, ID 100자, 원본 두 필드 함께, 일정 본문은 기존 `FeatureInput.validate`. 동시성·멱등 — 배치는 할 일 행 잠금과 `Idempotency-Key`, 기록 시작은 같은 요청 ID에 원본이 다르면 409. 직접 SQL은 모두 매개변수 바인딩.
- 웹 접근성: 1단계 화면 변경 없음(N/A).
- 오탐 제외: 없음.
- 남은 위험과 승인 필요: 현재 DB 문서 재캡처(사용자 격리 DB), V10 운영 적용(PR-13), 새 격리 DB의 기준선 원인 미확인.
