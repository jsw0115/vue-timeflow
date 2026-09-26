# 9-API · API 목록 및 상세 설계

기준: 2026-09-26 소스 스냅샷. **이 폴더의 `/api/v1`은 구현 완료 명세가 아닌 목표 계약입니다.** 실제 `/api` 계약은 별도 분리했습니다. 문서 작성으로 서버 기능이나 DB가 변경되지 않습니다.

## 읽는 순서

1. [공통 규약](00-conventions.md): 인증·헤더·쿠키·시간·페이지·동시 수정·멱등성.
2. [전체 API 목록](catalog.md): 169개 목표 API, 도메인별 상세 링크.
3. 필요한 영역의 상세 명세: 아래 9개 파일.
4. [공통 오류 및 해결 방법](errors.md).
5. [현재 소스 계약](current-contract.md): 실제 컨트롤러 89개, DTO, 오류 처리 및 구현 한계.

| 영역 | 상세 설계 |
| --- | --- |
| 01 | [인증·회원·온보딩·세션](01-auth-users.md) |
| 02 | [통합 플래너·일정·할 일](02-planner-events-tasks.md) |
| 03 | [루틴·실제 시간·집중 세션](03-routines-time.md) |
| 04 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md) |
| 05 | [WBS·연차·반차·외근·출장·경력](05-work-career.md) |
| 06 | [커뮤니티·챌린지·피드](06-community-challenges.md) |
| 07 | [채팅·캘린더 공유·초대](07-chat-sharing.md) |
| 08 | [홈·알림·통계·랭킹](08-home-statistics.md) |
| 09 | [설정·외부 연동·파일·운영](09-settings-integrations-admin.md) |

각 엔드포인트에 URL, HTTP 메서드, 인증/헤더, 경로·쿼리·본문 필드의 타입/필수 여부/제약, 요청 예시, 성공 상태·응답 구조·예시, 발생 가능한 오류와 조치를 제공합니다. 공통 오류의 상세 원인/해결은 오류 문서로 연결됩니다. 기존 114개 설계 경로를 유지하고 55개를 추가했으며, 필드 계약 변경은 공통 규약의 이행 정책을 따릅니다.

## 기계 판독 및 검증

- [OpenAPI 3.1.1 목표 계약](openapi.target.json): Swagger Editor 등에서 확인할 수 있는 JSON. 모든 operation은 `PLANNED` 상태입니다.
- [현재 컨트롤러 추출 결과](current-operations.json): 소스 정적 분석 결과이며 서버 호출 결과가 아닙니다.
- [시스템·DB·인터페이스 설계](../design/README.md).
- [검증 범위 및 남은 위험](../design/06-validation.md).

프로젝트 루트에서 실행합니다. Node.js가 필요하며 DB/애플리케이션은 기동하지 않습니다.

```powershell
node frontend/scripts/design-docs/build.mjs .
node frontend/scripts/design-docs/build.mjs . --check
node frontend/scripts/design-docs/check.mjs .
```

`build`는 이 폴더의 자동 생성 상세 명세와 현재 DB 분석 문서를 갱신합니다. 계약을 수정할 때는 `frontend/scripts/design-docs/model.mjs`, `endpoints.mjs`를 먼저 수정하세요. README·공통 규약·시스템/목표 DB/외부 연동/검증 문서는 수동 관리합니다. 전체 OpenAPI 공식 적합성 검사, 실제 HTTP 통합 테스트 및 DB migration 테스트를 대신하지 않습니다.
