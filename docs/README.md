# Timeflow documentation

## Redis 채팅 구현 · 2026-09-27

- [채팅 문서 시작점](chat/README.md) — 구현 범위, 모듈 구조, 실행 및 검증
- [채팅 MySQL DB 설계](chat/database/design.md) · [채팅 API 목록](chat/api/catalog.md) · [API 상세 설계](chat/api/design.md)
- [Redis 데이터 설계](chat/redis/database-design.md) · [Redis 연동 API 목록](chat/redis/api-catalog.md)

채팅 문서는 실제 추가된 기능을 설명합니다. 아래의 기존 목표 설계와 구분하여 참고하세요.

## 2026-09-26 설계 단계 상세 문서

- [시스템 구성도·DB/ERD·외부 인터페이스 설계](design/README.md)
- [9-API: 169개 목표 API 상세 계약](api-info/README.md) — 요청 URL/메서드/헤더/파라미터, 요청·응답 예시, 오류 원인·조치
- [현행 104개 API와 구현 상태](api-info/current-contract.md) — 서비스 연결 47, stub 52, 메모리 시연 5
- [현재 DDL의 이름 불일치·데이터 교체 위험](design/04-schema-gaps.md) — V1 재실행 전 확인 필수

현재 구현과 목표 설계는 다릅니다. 새 문서는 기능 구현 또는 DB 변경을 의미하지 않습니다.

- `development/`: local setup and quality checks
- `deployment/`: production and GitLab CI/CD release guides
- `architecture/`: client, API, and database boundaries
- `product/`: feature scope and screen design
- `database/`: table and migration design
- `api/`: API design and endpoint specification

Executable DDL is in `backend/src/main/resources/db/migration/`.


## 2026-09-25 API·플랫폼 설계

- [API 목록서](api/api-catalog.md)
- [API 설계서](api/api-design.md)
- [현재 소스 API 목록](api/current-api-inventory.md)
- [로컬 PC·모바일 실행](development/local-platforms.md)
- [플랫폼 화면 설계](product/platform-preview-design.md)
- [추가 기능 설계](product/api-enhancements.md)
- [3단계 검증 기록](quality/review-2026-09-25.md)

## 화면·작성 흐름 개선

- [UI 변경 내역·사용법·검증 기록](product/ui-interaction-update-2026-09-25.md)
