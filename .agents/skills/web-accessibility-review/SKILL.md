---
name: web-accessibility-review
description: JSP·HTML·SPA 등 웹 페이지를 KWCAG 2.2의 33개 접근성 항목으로 검토할 때 사용한다.
---

# web-accessibility-review

문서·명령 경로는 프로젝트 루트 기준이다. 기존 `AGENTS.md`와 `PROJECT_CONTEXT.md`를 함께 따른다.

검토 대상은 실제 Vue 화면·컴포넌트와 렌더링 결과다. 수정이 필요하면 먼저 `DESIGN.md` 전체와 `.omd/preferences.md`를 읽고 기존 디자인 계약을 지킨다.


1. `security/WEB_ACCESSIBILITY_KWCAG22_33.md`를 읽고 변경 페이지의 적용 항목을 선택한다.
2. 렌더링된 HTML·시맨틱·이미지/표/폼·키보드/초점·대비·모달·인증·오류를 확인한다.
3. 자동 분석 결과는 보조자료로 사용하며 키보드·브라우저 검증을 따로 기록한다.
4. JSP 태그 존재만으로 접근성 실패나 제외를 판단하지 않는다.
5. 각 항목에 페이지·시나리오·상태·증빙·수정안을 기록한다.
