# 검증 기록

- 실행 일시/환경: 2026-11-18, Windows 11, Node 20.18.0, Chrome(헤드리스), Python.
- 명령/결과
  - `node --test tests/empty-states.test.mjs`: 첫 실행 1개 실패(규칙 안내 오탐) → 조건을 좁혀 통과. 옛 형태 사본 검출 확인. PASS
  - `design-tokens.test.mjs`(상태 색 사용처 고정 포함): 8개 통과. PASS
  - 헤드리스 Chrome 캡처: 필터·작성 모달·감사 로그·일간 통계(1400px), 루틴(360px). 360px 넘침은 이전 스타일로도 재현되어 기존 문제로 판정. PASS(넘침은 발견 사항)
  - `color-theme.test.mjs`: store 수정 전 1개 실패(기본 데이터 색), 수정 후 4개 통과. PASS
  - 테마 화면 캡처(라이트·다크·사용자 지정·360px, 다크+플럼 루틴, 세피아+잉크 월간): 첫 캡처의 배치 문제 3건 수정 후 정상. PASS
  - `frontend`에서 Node 테스트 전체 88개 실패 0, `npm run build:web` 종료 0. PASS
  - `python scripts/docs/verify_documentation.py` 오류 0, `python -B scripts/verify_agent_kit.py` 종료 0, 자체 변경 `git diff --check` 종료 0. PASS(07 RUN-50)
- 실제 테스트 결과: 07 RUN-45~RUN-50.
- 보안: 사용자 지정 색 형식 검사(context-notes). PASS(정적 확인과 단위 테스트)
- 웹 접근성: 이름·상태 알림·대비 자동 검사. 320px·키보드·화면낭독기 실측은 NOT_RUN.
- 남은 위험: 320px 가로 넘침(기존), `Modal.vue` 안의 `.modal-secondary` 정의가 사용자 파일에 남아 있음, 카테고리 "업무" 색이 accent 변수라 색상 테마를 바꾸면 함께 바뀜(콘텐츠 색 규칙상 허용).

- 정정: 360px 넘침 판정(헤드리스 캡처)은 창 최소 폭 때문에 무효였다. 07 RUN-51 참조.
