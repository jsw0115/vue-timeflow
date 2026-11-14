---
name: jsp-finding-triage
description: JSP/JSTL/HTML 태그로 인한 정적 분석 오탐 후보를 정확히 분류하고 승인 장부에 기록할 때 사용한다.
---

# jsp-finding-triage

문서·명령 경로는 프로젝트 루트 기준이다. 기존 `AGENTS.md`와 `PROJECT_CONTEXT.md`를 함께 따른다.

현재 프로젝트에는 JSP 소스가 확인되지 않았다. 명시적인 JSP/JSTL 보고서나 해당 소스가 있을 때만 이 워크플로를 수행한다. Vue의 DOM XSS·접근성 검사에 JSP 예외를 적용하지 않는다.


1. `security/JSP_FALSE_POSITIVE_POLICY.md`를 먼저 읽는다.
2. 탐지 도구/규칙/파일/라인, 데이터 출처, 최종 출력 문맥(HTML/JS/속성/URL)을 확인한다.
3. JSTL, fmt, spring 태그 자체 경고만 오탐 **후보**로 분류하며 자동 제외하지 않는다.
4. 사용자 입력이 스크립트/이벤트/HTML에 도달하거나 escapeXml=false면 안전하다고 추정하지 않는다.
5. 승인된 환경에서 렌더링 결과를 검증하고 `security/templates/FALSE_POSITIVE_REGISTER.md`로 검토자·기한·근거를 기록한다.
6. 증빙 없이 경고 규칙 비활성화·목록 삭제 금지. 후보 CSV는 `scripts/triage_jsp_findings.py`, 승인 개별 분리는 `scripts/apply_approved_exclusions.py`를 사용한다. 원본 보존 필수.
