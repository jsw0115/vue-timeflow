---
name: ui-with-accessibility
description: 웹 UI 신규 작성·수정 중 디자인 시스템과 KWCAG 접근성 및 XSS 방어를 적용할 때 사용한다.
---

# ui-with-accessibility

문서·명령 경로는 프로젝트 루트 기준이다. 기존 `AGENTS.md`와 `PROJECT_CONTEXT.md`를 함께 따른다.

UI·스타일·문구·모션 변경 전 `DESIGN.md` 전체와 `.omd/preferences.md`를 읽는다. 기존 AGENTS의 채택된 System Graph 권위 규칙을 지키며 `DESIGN_GUIDE.md`는 보조 안내로 사용한다. Vue 컴포넌트와 렌더링 결과를 기준으로 검사한다.


1. `DESIGN_GUIDE.md`와 프로젝트 실제 토큰/디자인 시스템을 확인한다.
2. 입력·상태·키보드/초점·대체텍스트·표·오류의 예상 동작을 정의한다.
3. DOM 안전 바인딩과 문맥별 인코딩을 적용하고 렌더링된 HTML·보조기술을 검토한다.
4. `security/WEB_ACCESSIBILITY_KWCAG22_33.md`를 필요한 범위에서 따른다. JSP 전용 정책은 JSP 소스 또는 보고서가 있을 때만 참조한다.
5. 실제 실행한 화면 테스트와 미실행 항목을 구분한다.
