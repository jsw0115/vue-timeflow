---
name: feature-with-security
description: 새 기능·버그 수정 중 SW 49개, 웹 28개, 접근성 점검을 함께 적용하며 구현·테스트할 때 사용한다.
---

# feature-with-security

문서·명령 경로는 프로젝트 루트 기준이다. 기존 `AGENTS.md`와 `PROJECT_CONTEXT.md`를 함께 따른다.

Timebar Diary의 Vue 로컬 store와 Spring 서버 저장 경계를 구분한다. `TEST_GUIDE.md`에서 실제 테스트 명령을 선택한다. 전체 감사 요청이 없으면 변경 범위의 항목만 점검한다. UI·스타일·문구·모션 변경 전 `DESIGN.md` 전체와 `.omd/preferences.md`를 읽는다.


1. `PROJECT_CONTEXT.md`와 실제 코드/테스트를 확인한 뒤 성공 기준을 정한다.
2. 변경되는 진입점·출력·인증/권한 경계를 추적한다. 관련 `security/SW_SECURE_CODING_49.md`, `security/WEB_VULNERABILITY_28.md`, `security/OWASP_TOP10_2025.md` 항목을 선택한다.
3. 웹 UI 변경은 `security/WEB_ACCESSIBILITY_KWCAG22_33.md` 적용 항목을 추가한다.
4. 최소 구현 후 정상·부정·권한·오류 테스트를 수행하고 `security/DEVELOPMENT_SECURITY_GATE.md`를 확인한다.
5. JSP 소스 또는 보고서가 있을 때만 JSP 오탐은 `security/JSP_FALSE_POSITIVE_POLICY.md`로 검토한다.
6. 변경 파일·검사 상태·실행 증빙·미확인을 보고한다. 검증한 자체 변경의 커밋은 기존 AGENTS 규칙을 따르며 배포·외부 스캔은 사용자 요청의 허용 범위에서 수행한다.
