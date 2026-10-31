# Timebar Diary

계획과 실제 기록을 같은 시간축에서 비교하고 일정·할 일·루틴·개인 기록·업무·경력을 연결하는 Vue·Spring 프로젝트입니다.

작성일 2026-10-31. 수정일 2026-10-31. 현재 웹·API 선언 버전은 **0.1.0**입니다. Git 릴리스 태그·실제 운영 배포·매출은 확인된 상태가 아닙니다.

## 목차

- [처음 읽는 순서](#처음-읽는-순서)
- [빠른 실행](#빠른-실행)
- [현재 구현과 다음 범위](#현재-구현과-다음-범위)
- [기술·구조·명세](#기술구조명세)
- [품질·변경·기여](#품질변경기여)
- [저장소와 포트폴리오](#저장소와-포트폴리오)

## 처음 읽는 순서

[전체 문서 목차](docs/README.md)에서 역할별 경로를 선택합니다. 신규 개발자는 [도구·서버 준비](docs/development/environments.md) → [로컬 실행](docs/handbook/source/01-로컬-실행-가이드.md) → [프로젝트 구조](docs/handbook/source/03-프로젝트-구조.md) → [API](docs/api/README.md)를 읽습니다.

기획자는 [범위·RFP](docs/planning/project-definition.md)·[요구](docs/planning/requirements.md)·[사업](docs/planning/business-plan.md)·[WBS](docs/planning/wbs.md), 운영자는 [배포 검수](docs/deployment/release-plan.md)·[운영 매뉴얼](docs/operations/runbook.md)로 시작합니다.

## 빠른 실행

Node >=22.12·npm >=10·JDK 17과 Docker의 Linux 엔진·Compose를 준비합니다. 아래는 프로젝트 루트에서 시작하는 서로 다른 PowerShell 터미널입니다. 기존 DB 대신 격리 개발 DB를 사용합니다.

```powershell
# 터미널 1. 프로젝트 루트에서 실행합니다.
docker compose -f infra/chat/compose.yml up -d --wait

# 터미널 2. 새 터미널에서 실행합니다.
cd backend
.\gradlew.bat bootRun --args="--spring.profiles.active=chat-local"

# 터미널 3. 새 터미널에서 실행합니다.
cd frontend
npm ci
npm run dev
```

웹은 http://127.0.0.1:5173/, 내부 API 상태는 http://127.0.0.1:8080/actuator/health입니다. 상세 가이드에서 포트·설정 우선순위·테스트 계정·종료·기존 DB·모바일 경로를 확인합니다. 웹만 보려면 터미널 3만 실행할 수 있지만 실제 인증·채팅이 연결된 것은 아닙니다.

## 현재 구현과 다음 범위

인증·개인 기록·업무·공유·커뮤니티·관리 API와 채팅 MySQL·Redis·SSE 경로가 구현되어 있습니다. 다수 화면은 로컬 시연 저장을 사용하므로 각 화면의 API 연결은 별도 작업입니다. AI·음성·실결제·외부 캘린더 등의 제공자 실행은 미연결이며 유효한 실행 요청에 503 경계를 반환합니다.

향후 계획은 계정별 화면 저장 완성 → 근거 있는 분야 분석·작성 제안·사용자 승인 실행 → 이용권·원장·결제 검증입니다. [AI 제품 설계](docs/product/ai-growth-2026-10-31/README.md)는 구현 완료와 구분한 제안입니다. [날짜별 개선·버그](docs/releases/backlog.md)와 [릴리스 노트](docs/releases/README.md)에서 버전·날짜를 관리합니다.

## 기술·구조·명세

Vue 3·Vue Router·Vite, Java 17·Spring Boot 3.5.16·JPA/Querydsl/JDBC, MySQL 8.4·Flyway, Redis 7.4·REST/SSE, Docker Compose·Nginx·Caddy·GitLab CI를 사용합니다. Capacitor·Electron 포장 구성이 있으며 네이티브 설치·서명·실기기 검수는 별도입니다.

- [시스템 구성도·기술 스택](docs/architecture/system-architecture.md).
- [모듈·인터페이스](docs/architecture/modules-and-interfaces.md).
- [현재 ERD·전체 테이블 정의](docs/database/current-database.md).
- [API 목록·필드·OpenAPI](docs/api/README.md).
- [화면 명세·와이어프레임·흐름](docs/product/screen-design.md).
- [기능 명세](docs/handbook/source/05-기능-명세서.md)와 [요구사항 추적](docs/planning/requirements.md).

## 품질·변경·기여

[코딩·커밋 규칙](docs/standards/coding-standards.md), [용어·명명 사전](docs/standards/glossary.md), [테스트 케이스·명령](docs/quality/test-plan.md)을 기준으로 검증합니다. 커밋은 `type(scope): 한국어 요약`의 논리 단위로 작성하고 기존 사용자 변경·비밀값을 포함하지 않습니다.

[2026-10-31 실행 증거](docs/development/documentation-2026-10-31/verification.md)는 Java 178개·웹 47개 테스트, 빌드·실제 HTTP/브라우저·빈 DB 검증의 당시 범위를 담습니다. [이번 문서 검증](docs/development/documentation-system-2026-10-31/verification.md)은 DB·라우터·API·문서 소스 대조입니다. 모든 API·운영·네이티브를 검증했다는 뜻이 아닙니다.

변경은 요구·WBS·작업 원장·명세·회귀·릴리스에 함께 반영합니다. 문제 해결 근거는 [트러블슈팅](docs/development/troubleshooting.md)에 남깁니다. 라이선스와 의존성 이용 조건은 실제 파일·계약을 확인하고 임의 오픈소스 라이선스를 부여하지 않습니다.

## 저장소와 포트폴리오

[GitHub](https://github.com/jsw0115/vue-timeflow) · [GitLab](https://gitlab.com/githubgroup4094208/vue-timeflow) · [포트폴리오](docs/portfolio/README.md).

주소는 Git remote 기준입니다. 공개 접근·Pages 주소·실제 배포 성공은 별도 확인 대상입니다. [Word 안내서](docs/handbook/README.md)는 Markdown 원문의 날짜 있는 배포본이며 현재 전체 문서의 별도 원문이 아닙니다.
