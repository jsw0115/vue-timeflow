# Timebar Diary 전체 문서

작성일 2026-10-31. 수정일 2026-10-31. 한국어 Markdown을 기준 원문으로 관리합니다. 현재 구현·향후 제안·과거 증거·생성 산출물을 구분합니다.

## 목차

- [역할별 읽는 순서](#역할별-읽는-순서)
- [기획·개발·운영 기준 문서](#기획개발운영-기준-문서)
- [날짜·버전·품질 관리](#날짜버전품질-관리)
- [과거 기록과 배포본](#과거-기록과-배포본)

## 역할별 읽는 순서

신규 개발자는 도구/환경 → 로컬 실행 → 구조 → 기능/화면 → DB/API → 코드 규칙 → 테스트를 읽습니다. 기획자는 범위/RFP → 요구 → 사업 → 화면/흐름 → WBS → 릴리스, 운영자는 환경/서버 설치 → DB → Linux/Pages → 배포 검수 → 운영 순서로 읽습니다.

## 기획·개발·운영 기준 문서

| 주제 | 기준 문서 |
| --- | --- |
| 개발 범위·프로젝트 정의·RFP | [프로젝트 정의](planning/project-definition.md) |
| 요구사항·요청 명세·수용 기준 | [요구사항과 추적](planning/requirements.md) |
| 사업·고객·수익·원가·실험 | [사업 계획](planning/business-plan.md) |
| 작업·일정·의존·역할·검수 | [WBS](planning/wbs.md) |
| 시스템 구성도·기술 스택 | [시스템 아키텍처](architecture/system-architecture.md) |
| 모듈·인터페이스·트랜잭션 | [모듈 설계](architecture/modules-and-interfaces.md) |
| 기능별 현재 동작·권한·한계 | [기능 명세](handbook/source/05-기능-명세서.md) |
| 화면·와이어프레임·UI/UX 흐름 | [화면 명세](product/screen-design.md) · [실제 경로 목록](product/screen-catalog.md) |
| ERD·전체 테이블·컬럼·키·인덱스 | [현재 DB 정의](database/current-database.md) |
| DB·Redis·마이그레이션·보존 | [DB 환경](database/environment.md) |
| API 목록·상세 계약·OpenAPI | [API 시작점](api/README.md) |
| 용어·테이블·컬럼·변수 명명 | [용어 사전](standards/glossary.md) |
| 코딩·리뷰·품질·커밋 규칙 | [코딩 표준](standards/coding-standards.md) |
| 필수 도구·서버·환경변수·호스트 설치 | [환경 준비](development/environments.md) |
| 로컬 웹·DB·API·앱 실행 | [로컬 실행 가이드](handbook/source/01-로컬-실행-가이드.md) |
| 파일·폴더·변경 시작점 | [프로젝트 구조](handbook/source/03-프로젝트-구조.md) |
| 개발/운영 Linux·이미지·HTTPS·복구 | [Linux 설치·배포](deployment/gitlab-cicd.md) |
| 정적 웹 게시 | [GitLab Pages](gitlab-pages-guide.md) |
| 출시 검수·중단·배포 기록 | [배포 계획](deployment/release-plan.md) |
| 사용자·운영·장애·데이터 요청 | [운영 매뉴얼](operations/runbook.md) |
| AI 시장·사용자·유료화·AI 서버 제안 | [AI 설계 묶음](product/ai-growth-2026-10-31/README.md) |
| 포트폴리오·기능·기술·증거·저장소 | [포트폴리오](portfolio/README.md) |

## 날짜·버전·품질 관리

- [버전별 변경·릴리스 노트](releases/README.md).
- [날짜별 개선·버그·문서 체크리스트](releases/backlog.md).
- [테스트 계획·케이스·실행 명령](quality/test-plan.md).
- [트러블슈팅·문제 해결](development/troubleshooting.md).
- [문서 기준·중복 통합·갱신 규칙](project/document-register.md).
- [이번 통합 작업 검증](development/documentation-system-2026-10-31/verification.md).

개발 중 추가·수정은 원장 등록 → 요구·영향·목표 버전 결정 → 해당 기준 문서와 WBS 갱신 → 구현·실행 검증 → 완료일·배포일 기록으로 관리합니다. 날짜가 지난 계획을 자동 완료하지 않습니다.

## 과거 기록과 배포본

[2026-10-31 실제 실행 검증](development/documentation-2026-10-31/verification.md), [2026-10-10 API 작업](api/frontend-backend-2026-10-10/README.md), [채팅 구현·검증](chat/README.md)은 해당 날짜·모듈의 증거입니다.

[2026-09 설계 묶음](design/README.md)과 [목표 API 기록](api-info/README.md), [40개 목표 DB 설계](database/timeflow-database-design.md)는 현재 구현의 대체 기준이 아닙니다. 과거 목표를 현재 DB에 실행하지 않습니다.

[Word 안내서 6개](handbook/README.md)는 날짜·목차 필드를 갱신할 수 있는 배포본입니다. 이번 확장 문서는 Mermaid·텍스트 와이어프레임으로 유지보수하므로 추가 이미지 문서·Word 원문을 복제하지 않았습니다.
