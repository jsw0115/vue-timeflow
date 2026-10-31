# 문서 기준·중복 통합·갱신 규칙

작성일 2026-10-31. 수정일 2026-10-31. 문서 운영 기준선입니다. 같은 주제의 수정 가능한 원문을 한 곳에 두고, 요약·과거 기록·자동 생성 결과·배포본을 구분합니다.

## 목차

- [주제별 기준 문서](#주제별-기준-문서)
- [중복 통합과 과거 기록](#중복-통합과-과거-기록)
- [변경 때 갱신할 곳](#변경-때-갱신할-곳)
- [날짜·상태·검증 규칙](#날짜상태검증-규칙)

## 주제별 기준 문서

| ID·주제 | 기준 원문 | 담당 역할·변경 계기 |
| --- | --- | --- |
| DOC-PLAN 범위·RFP | [프로젝트 정의](../planning/project-definition.md) | 기획, 범위·인수 조건 변경 |
| DOC-REQ 요구·검수 | [요구사항](../planning/requirements.md) | 기획·개발, 기능·수용 기준 변경 |
| DOC-BIZ 사업 | [사업 계획](../planning/business-plan.md) | 제품·사업, 고객·수익·실험 변경 |
| DOC-WBS 작업 | [WBS](../planning/wbs.md) | 개발·기획, 일정·의존·추정 변경 |
| DOC-ARCH 구조·스택 | [시스템 구조](../architecture/system-architecture.md) | 개발·운영, 실제 구성·경계 변경 |
| DOC-MOD 모듈·연결 | [모듈 설계](../architecture/modules-and-interfaces.md) | 개발, 책임·입출력·트랜잭션 변경 |
| DOC-FUNC 현재 기능 | [기능 명세](../handbook/source/05-기능-명세서.md) | 제품·개발, 실제 동작·권한 변경 |
| DOC-SCREEN 화면·흐름 | [화면 명세](../product/screen-design.md) | 기획·디자인·개발, UI 행동·상태 변경 |
| DOC-ROUTE 화면 목록 | [생성 목록](../product/screen-catalog.md) | 개발, router 변경 후 생성기 |
| DOC-DB DB·ERD·전체 컬럼 | [현재 DB 정의](../database/current-database.md) | DB·개발, migration 후 메타데이터·생성기 |
| DOC-DBENV DB 환경 | [DB 환경·이력](../database/environment.md) | DB·운영, 접속·migration·보존 변경 |
| DOC-API API 목록·필드 | [API 기준](../api/README.md) | 개발, Controller·DTO·FeatureType 후 생성·검사 |
| DOC-GLOSS 용어·명명 | [용어 사전](../standards/glossary.md) | 개발·기획, 의미·단위·이름 추가 |
| DOC-CODE 코드·커밋 | [코딩 표준](../standards/coding-standards.md) | 개발, 검사·규칙 변경 |
| DOC-ENV 도구·서버 설치 | [환경 준비](../development/environments.md) | 개발·운영, 도구·호스트·설정 변경 |
| DOC-LOCAL 로컬 실행 | [로컬 가이드](../handbook/source/01-로컬-실행-가이드.md) | 개발, 실제 기동·오류 변경 |
| DOC-LINUX Linux 절차 | [Linux 배포](../deployment/gitlab-cicd.md) | 운영, 서버 설치·Registry·TLS·복구 변경 |
| DOC-PAGES 정적 배포 | [Pages 배포](../gitlab-pages-guide.md) | 운영·웹, CI·라우팅·API 주소 변경 |
| DOC-DEPLOY 배포 검수 | [배포 계획](../deployment/release-plan.md) | 운영·검수, 출시·중단·복구 기준 변경 |
| DOC-OPS 사용·운영 | [운영 매뉴얼](../operations/runbook.md) | 운영, 점검·장애·데이터 요청 변경 |
| DOC-TEST 품질·케이스 | [테스트 계획](../quality/test-plan.md) | 검수·개발, 요구·회귀·증거 변경 |
| DOC-RELEASE 버전·노트 | [릴리스 원장](../releases/README.md) | 개발·운영, 후보·검증·실제 배포 |
| DOC-BACKLOG 날짜별 수정 | [작업 원장](../releases/backlog.md) | 담당 역할, 접수·변경·완료 때마다 |
| DOC-TROUBLE 문제 해결 | [트러블슈팅](../development/troubleshooting.md) | 개발·운영, 원인·해결·회귀 확인 |
| DOC-PORT 포트폴리오 | [포트폴리오](../portfolio/README.md) | 작성자, 사실·기여·증거 변경 |
| DOC-AI AI 확장 | [AI 설계 묶음](../product/ai-growth-2026-10-31/README.md) | 제품·AI, 분야·유료화·아키텍처 결정 |

API의 카탈로그·상세 필드·OpenAPI는 같은 소스에서 생성하는 서로 다른 표현입니다. 현재 DB JSON과 생성 정의서, 화면 라우터와 생성 목록도 원본·기계 자료·읽기용 표현의 관계이며 별도 수동 원문을 만들지 않습니다.

## 중복 통합과 과거 기록

| 과거 경로 | 처리·대체 기준 |
| --- | --- |
| development/setup.md, development/local-platforms.md, cross-platform-guide.md | 중복 설치 본문 대신 로컬 실행·도구/서버 환경·화면 검수로 안내 |
| database/table-design.md, database/schema-alignment.md | 현재 DB 정의·이력 안내로 통합. 한글 손상·과거 미구현 설명 제거 |
| product/feature-design.md, product-spec-v2.md | 현재 기능·요구·프로젝트·AI 설계로 연결. 과거 기술 추천을 현재 구현처럼 유지하지 않음 |
| api/api-specification.md | 과거 117개·stub 본문 대신 최신 소스 계약으로 안내 |
| deployment/production.md | 중복 배포 본문 대신 환경 설치·Linux/Pages·배포 검수·운영으로 안내 |
| design/, api-info/의 날짜 있는 설계 | 2026-09~10 당시 목표·정적 분석 기록. 현재 기준은 아님 |
| database/timeflow-database-design.md·목표 SQL·검증 | 40개 목표 설계의 독립 제안·검증 기록. 현재 설치에 적용 금지 |
| development/*날짜*/, chat/verification/, quality/review-* | 당시 실행 증거. 새 문서가 과거 결과를 덮어쓰지 않음 |
| handbook/*.docx | Markdown source의 2026-10-31 배포본. 현재 프로젝트 전체 문서의 별도 원문 아님 |

과거 고유 설계·실행 증거는 날짜·상태를 유지해 보존합니다. 현재 기준을 자처하는 중복 안내만 짧은 연결 문서로 바꿉니다. 이전 본문은 Git 이력에서 확인할 수 있습니다. 독립적인 과거 목표를 새 기준에 맞춘 것처럼 재작성하지 않습니다.

## 변경 때 갱신할 곳

| 변경 | 함께 갱신·확인할 자료 |
| --- | --- |
| 기능 추가·수정 | 요구·현재 기능·화면·WBS·작업 원장·테스트·목표 릴리스 |
| API | Controller/DTO/FeatureType·생성 계약·호환·호출 화면·테스트 |
| DB | 새 migration·기존 데이터/롤백·현재 메타데이터·ERD·용어·API·배포 |
| 라우트 | router·생성 목록·화면 상태/흐름·권한·링크·검수 |
| 환경·배포 | 실제 config·가이드·.env.example·비밀값 위치·복구·릴리스 |
| 장애·버그 | 원장 접수일·증거·수정 SHA·회귀·완료일·배포일·트러블슈팅 |
| AI·결제 | 동의·자료 권리·근거·평가·비용·원장·서버 capability·정책 |

수정 때 기존 작성일은 유지하고 수정일을 한국 시간 기준 실제 날짜로 바꿉니다. 미래 일정은 예정일로만 적고 실제 완료일을 미리 채우지 않습니다. 수정 요청·변경 이유·기준 버전은 원장에 남깁니다.

## 날짜·상태·검증 규칙

수동 기준 문서는 제목·작성일·수정일·현재/제안/기록 상태·목차·관련 근거를 포함합니다. 자동 문서는 생성기와 --check를 함께 관리합니다. 과거 원문의 날짜를 최신처럼 바꾸어 구현 상태를 갱신한 척하지 않습니다.

검증 기록은 실행 명령·런타임·대상·결과·한계를 적습니다. Word 원문을 바꾸면 배포본을 재생성하고 필드·페이지를 검수한 뒤 배포합니다. 이번 작업은 기존 Word 원문을 수정하지 않고 확장 Markdown을 기준으로 제공합니다.

문서 검증은 `python scripts/docs/verify_documentation.py`, API·DB·화면 생성 검사는 [테스트 계획](../quality/test-plan.md#실행-명령)을 따릅니다. 정적 검사 통과는 실제 운영·외부 서비스·네이티브 기기 검증이 아닙니다.
