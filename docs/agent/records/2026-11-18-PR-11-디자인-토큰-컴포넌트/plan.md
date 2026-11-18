# 작업 계획

- 요청(2026-11-18): ① UI·UX 코드는 DESIGN.md를 최우선으로 따르도록 CLAUDE.md에 규칙 추가 ② DESIGN.md의 색·타이포·간격·컴포넌트·Do's and Don'ts로 디자인 시스템 구성, 토큰과 근거 유지, 빠진 hover·disabled·empty 상태를 기존 톤에 맞춰 채움 ③ 템플릿 문구의 "[요청할 화면/컴포넌트]" 구현.
- 사용자 답변: ②는 "토큰·컴포넌트 먼저". 화면 모양이 바뀌는 부록 B 항목은 목록으로 나눠 다음 작업에서 하나씩 맞춘다. ③은 "지금은 없음".
- 현재 확인한 사실
  - DESIGN.md는 사용자가 9장 형식으로 다시 써서 커밋했다(`ebcf9a0`). 부록 B에 코드와 다른 16개 항목이 있다.
  - 토큰은 `styles.css`의 `:root`에 한 줄씩 몰려 있고, 상태 색·`radius.control`·`shadow.overlay` 변수는 없다.
  - button-secondary·icon-button·segmented-tab 공통 클래스가 없다. 비슷한 역할의 `.modal-secondary`는 사용자가 미커밋 수정 중인 `Modal.vue` 안에 있다.
  - `.empty-state` 클래스는 `interaction.css`에 여백만 있고 2곳에서 쓴다.
- 범위: ① CLAUDE.md 5절. ② `frontend/src/design-system/tokens.css`·`components.css`, `main.js` 불러오는 순서, DESIGN.md 4장 상태 보완·empty-state·코드 클래스 표·부록 A·B, 토큰 계약 테스트, 개발 문서(01·06 IM-11·07·09), DESIGN_GUIDE.md.
- 제외: 부록 B의 화면 맞춤(IM-11 2~7단계), `Modal.vue`, `.omd/preferences.md` 정리, 화면 구현(③).
- 성공 기준: 기존 선언 값이 `.empty-state` 외에 바뀌지 않는다. DESIGN.md와 tokens.css 값이 일치한다(부록 B 예외 제외). 공통 컴포넌트가 토큰만 쓴다. 프런트 전체 테스트·빌드·문서 검사 통과.
- 보안: 해당 범위 없음(정적 CSS·문서). 외부 자원 추가 없음.
- 접근성: 포커스 표시 유지, 상태를 색만으로 알리지 않는 규칙, 대비 기준, disabled·loading의 보조기술 전달 방식.
- 허용된 작업: 코드·문서 수정과 로컬 커밋. 푸시는 하지 않는다.
