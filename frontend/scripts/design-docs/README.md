# 설계 문서 생성 및 검사

이 디렉터리는 과거 목표 설계 및 정적 추출 도구입니다. 최신 구현 계약의 검사는 프로젝트 루트에서 다음 명령을 사용합니다. 외부 npm 패키지는 추가로 필요하지 않습니다.

```powershell
node frontend/scripts/api-inventory.mjs --check
node frontend/scripts/frontend-api-contract.mjs --check
```

과거 목표 설계를 재생성할 때만 아래 명령을 사용하세요. 재생성하면 당시 스냅샷이 덮어써지므로 문서 기준일과 변경 범위를 먼저 검토합니다. 이 생성 결과를 현재 API의 전체 기능 명세로 사용하지 않습니다.

```powershell
node frontend/scripts/design-docs/build.mjs .
node frontend/scripts/design-docs/build.mjs . --check
node frontend/scripts/design-docs/check.mjs .
node frontend/scripts/design-docs/build.mjs . --current-only
node frontend/scripts/audit-api-docs.mjs --check
```

- `model.mjs`: 목표 요청·응답 스키마, 제약과 합성 예시.
- `endpoints.mjs`: 목표 경로·HTTP 메서드·권한·헤더·파라미터·업무 규칙.
- `build.mjs`: 상세 Markdown, OpenAPI JSON, 소스 근거 생성. 쓰기 대상은 프로젝트 `docs/`로 제한합니다.
- `current.mjs`: 현재 Java 컨트롤러/record의 정적 추출. Java 전체 구문 분석기는 아닙니다. 컨트롤러 문법 변경 시 결과를 검토하세요.
- `database.mjs`: 현재 V1 CREATE 목록·속성·FK·JPA 매핑 추출. SQL을 실행하지 않습니다.
- `check.mjs`: 예시/참조/경로/기존 API 포함/링크 정적 검사. 완전한 OpenAPI validator나 서버 통합 테스트가 아닙니다.

이전 설계 시점의 104개 API 및 stub 52개 같은 수치는 현재 구현 상태가 아닙니다. 최신 구현 문서는 `docs/api/frontend-backend-2026-10-10/`이며 277개 HTTP 매핑과 190개 OpenAPI schema를 대조합니다. 기존 V1 DDL과 채팅의 별도 테이블도 구분해 검토하세요.

README·공통 규약·시스템 구성도·목표 DB·외부 인터페이스·검증 기록은 수동 관리 문서입니다. 자동 생성 파일의 직접 수정은 재생성 시 덮어써집니다. `build --check`는 기록하지 않고 생성 결과와 비교합니다. API 목록은 `docs/api-info/README.md`, 설계 안내는 `docs/design/README.md`에서 확인하세요.
