# Timebar Diary 에이전트 작업 기록

별도 채팅·세션에서도 이어받기 가능한 사실과 증빙을 기록한다. 기존 `docs/development/`·`docs/product/`의 작업 폴더는 이전하지 않고 해당 작업에서 계속 사용한다. 새 작업은 이 경로를 사용할 수 있다. 비밀값·로그 원본은 저장하지 않는다.

- `records/YYYY-MM-DD-작업명/plan.md`: 목표·범위·성공 기준.
- `records/YYYY-MM-DD-작업명/checklist.md`: 작업과 실제 완료 상태.
- `records/YYYY-MM-DD-작업명/context-notes.md`: 결정·대안·근거·미해결.
- `records/YYYY-MM-DD-작업명/verification.md`: 환경/명령/종료 코드/실제 검증 및 보안·접근성 항목.
- `templates/` 파일은 **작성 양식**이다. 모든 PASS는 실행 증빙이 있어야 한다.

프로젝트 루트에서 `python scripts/start_task.py --task 작업식별자`를 실행한다. 날짜는 Asia/Seoul의 UTC+09:00 기준이며 스크립트는 기존 폴더를 덮어쓰지 않는다. 계획·맥락·체크리스트를 실제 요청으로 채운 후 구현한다.

## 압축파일 적용 내역

원본은 `Codex_바이브코딩_전용.zip`이며 SHA256은 `c669c11638a21ea8c306bf3856001f37b33d8010123cdc45ac67d953d7db4bc9`다. 파일 내용은 사용자 제공 참고 자료로 검토했다.

| 원본 구성 | 적용 결정 |
| --- | --- |
| AGENTS.md | 기존 파일 1~13절을 보존하고 프로젝트 안내만 14절로 추가. 기존 커밋 규칙 우선. |
| PROJECT_CONTEXT 및 8개 공통 가이드 | 실제 Vue·Spring·Gradle·Flyway와 기존 docs 원문에 맞춘 진입점으로 작성. |
| README_적용가이드·PROMPT_LIBRARY | 프로젝트용 사용·재개 예문으로 교체. 예문은 즉시 실행 지시가 아님. |
| .agents/skills 11종 | 프로젝트 경로·명령·디자인 우선순위·재개 기록 반영. JSP는 조건부 사용. |
| security 14개 파일 | 참고표와 보고 양식 도입. 원문 독립 검증·앱 보안 인증과 구분. |
| scripts 4종 | 기본 기능 도입, 작업 날짜·입력·출력 보존·구조 검증 보완 및 회귀 테스트 추가. |
| docs/agent 6개 파일 | 기존 기록과 공존하고 커밋 승인 문구를 프로젝트 규칙에 맞춤. |
| .gitignore.agent-recommended | 필요한 비밀값·원본 보고서 패턴만 기존 .gitignore에 병합. |
| .codex/config.toml.example | 설치하지 않음. 세션 권한·모델·네트워크 설정을 변경하지 않음. |
| design-system 2개 파일 | 설치하지 않음. 기존 DESIGN.md·.omd 계약과 중복 권위를 만들지 않음. |
| DIRECTORY_STRUCTURE·FILE_INDEX | 원본 키트 전용 목록이므로 설치하지 않음. 실제 프로젝트는 기존 구조 문서와 이 표를 사용. |

## 중단·재개

작업 종료나 중단 전에 체크리스트, 마지막 실행 명령·결과, 미해결 원인, 다음 작업을 갱신한다. [이번 적용 기록](records/2026-11-14-codex-kit/context-notes.md)에 현재 상태가 있다. 토큰 충전 감지·자동 재개 예약은 설정하지 않았다.
