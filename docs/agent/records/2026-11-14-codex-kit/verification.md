# 적용 검증 기록

- 검증일. 2026-11-15, Asia/Seoul. 작업 폴더명은 시작일 2026-11-14를 유지한다.
- 환경. Windows PowerShell, Python 3.12.4. 현재 PATH의 Node는 20.18.0으로 프로젝트 요구 >=22.12.0보다 낮다.
- 범위. 새 개발 도구·문서·스킬의 구성과 보존·입력 검증 동작이다. 앱 기능 소스는 수정하지 않았다.

| 명령·검사 | 결과 |
| --- | --- |
| `python -X utf8 -B -m unittest discover -s scripts/tests -p test_agent_kit.py -v` | PASS. 11개 테스트, 종료 코드 0. |
| `python -X utf8 -B scripts/verify_agent_kit.py` | PASS. 스킬 11종·필수 파일·로컬 링크·Python 구문·고유 49/28/33 ID, 종료 코드 0. |
| `python -X utf8 -B scripts/docs/verify_documentation.py` | PASS. 기존 Markdown 56개·로컬 링크 637개·fragment 235개, errors 없음, 종료 코드 0. 외부 URL은 방문하지 않음. |
| skill-creator의 `python -X utf8 -B .../quick_validate.py .agents/skills/api-contract-review` | NOT_RUN. ModuleNotFoundError: No module named 'yaml'. 별도 검증기는 완료되지 않음. |
| 임시 폴더 대상 `python -m pip install ... PyYAML` | 환경 실패. No matching distribution found for PyYAML. 프로젝트·전역 의존성을 변경하지 않음. |
| 작업 시작 파일 SHA256 대조 | DESIGN.md 및 기존 앱 소스·로컬 설정 등 보존. 고객 피드백 기록 2개는 별도 작업에서 갱신·커밋됐으며 본 작업에서 변경하지 않음. |
| `.omd/system/manifest.json` 산출물 해시 대조 | REVIEW. graph·coverage·provenance 일치, DESIGN.md 불일치. 기존 계약 정합성 문제로 기록. |
| `git diff --check` | 기존 Modal.vue 51·53행 후행 공백을 보고. 본 작업 대상 밖이므로 그대로 보존. 자체 staged diff는 별도 확인. |
| `git diff --cached --check` | PASS. 자체 변경 53개만 포함한 staged diff, 종료 코드 0. 기존 앱·고객 피드백·로컬 설정 제외. |

## 동작 시험 범위

- 한글 작업명·서울 날짜·기록 4개 생성, 기존 기록과 사용자 메모 보존.
- 경로 이탈·부적합 작업명·템플릿 누락 거부.
- JSP 후보·위험 출력·Vue 파일 분리, 자동 제외 없음, 원본 CSV 보존.
- 빈 승인장부의 전체 유지, 정확한 승인 지문만 별도 보고서에 분리.
- 빈 증거·검토자, 만료·형식 오류·중복·현재 결과와 불일치한 승인 거부.
- 원본과 같은 출력·이미 존재하는 결과·잘못된 CSV 거부.
- 구조 검사의 누락 문서·중복 ID·깨진 링크 검출.

## 검증하지 않은 범위

애플리케이션 SAST·DAST·수동 접근성, 실제 DB·운영·외부 서비스·네이티브 실행은 NOT_RUN이다. 앱 코드를 변경하지 않아 Java·Vue 전체 빌드는 이번 검증에 포함하지 않았다. ZIP 참고표의 외부 원문·최신성·법적 적합성도 독립 검증하지 않았다. 현재 JSP 소스 미사용에 따른 JSP 전용 항목만 N/A이며 Vue 보안·접근성 전체가 면제되는 것은 아니다.
