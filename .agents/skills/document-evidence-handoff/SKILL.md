---
name: document-evidence-handoff
description: 오류 보고서·시험 결과서·개발 문서·인수인계 기록을 실제 코드와 검증 증거를 기반으로 작성할 때 사용한다.
---

# document-evidence-handoff

문서·명령 경로는 프로젝트 루트 기준이다. 기존 `AGENTS.md`와 `PROJECT_CONTEXT.md`를 함께 따른다.

진행 중인 기록 폴더를 우선 사용한다. 새 작업만 `python scripts/start_task.py --task 작업명`으로 만든다. 중단 시 완료 체크, 마지막 명령·결과, 미해결 원인, 다음 명령을 기록한다. 토큰 충전 감지·자동 재개가 설정됐다고 주장하지 않는다.


1. 실제 파일/설정/실행 기록을 확인하고 관련 문서만 읽는다.
2. `security/templates/SECURITY_TEST_REPORT.md`, `docs/agent/templates/` 중 필요한 양식을 고른다.
3. 샘플 문장을 실제 결과로 바꾸지 않고 미실행/가정/확정 근거를 구분한다.
4. 날짜별 작업 폴더에 요약·변경 파일·검증·미해결을 기록한다. 민감정보는 마스킹.
