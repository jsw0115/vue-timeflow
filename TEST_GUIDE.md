# 테스트·증빙 안내

원문은 [테스트 계획](docs/quality/test-plan.md)이다. 변경 범위에 맞는 최소 관련 검사를 먼저 실행한다. `frontend/package.json`에는 npm test 스크립트가 없다.

| 실행 위치 | 명령 | 검증 범위 |
| --- | --- | --- |
| 프로젝트 루트 | `python -B scripts/verify_agent_kit.py` | 지침·스킬·문서 링크와 49·28·33 구조. 앱 보안 감사 아님. |
| 프로젝트 루트 | `python -B -m unittest discover -s scripts/tests -p test_agent_kit.py -v` | 작업 생성·원본 보존·오탐 분리 보호 장치. |
| 프로젝트 루트 | `python scripts/docs/verify_documentation.py` | 기존 기준 문서의 연결·구조. |
| backend | `.\gradlew.bat test --console=plain` | JUnit·Spring 테스트. `--tests`로 관련 클래스 선택 가능. |
| frontend | `npm run check:preview` 또는 `npm run check:writing` | 해당 Node 테스트. |
| frontend | `npm run build:web` | Vite 웹 빌드. |

frontend의 전체 Node 테스트는 PowerShell에서 다음과 같이 실행한다.

```powershell
$testFiles = (Get-ChildItem tests/*.test.mjs).FullName
node --test --test-concurrency=1 $testFiles
```

보안·접근성은 관련 항목 ID와 `PASS / FAIL / REVIEW / NOT_RUN / N/A`를 [검증 양식](docs/agent/templates/verification.md)에 기록한다. 실제 명령·환경·종료 코드·증거와 미실행 사유를 남긴다. 스캐너 설치·실행, 브라우저·키보드·보조기술 시험은 문서 생성과 별개의 검증이다.
