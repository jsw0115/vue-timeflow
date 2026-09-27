# 설계 단계 문서 안내

기준일: 2026-09-26. 현재 소스의 사실과 향후 구현 제안을 분리했습니다. 도표는 Mermaid 지원 Markdown 뷰어에서 렌더링됩니다.

| 문서 | 내용 |
| --- | --- |
| [01 시스템 구성도](01-system-architecture.md) | 현행·목표 아키텍처, 웹/iOS/Android/데스크톱, 서버·네트워크·DB, 배포·보안 경계 |
| [02 현행 DB 설계](02-current-database.md) | V1에 정의된 37개 테이블의 모든 컬럼·타입·NULL·기본값·키·인덱스 |
| [03 목표 DB 및 ERD](03-target-database.md) | 기능별 관계도, 신규 테이블 속성, 기존 테이블 확장 및 이행 정책 |
| [04 현행 스키마 차이·위험](04-schema-gaps.md) | DDL과 JPA 불일치, FK 대상 오류, 데이터 보존형 변경 절차 |
| [05 외부 인터페이스 정의](05-external-interfaces.md) | OAuth·메일·푸시·캘린더·스토리지·AI·CI/CD 요청/응답 및 실패 처리 |
| [06 검증 기록](06-validation.md) | 정적 분석·계약 검사 결과, 미검증 항목과 배포 전 체크리스트 |
| [API 상세 명세](../api-info/README.md) | 169개 목표 API의 요청·응답·파라미터·오류 및 104개 현행 계약 |

## 중요한 구분

- **현행**은 소스에서 읽은 결과입니다. DB에 실제 적용된 스키마나 실제 HTTP 응답을 확인한 것은 아닙니다.
- **목표**는 구현할 계약입니다. 일정 기간·태그·멘션·WBS·커뮤니티·채팅 등 확장 기능을 포함하며 모두 운영 가능하다는 의미가 아닙니다.
- 기존 [기능 문서](../product/feature-design.md) 및 [화면 문서](../product/screen-design.md)는 화면 맥락 참고용입니다. 세부 API는 새 `9-API` 계약을 기준으로 구현 전에 합의해야 합니다.

## DB 실행 주의

현재 V1은 `CREATE OR REPLACE TABLE`을 사용하며 생성 테이블은 `tbl_*`, FK 참조 및 JPA 일부 매핑은 접두사 없는 이름입니다. **문서를 보고 V1을 재실행하지 마세요.** 기존 데이터가 교체되거나 FK 생성/런타임 매핑이 실패할 수 있습니다. 이번 작업은 SQL 실행·수정이나 DB 데이터 변경을 하지 않았습니다.

기존 테이블을 먼저 제거하는 동작은 [MariaDB CREATE TABLE 공식 문서](https://mariadb.com/docs/server/server-usage/tables/create-table)의 OR REPLACE 설명을 참고하세요.

## 추적 자료

- [현행 DDL 관계도 원본](diagrams/current-ddl-relationships.md): FK에서 참조하는 이름 그대로이며 정상 생성됐다는 뜻이 아닙니다.
- [테이블 분석 JSON](current-schema.json).
- [근거 소스 SHA-256 스냅샷](source-snapshot.json).
- 생성기: `frontend/scripts/design-docs/`. API 및 DB 계약 변경 후 재생성·검사하는 방법은 [API 문서 안내](../api-info/README.md#기계-판독-및-검증)를 참고하세요.
