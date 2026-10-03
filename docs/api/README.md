# API 문서 읽는 순서

2026-10-03: [전체 117개 현행 목록·구현 상태](current-api-inventory.md) · [이번 구현 10개 계약](task-planner-contract.md) · [누락·상태 대조 결과](api-audit-2026-10-03.md) · [채팅 18개](../chat/api/catalog.md) · [Redis 연동](../chat/redis/api-catalog.md).

| 현행 상태 | 개수 | 판정 근거 |
|---|---|---|
| 이번 구현 완료 | 10 | 체크리스트 5개, 담당자 후보 3개, 플래너 설정 2개. 소스·단위·MockMvc HTTP 계약 검증 |
| 기존 구현 · 서비스 연결 | 50 | 기존 Service 경로 확인. 모든 기존 API를 이번에 재검증했다는 의미는 아님 |
| 미구현 · stub | 52 | 실제 조회·저장 로직 없음 |
| 시연 · 메모리 | 5 | 영속화·사용자 격리가 없는 공용 메모리 데이터 |

구현 완료 표시는 지정 테스트 범위입니다. 이후 실제 MySQL·Redis 검증과 로컬 DB 반영까지 수행했으며 [복구 기록](../development/database-recovery-2026-10-03.md)에 범위를 명시합니다. 프런트엔드 서버 연동은 별도입니다. 이번 신규 API의 [사전 설계·네이밍·잠금 정책](implementation-plan-2026-10-03.md)을 먼저 작성한 뒤 Java 소스를 구현했습니다. DB 오류 수정 단계에서 안전한 migration을 실제 로컬 DB에 적용하고 기존 회원·로그를 보존했습니다.

> 2026-09-26 상세 설계는 [9-API 문서 모음](../api-info/README.md)을 우선 확인하세요. 기존 목록의114개 경로를 포함한169개 목표 계약, 필드별 파라미터/요청/응답/오류, OpenAPI JSON을 제공합니다. 현행 서버 계약도 별도로 구분합니다. 아래 문서는 기존 설계 배경 자료입니다.

1. [API 목록서](api-catalog.md): MVP와 추가 기능의 목표 경로·메서드·권한·우선순위.
2. [API 설계서](api-design.md): 필터·DTO·응답·권한·시간·충돌·동기화·DB 전략.
3. [현재 API 목록](current-api-inventory.md): 소스에서 생성한 전체 endpoint별 구현 상태.
4. [현재 API 명세](api-specification.md): 현재 DTO와 목표 계약의 차이.
5. [추가 기능 설계](../product/api-enhancements.md).
6. [플랫폼 화면 설계](../product/platform-preview-design.md) / [로컬 실행](../development/local-platforms.md).
7. [3단계 검증 기록](../quality/review-2026-09-25.md).

목표 /api/v1 169개는 각 행에 `설계 · 미구현` 상태를 명시합니다. 현행 /api 117개와 합산하지 않으며 stub과 메모리 시연도 구현 완료로 취급하지 않습니다. 과거 검증 기록은 당시 수치를 보존합니다.
