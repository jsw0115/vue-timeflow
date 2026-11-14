# Timebar Diary Codex 개발 키트

2026-11-14에 제공된 `Codex_바이브코딩_전용.zip`을 프로젝트에 맞춰 병합했다. 앱 기능 변경이 아닌 개발 지침·스킬·작업 기록·검증 도구 적용이다.

## 시작

1. [AGENTS.md](AGENTS.md)와 [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)를 읽는다.
2. 실제 소스와 Git 상태를 확인하고 관련 스킬만 선택한다.
3. 새 비단순 작업은 `python scripts/start_task.py --task 작업명`으로 기록 양식을 만든다. 이미 진행 중이면 기존 폴더를 이어 쓴다.
4. 관련 테스트 후 실제 결과와 다음 작업을 기록하고 자체 변경만 의미 단위로 커밋한다.

프로젝트 루트에서 `python -B scripts/verify_agent_kit.py`로 설치 구조를 검사한다. 스킬 자동 목록에 없으면 아래 경로의 SKILL.md를 직접 읽도록 요청할 수 있다.

## 스킬 선택

| 작업 | 스킬 |
| --- | --- |
| 기능 구현·수정 | [feature-with-security](.agents/skills/feature-with-security/SKILL.md) |
| UI 구현 | [ui-with-accessibility](.agents/skills/ui-with-accessibility/SKILL.md) |
| 원인 분석 | [safe-debug](.agents/skills/safe-debug/SKILL.md) |
| API 계약 | [api-contract-review](.agents/skills/api-contract-review/SKILL.md) |
| DB 변경 | [database-change-review](.agents/skills/database-change-review/SKILL.md) |
| 소스 보안 검토 | [secure-code-review](.agents/skills/secure-code-review/SKILL.md) |
| 웹 위험 검토 | [web-vulnerability-review](.agents/skills/web-vulnerability-review/SKILL.md) |
| 접근성 검토 | [web-accessibility-review](.agents/skills/web-accessibility-review/SKILL.md) |
| 릴리스 검토 | [release-security-gate](.agents/skills/release-security-gate/SKILL.md) |
| 증거·인수인계 | [document-evidence-handoff](.agents/skills/document-evidence-handoff/SKILL.md) |
| JSP 보고서가 주어진 경우 | [jsp-finding-triage](.agents/skills/jsp-finding-triage/SKILL.md). 현재 Vue 소스는 N/A. |

[요청 예문](PROMPT_LIBRARY.md), [보안 문서](security/README.md), [기록·적용 내역](docs/agent/README.md)을 참고한다.

## 적용 결정과 알려진 한계

- 기존 AGENTS와 `docs/` 원문을 보존했다. ZIP의 커밋 사전 승인 문구는 기존 의미 단위 커밋 규칙과 충돌해 채택하지 않았다.
- 새 디자인 마스터·페이지 템플릿은 설치하지 않았다. DESIGN.md와 .omd의 기존 권위 규칙을 유지한다.
- Codex 권한·모델·네트워크 설정 예시는 활성화하지 않았다. 이번 적용으로 세션 권한이나 자동화가 추가되지는 않는다.
- DESIGN.md에는 다른 프로젝트의 Master가, 루트 SECURITY.md에는 Artibot 신고·버전 정보가 섞여 있다. 이를 Timebar Diary의 확정 사실로 인용하지 않는다. 해당 기존 문서는 별도 정리 대상이다.
- 토큰 충전 감지·자동 재개는 설정되지 않았다. 중단되면 [이번 기록](docs/agent/records/2026-11-14-codex-kit/context-notes.md)을 읽고 미완료 항목부터 재개한다.
- 보안·접근성 목록은 제공 자료의 개발 참고표다. 실제 앱의 SAST·DAST·수동 접근성 합격이나 최신 공식 표준 인증을 뜻하지 않는다.
