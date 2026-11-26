# 검증 기록

- 실행 일시/환경: 2026-11-25~2026-11-26, 클라우드 컨테이너(Linux), Node 22.23.5, OpenJDK 17. 운영 DB·외부 제공자·실기기는 쓰지 않았다.
- 명령/버전/종료코드: 아래 표. 단계별 원본은 dev-docs 07 RUN-255~RUN-281이다.
- 실제 테스트 결과: 아래 표.
- 보안: REVIEW. 정식 SW 49·웹 28·OWASP 점검은 하지 않았다. 확인한 것만 적는다: 서버가 `locale`·문서 버전 `language`를 ko·en만 받는다(SettingsLocaleTest, DocumentVersionsTest). `v-html`은 홈 첫 문장에만 쓰고 그 값은 모드 설정과 사전의 고정 문구다(사용자 입력 아님).
- 웹 접근성: REVIEW. 정식 KWCAG 점검은 하지 않았다. 확인한 것: 영어로 옮긴 화면은 `<html lang>`이 en, 그 밖은 ko(브라우저 확인). 함께 고친 접근성 문제: D-Day 화면 aria-label 바인딩 누락, 도움말 버튼 이름 "사용법 사용법" 중복, 일정 색 버튼 이름 없음.
- 오탐 제외: 없음.
- 남은 위험과 승인 필요: 남은 화면 4묶음은 영어를 골라도 본문이 한국어다. 사용자가 만든 분류 이름이 사전 키와 같으면 영어로 보인다(예: "업무").

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
|---|---|---:|---|---|
| 프런트 전체(최종) | `node --test --test-concurrency=1 <tests/*.test.mjs 중 device-preview 제외>` | 0 | 372개 통과(07 RUN-281) | PASS |
| 프로덕션 빌드(최종) | `npm run build:web` | 0 | 빌드 성공 | PASS |
| 백엔드 전체(문서 버전 언어 단계) | `bash gradlew test --console=plain`(JDK 17) | 0 | 367개, 실패 0(07 RUN-277) | PASS |
| API 계약 | `node scripts/frontend-api-contract.mjs --check` | 0 | 334개 작업·223개 스키마 생성·검사, 문서 버전 `language` 포함(07 RUN-277) | PASS |
| device-preview 시험 | 실행하지 않음 | - | 이 컨테이너에서는 기존부터 멈추는 시험이라 범위에서 뺐다 | NOT_RUN |
| 에이전트 키트 구조 | `python3 -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |
| 문서 구조 | `python3 scripts/docs/verify_documentation.py` | 0 | 오류 0(2026-11-26 루트 README 날짜·목차, api-info 끊긴 링크 정리 뒤) | PASS |
| 브라우저 | `vite preview` + Chromium(가짜 API) | - | RUN-269~RUN-280은 단계마다 영어(1440·320px)와 한국어를 확인했다. RUN-281은 1440px 로그아웃 상태 한국어·영어만 봤다. 페이지 오류 0. 실제 백엔드와 붙인 확인은 아니다 | PASS |
