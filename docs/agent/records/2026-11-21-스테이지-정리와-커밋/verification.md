# 검증 기록

실행 환경: Windows 11 로컬, Node v20.18.0(프로젝트 요구 >=22.12보다 낮음), npm 11.7.0, Python 3.12.4. 백엔드·DB는 띄우지 않았다(백엔드 소스 변경 커밋 없음).

| 검증 | 명령 | 종료 코드 | 결과 | 판정 |
| --- | --- | ---: | --- | --- |
| 프런트 테스트 | `cd frontend; node --test --test-concurrency=1 <tests/*.test.mjs 중 device-preview 제외>` | 0 | 230개 통과, 실패 0 | PASS |
| 프로덕션 빌드 | `cd frontend; npm run build:web` | 0 | 빌드 성공. 500kB 초과 청크 경고는 기존과 같음 | PASS |
| 에이전트 키트 구조 | `python -B scripts/verify_agent_kit.py` | 0 | PASS | PASS |
| 문서 구조 | `python scripts/docs/verify_documentation.py` | 1 | 지적 3건(`docs/api-info/README.md` 깨진 링크, 루트 README 작성일·목차). 이번에 고친 파일과 무관하며 이 도구의 검사 범위(68개 파일)에 dev-docs가 없다 | REVIEW |
| 변경 문서 링크·앵커 | 04·11·dev-docs README·개편안·검토보고서의 로컬 링크와 같은 문서 앵커를 스크립트로 확인 | 0 | 문제 0건 | PASS |
| 문서 내용 대조 | 04·11의 메뉴 묶음·경로·이름을 `router/index.js` `navGroups`와, 목표·활동 유형·지원 단계 이름을 `careerModel.mjs`와 대조 | — | 일치 | PASS |
| device-preview 테스트 | — | — | Vite 개발 서버를 띄우는 테스트라 이번 범위에서 실행하지 않음 | NOT_RUN |
| Modal 화면 확인 | — | — | 브라우저로 색 선택 크기·툴바 간격을 보지 못함 | NOT_RUN |

- 보안: 코드 동작 변경 없음(CSS). 커밋 문서에서 개인 경로·이메일·비밀값 검색 결과 없음(공개 GitHub 저장소 링크 1건).
- 웹 접근성: 색 선택 입력 높이 44px(`--input-height`)로 DESIGN.md 입력 높이·터치 기준에 맞춤. 실제 렌더링 확인은 NOT_RUN.
- 오탐 제외: 없음.
- 남은 위험: Node 버전이 요구보다 낮은 환경에서 확인했다. Modal 변경은 화면 확인 전이다.
