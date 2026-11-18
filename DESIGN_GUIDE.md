# 디자인·접근성 적용 안내

UI·스타일·문구·모션을 바꾸기 전에 [DESIGN.md](DESIGN.md) 전체와 [.omd/preferences.md](.omd/preferences.md)를 읽는다. 유효하게 채택된 Core v2 manifest와 해시 결합 System Graph가 존재하면 기존 AGENTS의 권위 규칙을 따른다. 이 가이드는 별도 디자인 계약이 아니다.

- 실제 토큰은 [tokens.css](frontend/src/design-system/tokens.css), 공통 컴포넌트 클래스는 [components.css](frontend/src/design-system/components.css), 공통 요소는 [components](frontend/src/components), 화면은 [views](frontend/src/views)에서 확인한다. DESIGN.md와 충돌하면 DESIGN.md를 따른다(CLAUDE.md 5절).
- 시맨틱 버튼·링크·레이블, 오류 안내, 키보드·초점 이동과 복원, 대비, 작은 화면·확대, 동작 감소를 검토한다.
- [KWCAG 33개 참고표](security/WEB_ACCESSIBILITY_KWCAG22_33.md)는 변경 화면에 맞춰 선택한다. 자동 검사·수동 키보드·보조기술 검증 상태를 분리한다.
- Vue 바인딩과 실제 렌더링 결과를 확인한다. JSP 지시문 전용 판단을 Vue에 적용하지 않는다.

작업 시작 시 DESIGN.md 뒤에 ezConference Master가 함께 있었다. 2026-11-15 해시 대조에서 manifest의 graph·coverage·provenance는 일치했지만 DESIGN.md는 일치하지 않았다. 따라서 manifest 존재만으로 현재 전체 구성이 유효하게 채택된 계약이라고 단정하지 않는다. .omd/preferences.md의 현재 pending 항목은 ambient/inferred 관찰이며 사용자 명시 수정이라고 단정하지 않는다. 실제 UI 작업에서 충돌 범위를 확인해야 한다. 이번 키트 적용은 디자인 파일·그래프를 변경하거나 ZIP의 디자인 마스터 템플릿을 추가하지 않는다.
