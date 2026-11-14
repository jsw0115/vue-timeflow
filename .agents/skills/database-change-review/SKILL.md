---
name: database-change-review
description: DB 스키마·쿼리·마이그레이션 변경의 정합성·권한·SQL 삽입과 롤백을 검토할 때 사용한다.
---

# database-change-review

문서·명령 경로는 프로젝트 루트 기준이다. 기존 `AGENTS.md`와 `PROJECT_CONTEXT.md`를 함께 따른다.

Timebar Diary는 MySQL·Flyway·JPA/JDBC를 사용한다. `backend/src/main/resources/db/`의 프로파일별 경로와 기존 이력을 확인하며 H2 성공을 MySQL 검증으로 확대하지 않는다.


1. 실제 DB/ORM/마이그레이션 파일과 적용 이력을 확인한다.
2. SQL 값 바인딩, 동적 식별자 허용 목록, 권한/트랜잭션/동시성/인덱스 점검.
3. 새 마이그레이션과 호환성·복구 절차를 작성하고 관련 로컬 테스트만 수행한다.
4. 운영 DB 변경은 승인받기 전 실행하지 않는다. `DB_SCHEMA.md` 참조.
