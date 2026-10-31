# 현재 API 명세 안내

작성일 2026-10-31. 수정일 2026-10-31. 현재 기준은 소스에서 생성한 **277개 operation·190개 schema**입니다. 과거 104개·117개·169개 목표 계약은 현재 수치가 아닙니다.

## 목차

- [기준 파일과 읽는 순서](#기준-파일과-읽는-순서)
- [공통 계약과 한계](#공통-계약과-한계)
- [변경과 검증](#변경과-검증)

## 기준 파일과 읽는 순서

1. [실제 API 작업 안내](frontend-backend-2026-10-10/README.md)에서 필드·권한·저장 정책을 읽습니다.
2. [전체 메서드·경로 목록](frontend-backend-2026-10-10/catalog.md)에서 작업할 경로를 찾습니다.
3. [상세 명세](frontend-backend-2026-10-10/specification.md)에서 요청·응답·입력·버전·권한을 확인합니다.
4. [OpenAPI JSON](frontend-backend-2026-10-10/openapi.json)·[operation JSON](frontend-backend-2026-10-10/operations.json)·실제 DTO/Service를 대조합니다.
5. [외부 미연결 경계](frontend-backend-2026-10-10/integrations.md)와 [테스트 범위](../quality/test-plan.md)를 확인합니다.

위 목록·필드·OpenAPI는 같은 소스의 생성 표현입니다. 별도 수동 API 표를 복제하지 않습니다. [체크리스트·담당자·플래너 상세 정책](task-planner-contract.md)과 [채팅 프로토콜](../chat/api/design.md)은 해당 모듈의 보충 설명입니다.

## 공통 계약과 한계

현재 일반 응답은 success·data·message이며 Bearer 토큰을 사용합니다. 생성/삭제의 성공 코드·SSE·파일·채팅은 operation별로 다릅니다. 성공은 무조건 200, 삭제는 무조건 204라고 통일하지 않습니다.

입력·인증·권한·숨겨진 타인 자원·동시 충돌은 400/401/403/404/409 등 실제 계약으로 구분합니다. 외부 제공자 미연결의 유효 실행은 503이며 그 전에 입력·권한 검사로 다른 오류가 날 수 있습니다.

서버 계약이 있다는 것과 모든 화면이 연결됐다는 것은 다릅니다. 현재 일부 목록·집계는 소규모 자료의 메모리 필터이며 내보내기는 전체 계정 백업이 아닙니다. API 정적 개수 검사는 모든 경로의 실제 HTTP·DB 성공을 뜻하지 않습니다.

## 변경과 검증

```powershell
node frontend/scripts/api-inventory.mjs --check
node frontend/scripts/frontend-api-contract.mjs --check
```

Controller·DTO·FeatureType을 수정하면 생성기를 실행하고 결과·호환·관련 테스트를 리뷰합니다. 신규 필드는 길이·형식·필수/조건·소유권·version·오류를 정의합니다. [요구·작업·릴리스](../releases/README.md)에 같은 변경을 연결합니다.

[과거 목표 API](../api-info/README.md)·이전 감사 기록은 날짜 있는 설계 이력입니다. 이를 최신 생성기에 덮어씌우지 않습니다.
