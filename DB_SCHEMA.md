# DB·마이그레이션 검토 진입점

현재 테이블·ERD의 원문은 [current-database.md](docs/database/current-database.md), 환경 경계는 [environment.md](docs/database/environment.md)다. 실제 SQL은 [resources/db](backend/src/main/resources/db)에서 확인한다.

- MySQL·Flyway·JPA validate를 기준으로 프로파일별 migration 위치와 적용 이력을 확인한다. H2 테스트 결과를 MySQL 호환성 증거로 확대하지 않는다.
- 적용된 V1이나 Flyway 이력을 임의 수정하지 않는다. 새 증분 migration으로 FK·인덱스·소유권·기존 값·구버전 호환을 검토한다.
- SQL 값 바인딩, 동적 식별자 허용 목록, 트랜잭션·락·멱등·version을 확인한다.
- 운영 DB 변경·데이터 삭제·복구는 실제 사용자 요청의 허용 범위에서 수행한다. clean·이력 삭제·ddl-auto=update로 실패를 우회하지 않는다.

프로젝트 루트의 문서 대조 명령은 `python scripts/docs/build_current_database.py --check`다. 실제 DB 변경 시험은 격리 환경과 [기존 복구 안내](docs/development/database-recovery-2026-10-03.md)를 확인한 후 수행한다.
