---
name: timebar-diary-ops-docs
description: Timebar Diary의 오류 원인 점검, 연동 테스트 계획과 결과서, Linux 컨테이너·Pages 배포와 롤백 절차, 운영 Markdown 문서를 소스와 로그 근거로 작성하거나 갱신할 때 사용한다. 단순 기능 개발이나 다른 프로젝트의 일반 문서 작성에는 사용하지 않는다.
---

# Timebar Diary 운영 점검과 문서 작성

이 파일은 저장소 루트에 둔 스킬 정본이다. 아래 경로는 모두 저장소 루트 기준이며, 작업 위치가 다르면 `git rev-parse --show-toplevel`로 루트를 확인한다. `.agents/skills/`에 사본을 두는 경우 이 정본과 같은 내용으로 맞춘다.

## 입력과 결과

사용자가 준 증상·로그·변경사항·시험 범위·배포 대상에서 시작한다. 주어지지 않은 실제 서버값·도메인·계정은 추측하지 않는다. 확인할 수 있는 로컬 조사를 먼저 하고, 서버 접근 정보가 없으면 절차와 보고서만 작성하며 실제 시험은 NOT_RUN으로 남긴다.

작업에 따라 장애 분석서, 연동 테스트 계획·결과서, 배포·롤백 절차서, 운영 매뉴얼을 Markdown으로 작성한다. 기본 저장 위치는 `docs/agent/records/YYYY-MM-DD-작업명/`이며 `python scripts/start_task.py --task 작업명`으로 만든다. 사용자가 위치를 지정하면 그 위치를 쓴다. 기존 기준 문서(`docs/operations/runbook.md` 등)를 고치는 작업이면 원문을 직접 갱신하고, 작업 기록에는 변경 요약과 검증만 남긴다.

## 필요한 자료만 선택

| 요청 | 읽을 문서 |
|---|---|
| 프로젝트 사실·실행 명령 | `PROJECT_CONTEXT.md`, `BUILD_GUIDE.md`, `docs/development/environments.md` |
| 오류·로그·기동 실패 | `docs/operations/runbook.md`의 장애 대응, `.agents/skills/safe-debug/SKILL.md` |
| 자동 시험·연동 시험 | `TEST_GUIDE.md`, `docs/quality/test-plan.md`, `docs/api/frontend-backend-2026-10-10/integrations.md` |
| Linux 컨테이너 배포·SSL·롤백 | `docs/deployment/gitlab-cicd.md`, `docs/deployment/release-plan.md`, `infra/deploy/`, `scripts/deploy/release.sh`·`backup.sh` |
| 정적 웹 배포 | `docs/gitlab-pages-guide.md` |
| DB 준비·백업·복구 | `docs/database/environment.md`, `docs/database/current-database.md` |
| 보안 점검 결과 | `security/DEVELOPMENT_SECURITY_GATE.md`, `security/templates/SECURITY_TEST_REPORT.md` |
| 보고서 양식 | `docs/agent/templates/`(plan·checklist·context-notes·verification) |

## 공통 수행 방식

1. AGENTS.md와 PROJECT_CONTEXT.md, Git 변경 상태, 현재 구현과 설정을 확인한다. 사용자 변경을 보존한다.
2. 확인된 사실, 필요한 가정, 아직 확인하지 못한 사항을 구분한다. 파일명이나 설정 파일 존재만으로 실제 로딩·구현 완료를 단정하지 않는다.
3. 문서의 명령·설정 키·프로파일·API 경로는 소스와 대조한다(`backend/src/main/resources/application*.yml`, `infra/deploy/compose*.yml`, `docs/api/`). 검증을 실행하면 환경·명령·종료 코드·증빙 위치를 기록한다.
4. 템플릿의 예시 문장을 실제 결과로 옮기지 않는다. 결과는 `PASS / FAIL / REVIEW / NOT_RUN / N/A`로 적고, PASS는 실행 증빙이 있을 때만 쓴다. 모든 문서에 미실행 항목·제약·후속 조치를 남긴다.
5. 목적과 결론을 먼저 쓰고 근거를 연결한다. 한국어 문장은 마침표로 끝낸다(AGENTS.md 7절).

## 요청별 주의점

- 오류: 시각·요청·응답 상태·로그를 연결하고 최초 원인 예외와 재현 조건을 확인한다. 가설에는 확인 방법을 붙이고, 수정했다면 같은 조건으로 다시 시험한다. 로컬 시연 저장 화면의 데이터 불일치를 서버 장애로 단정하지 않는다.
- 자동 시험: 백엔드 테스트의 H2·mock 범위와 프런트 Node 테스트 범위를 확인한다. H2·모의 응답 결과를 MySQL·Redis·SSE의 실제 성공으로 기록하지 않는다.
- 연동: AI·음성·실결제·외부 캘린더는 제공자 미연결(503 경계)이다. 스텁·목업·버튼 노출을 실연동으로 기록하지 않는다. 실제 연동 시험은 상대 규격·계정·네트워크와 시험 데이터 정리 방법을 먼저 확인한다.
- 배포: GitLab Pages(정적 웹), Linux 컨테이너(`infra/deploy`, Nginx·Caddy, `--https`), Capacitor·Electron 포장을 구분한다. 구성 파일이 있다는 것을 배포·서명·실기기 검수 완료로 쓰지 않는다. `release.sh`는 파이프라인이 성공한 40자리 커밋 SHA를 받는다.
- 롤백: 앱 이미지·설정·DB·파일을 나눠 적는다. Flyway 마이그레이션 이후 이전 이미지로 돌아갈 수 있는 스키마인지 확인하고, `backup.sh` 백업이 있는지 확인한다. 승인되지 않은 DB 변경이나 운영 장애 주입은 하지 않는다.
- 보안: `security/SECURITY_POLICY.md`를 따른다. 실제 비밀값·JWT·`.env` 내용·내부 주소·개인 기록 원문을 외부 서비스나 작성 문서에 넣지 않고 마스킹한다.

## 완료 확인

- 작성한 문서와 실제 구현·현재 설정 사이의 불일치를 점검한다.
- 링크와 코드 블록, 예제의 변수·프로파일·경로·권한을 확인한다. 기준 문서를 고쳤다면 `python scripts/docs/verify_documentation.py`를 실행한다.
- `.agents/skills/`에 사본을 둔 경우 정본과 동기화하고 `python -B scripts/verify_agent_kit.py`로 메타데이터를 검증한다.
- 변경 파일, 실행한 검증, 미실행 항목과 남은 문제를 한국어로 전달한다. 요청 범위 밖의 서버 변경은 하지 않는다.
