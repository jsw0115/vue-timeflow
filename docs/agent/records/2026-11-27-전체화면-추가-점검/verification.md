# 검증 기록

- 실행 일시/환경: 2026-11-26~27(KST), 컨테이너 Linux, Node 22.23.5, JDK 21, Chromium(Playwright), Docker(격리 MySQL 8.4·Redis 7.4).

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
|---|---|---:|---|---|
| 프로덕션 빌드 | `npm run build:web` | 0 | 빌드 성공(점검 대상) | PASS |
| 화면 자동 점검 | `vite preview` + Chromium, 106개 경로 × 18조건 | 0 | 오류 0, 넘침 0, lang 불일치 0, 라벨 없는 입력칸 0, 다크 링크 대비 부족(BUG-012) | REVIEW |
| 키보드 | Tab 순서·대화 상자 6곳·본문까지 Tab 횟수 | 0 | 초점 표시 누락 0, 대화 상자 정상, 본문 바로가기 없음(BUG-013) | REVIEW |
| 격리 DB·백엔드 | `docker compose -f infra/chat/compose.yml up -d --wait`, `./gradlew bootRun --args="--spring.profiles.active=chat-local --server.port=8080"` | 0 | Flyway 적용 후 시작 | PASS |
| 실제 백엔드 흐름 | `vite` 개발 서버 + Chromium | 0 | 가입·로그인·만들기·완료·삭제·표시 언어 저장 정상, 106개 경로 화면 오류 0. 서버 오류 문구 한국어(BUG-014), 메모 변환·수정·삭제(IMP-019·IMP-020) | REVIEW |
| 화면 읽기 프로그램·실기기 | 실행하지 않음 | - | 이 환경에 없다 | NOT_RUN |
| 문서 구조 | `python3 scripts/docs/verify_documentation.py` | 0 | 오류 0 | PASS |
| 에이전트 키트 | `python3 -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |

- 보안: 해당 없음(코드 변경 없음). 점검용 계정·격리 DB만 썼고 운영 DB·외부 스캔은 하지 않았다.
- 웹 접근성: 대비(4.5:1), 초점 표시, 대화 상자 초점, 6.4.1 반복 영역 건너뛰기. 정식 KWCAG 점검 아님.
- 오탐 제외: [추가 점검 결과의 "오탐으로 판단한 것"](../../../quality/browser-test-2026-11-27.md#오탐으로-판단한-것).
- 남은 위험과 승인 필요: BUG-012~BUG-014 수정과 IMP-019~IMP-022 결정은 사용자 요청이 필요하다.
