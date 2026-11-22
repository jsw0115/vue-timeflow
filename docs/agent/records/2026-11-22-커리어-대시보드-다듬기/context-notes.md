# 결정·근거·인수인계 메모

- 현재 확인된 구현/설정: `tokens.css`의 간격 이름은 DESIGN.md보다 한 단계 작다(`--space-lg` 12px = DESIGN sm, `--space-xxl` 24px = DESIGN lg). 이전 대시보드는 DESIGN 이름대로 `--space-lg`를 써서 카드 안쪽이 12px였다. 전역 토큰 이름은 다른 화면 영향이 커서 바꾸지 않고, 화면 CSS 첫 줄 주석에 대응표를 남겼다.
- 전역 `header{display:flex;margin-bottom:32px}`(styles.css:20)가 있어 카드 머리는 `<header>` 대신 `<div>`를 쓴다.
- 선택한 대안/이유:
  - 14일 시간축: 로고(BrandMark)와 같은 문법. 오늘 = 세로 기준선, 앞으로의 계획 = 점선 트랙, 마감 ● / 면접 ◆. 가장 가까운 날은 accent 채움 대신 바깥 고리로 강조했다. `design-tokens.test.mjs`의 accent 채움 허용 목록(주 버튼·선택 표식 등)을 지키고, DESIGN의 "Plan은 중립색"과도 맞는다.
  - 지원 진행 현황: 6줄 숫자 목록 → 누적 막대 + 범례. 단계가 나아갈수록 `--color-data`를 card와 30→88% 섞는다(styles.css heat 단계와 같은 color-mix 방식). 보류는 control-border, 불합격·철회는 빗금 패턴.
  - 카드 배치: 첫 영역 전체 폭, 나머지는 flex-wrap. 목록형(deadlines·activities)은 `flex: 7 1 52%`, 요약형은 `flex: 5 1 38%`라서 목표별 순서가 바뀌어도 넓고 좁은 칸이 내용에 맞게 짝지어진다. 1150px 이하 1열.
  - 날짜: 앱 관례(`slice(5)` = MM-DD, 홈 커리어 위젯)를 따르고 반년 밖은 연도까지 쓴다(`shortDate`). 마감 행에만 요일 한 글자.
  - 카피: `을(를)` → `학력 항목을 채우면…`, 권한 안내 문장은 목표 선택 창으로 옮기고 fieldset `aria-describedby`로 연결. 바로가기 이름: 지원 관리 / 단계별 보기 / 활동 타임라인 / 경력 기록 / 이력서·포트폴리오.
  - 상태: 지원 진행 현황·경력 영역에 오류+다시 시도를 추가(이전에는 불러오기 실패 시 "아직 저장한 지원이 없어요"로 잘못 보였다). 영역 머리의 건수 문구는 불러오기가 끝난 뒤에만 보인다.
- 오탐/예외와 근거·승인 상태: 없음.
- 다음 작업·미확인: (1) 라우터 부제 `목표와 다음 마감, 최근 활동을 한눈에`는 그대로 — 바꿀지 사용자 결정. (2) 홈 커리어 위젯에도 같은 시간축을 쓸지 제안 상태. (3) 누적 막대의 옅은 단계(30%)는 비텍스트 3:1에 못 미친다 — 수치는 범례 글로 주므로 정보 손실은 없지만 대비 도구 점검은 NOT_RUN.
- 마지막 실행 명령·종료 코드·증거 경로: verification.md 참고. 캡처는 세션 scratchpad(임시)에만 있다.
- 완료한 체크리스트 항목과 남은 작업: 체크리스트 전부 완료. 커밋은 요청 없어 하지 않음.
- 중단 원인과 재개 시 첫 명령: 중단 없음. 재확인은 `cd frontend; node --test tests/career-ledger.test.mjs tests/design-tokens.test.mjs`.
- 사용자 변경과 자체 변경 구분: 자체 변경 = `frontend/src/views/career/CareerDashboardView.vue`, `frontend/src/features/career/careerModel.mjs`, `frontend/tests/career-ledger.test.mjs`, 이 기록 폴더. 사용자 미커밋 변경(backend 3파일, careerGoal.mjs, .agents/.claude/.codex/.cursor 등)은 건드리지 않았다.
