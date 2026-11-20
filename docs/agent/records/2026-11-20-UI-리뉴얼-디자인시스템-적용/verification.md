# 검증 기록

- 실행 일시/환경: 2026-11-20 20:40~21:40 KST, Windows 11, Node v20.18.0(package.json engines는 >=22.12 — 로컬 설치 버전이 낮음, 기존과 같은 조건), Chrome(headless, playwright-core 1.49), Vite 6.4.3 dev(127.0.0.1:15173), 백엔드 chat-local 프로파일(127.0.0.1:18080, `infra/chat/compose.yml` MySQL 8.4·Redis 7.4).

## 명령·결과

| 검사 | 명령 | 결과 |
|---|---|---|
| 프런트 Node 테스트 전체 | `cd frontend; node --test --test-concurrency=1 (tests/*.test.mjs)` | PASS 222/222, 종료 0 |
| 토큰·컴포넌트 계약 | `node --test tests/design-tokens.test.mjs tests/color-theme.test.mjs` | PASS 12/12 |
| 웹 빌드 | `npm run build:web` | PASS 종료 0(청크 500kB 경고는 기존과 같음) |
| 320px 가로 넘침 | `scripts/dev/overflow-sweep.html?w=320` 96개 경로 | PASS 0개(수정 전 2개: 주간 기간 이름, 월간 히트맵 칸) |
| 390·768·1024px 가로 넘침 | 같은 도구 w=390·768·1024 | PASS 각 0개 |
| 테마 설정 브라우저 회귀 | scratchpad `pw/check-theme.mjs`(실제 백엔드) | PASS 15/15(미리보기·취소·적용·기본값·계정 저장·다른 브라우저 동기화·320/390 넘침) |
| 접근성 이름·키보드 | scratchpad `pw/a11y.mjs` 16개 화면 | PASS 이름 없는 버튼·링크 0, Tab으로 헤더 대표 행동 도달·포커스 링 solid 2px, 캘린더 날짜 Enter 선택, reduced-motion 전환 0s |
| 화면 캡처 | `pw/shot2.mjs`, `pw/shot-auth.mjs`(로그인 계정), `pw/dark.mjs` | REVIEW(눈으로 확인): 1440·1024·768·390·320에서 홈·일간/주간/월간/연간 플래너·캘린더·할 일·일정·루틴·메모·D-Day·다이어리·통계 4종·공유·주소록·커뮤니티·채팅·환경설정 4종·로그인. 다크+잉크, 세피아+클레이 확인 |
| 에이전트 키트 | `python -B scripts/verify_agent_kit.py` | PASS 종료 0 |
| 문서 구조 | `python scripts/docs/verify_documentation.py` | FAIL(기존): `README.md: 작성일·수정일 누락`, `README.md: 목차 누락`. README.md는 이번 작업에서 바꾸지 않았고 최신 커밋 be03f12에서 생긴 상태다 |

## 보안(SW 49 / 웹 28 / OWASP)
- 해당 범위: 화면·CSS·클라이언트 표시만 바꿨다. API URL·요청/응답·인증·권한·DB·업로드 변경 없음.
- `v-html` 새 사용 없음(아이콘은 render 함수 `h()`로 정적 도형만 그린다). 외부 의존성 추가 없음.
- 사용자 입력이 새로 서버로 가는 경로 없음. N/A 외 항목 없음.

## 웹 접근성(KWCAG 2.2 관련)
- PASS(증빙: a11y.mjs·코드): 대체 텍스트/이름(스위치 9곳 aria-label 추가, D-Day 고정 버튼 aria-label 바인딩 버그 수정), 키보드 사용(캘린더 항목·자동화 설정 링크를 div/a@click → RouterLink·button), 초점 이동·표시, 색 외 구분(계획 점선/실제 실선, 캘린더 종류 모양, 히트맵 점, 범례 이름·비율), 동작 줄이기.
- REVIEW: 200% 확대 전 화면 확인, 스크린리더 실제 낭독, 관리자 화면(관리자 계정 필요).

## 남은 위험과 승인 필요
- 관리자 콘솔은 관리자 권한 계정이 없어 로그인 상태 화면을 캡처하지 못했다(REVIEW). 공통 클래스 변경이 그대로 적용된다.
- 화면 일부는 여전히 예시 데이터(주간·월간·연간 플래너, 일간 통계, 갓생 리포트, 홈 위젯 일부)다. 이번에 '시연용 예시 데이터' 문구를 붙였고 실제 계산 연결은 별도 작업이다.
- 알림 설정의 카카오 알림톡 인증은 실제 발송이 없는 시연이다. 문구를 '실제로 보내지 않아요'로 바꿨고 기능 연결은 하지 않았다.
- 2026-11-20 사용자 요청으로 자체 변경만 기능 단위 11개 커밋으로 나눴다. 사용자 미커밋 변경(backend 2개 파일, Modal.vue, security/ 문서 4개, docs/output/)은 커밋하지 않았다. 중간 커밋을 하나씩 빌드하지는 않았고, 마지막 상태에서 전체 테스트·빌드를 확인했다.
- 관리자 계정 확인은 사용자 요청으로 시작했다가 중단됐다(REVIEW 유지). 방법: 격리 DB에서 가입한 계정의 users.role을 ADMIN으로 바꾼다(docs/dev-docs/07 PR-10 5단계 사전 조건).

## 파비콘(2026-11-20 밤)
| 검사 | 방법 | 결과 |
|---|---|---|
| 작은 크기 판독 | 16·32·48px 렌더링을 밝은·어두운 탭 바탕에 확대 비교 | REVIEW(눈으로 확인): 16px에서도 점선(계획)·실선과 점(실제) 구분 |
| 파일 응답·링크 | 개발 서버에서 favicon.svg·ico·apple-touch-icon 요청, 홈·일간 플래너·테마 설정 이동 | PASS 200·올바른 형식, 링크 해석 정상, 404 없음(이전 캡처마다 보이던 404 해소) |
| 빌드·테스트 | `npm run build:web`, Node 테스트 전체, `scripts/check-design-docs.mjs` | PASS 빌드, 224/224, 디자인 문서 검사 통과 |
