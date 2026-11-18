# 결정·근거·인수인계 메모

- 현재 확인된 구현/설정: 토큰은 `frontend/src/styles.css` `:root`, 타입은 `typography.css`, 반응형은 `styles.css`·`interaction.css`·`typography.css`의 media query에 있다.
- 선택한 대안/이유
  - 사용자 선택: 포인트 컬러 #2f5d46 유지 + Figma 구조 채택, 코드의 상태 색을 팔레트에 기록.
  - Figma에서 채택: hairline #ebebeb, radius.control 8px(button-secondary), segmented-tab pill 형태, icon-button 40px 원형, shadow.overlay, "콘텐츠 색은 인터페이스 토큰이 아니다" 원칙, 모노 서체는 구조 신호에만.
  - Figma에서 미채택: 인디고 #4d49fc(포인트 1개 원칙), 포커스 #0d99ff(흰 배경 대비 2.99:1).
  - 값이 충돌하면 기존 계약 값을 유지하고 코드 차이는 부록 B에 기록. 근거 없는 상태는 "미정".
- 오탐/예외와 근거·승인 상태: 없음.
- 다음 작업·미확인: 부록 B 항목의 코드 반영, omd 그래프 재채택(omd 워크플로), pending preference 정리, 원격 푸시.
- 마지막 실행 명령·종료 코드·증거 경로: verification.md 참고.
- 완료한 체크리스트 항목과 남은 작업: 문서 작업은 완료. 코드 반영은 별도 요청.
- 중단 원인과 재개 시 첫 명령: 원격 푸시가 권한 확인 단계에서 막혔다. 재개 시 `git push -u origin master`.
- 사용자 변경과 자체 변경 구분: 시작 시 작업 트리가 깨끗했다. 변경은 모두 이 작업의 것이다.
