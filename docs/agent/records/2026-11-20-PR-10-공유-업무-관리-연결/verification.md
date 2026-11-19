# 검증 기록

## 1단계 공유 서버(2026-11-20)

| 명령 | 환경 | 종료 코드 | 결과 |
| --- | --- | --- | --- |
| `gradlew test --tests "kr.timebar.diary.social.ShareCalendarTest"`(수정 전 코드) | JDK 17·H2 | 1 | FAIL(의도). 기호 없음 컴파일 오류 4건. 07 RUN-124 |
| `gradlew test --tests "kr.timebar.diary.social.*" --tests "kr.timebar.diary.feature.*"` | JDK 17·H2(MySQL 모드)·MockMvc | 0 | PASS. 07 RUN-125 |
| `gradlew test --rerun --console=plain` | JDK 17·H2 | 0 | PASS. 31개 클래스 255개. 07 RUN-126 |
| `node frontend/scripts/frontend-api-contract.mjs --check`, `node frontend/scripts/api-inventory.mjs --check` | Node 22 | 0 | PASS. 292개 operation·199개 schema. 07 RUN-126 |
| 격리 MySQL 8.4 + chat-local 백엔드에서 실제 HTTP 점검(작업 폴더 밖 임시 스크립트) | MySQL 8.4.13 | 0 | PASS 10/10. V11 적용 확인. 07 RUN-127 |

## 2단계 공유 화면(2026-11-20)

| 명령 | 환경 | 종료 코드 | 결과 |
| --- | --- | --- | --- |
| `gradlew test --tests "kr.timebar.diary.social.ShareScreenServerTest"`(수정 전 코드) | JDK 17·H2 | 1 | FAIL(의도). `invited` 기호 없음 컴파일 오류 3건. 07 RUN-128 |
| `gradlew test --tests "kr.timebar.diary.social.*" --tests "kr.timebar.diary.feature.*"`, `node --test tests/share-client.test.mjs` | JDK 17·H2, Node 22 | 0 | PASS. 서버 68개, 프런트 5개. 07 RUN-129 |
| `gradlew test --rerun`, 프런트 Node 테스트(`device-preview` 제외), `npm run build:web`, 계약·목록 `--check` | JDK 17·H2, Node 22 | 0 | PASS. 259개, 179개, 292개. 07 RUN-130 |
| 실제 백엔드·MySQL·Vite·Playwright 두 계정 점검(작업 폴더 밖 임시 스크립트) | MySQL 8.4.13·Chromium | 0 | PASS 22/22, 페이지 오류 0건. 07 RUN-131 |

- 2단계 보안: 이름만 더하고 이메일은 응답에 넣지 않음, 초대 목록은 방장만(403), 초대 거절은 자기 INVITED 행만, 남의 멤버 삭제는 여전히 403(테스트). PASS.
- 2단계 웹 접근성: 상태 문구 `role="status"`·오류 `role="alert"`, 입력 오류 `aria-invalid`·`aria-describedby`, 토글 `aria-pressed`, 진행 중 `aria-busy`, 320px 가로 넘침 없음(브라우저 점검). 화면낭독기 실제 확인은 NOT_RUN.

## 1단계 보안·접근성

- 보안: 응답 필드 최소화(범위 밖 필드·일정 ID 미포함), 접근 통제(활성 멤버만 조회, 그룹에서 빠지면 403), 차단 관계 제외, 계정 열거 완화(정확 일치·같은 404·횟수 제한 429), 입력 검증(허용 밖 범위 400, 이메일 형식 400). PASS(위 테스트).
- 웹 접근성: 1단계 화면 변경 없음. N/A.
- 오탐 제외: 없음.
- 남은 위험: 이메일을 아는 사람에게 가입 여부가 드러날 수 있다(Q-24에서 받아들임). 멤버·기간이 크면 그룹 캘린더 계산이 느려질 수 있다(PR-18에서 측정).
