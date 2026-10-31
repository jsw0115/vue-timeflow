# DB·Redis 환경과 마이그레이션 운영

작성일 2026-10-31. 수정일 2026-10-31. 설치 명령은 [로컬 가이드](../handbook/source/01-로컬-실행-가이드.md)와 [Linux 가이드](../deployment/gitlab-cicd.md)에서 관리합니다. 이 문서는 데이터 준비·이력·확인·보존을 담당합니다.

## 목차

- [환경 구분](#환경-구분)
- [설치와 접속 확인](#설치와-접속-확인)
- [마이그레이션 구조](#마이그레이션-구조)
- [ERD·테이블 정의와 변경](#erd테이블-정의와-변경)
- [백업·복원·장애 대응](#백업복원장애-대응)

## 환경 구분

| 환경 | MySQL | Redis | 데이터·비밀값 |
| --- | --- | --- | --- |
| 격리 chat-local | 127.0.0.1:13316/timeflow_chat_dev, timeflow_chat | 127.0.0.1:16389, AOF·128MB·noeviction | 개발 전용 기본값. 운영 사용 금지 |
| 기본 개발 | 설정한 DB, 기본 예시는 localhost:3307/timeflow | 설정한 주소, 채팅 기본 비활성 | 기존 DB 보호·backend/.env |
| Linux 검증·운영 | Compose db:3306/timeflow, 외부 바인딩 없음 | redis:6379, 암호·AOF·256MB·noeviction | 환경별 호스트·계정·볼륨·백업 분리 |

MySQL이 장기 계정·기록·채팅·파일을 저장합니다. Redis는 채팅 전파·활성 상태 등을 담당하고 MySQL 백업을 대체하지 않습니다. noeviction은 메모리 부족을 해결하는 기능이 아니므로 사용량·쓰기 오류를 관찰해야 합니다.

## 설치와 접속 확인

새 개발자는 Docker 격리 구성을 우선 사용합니다. 기존 MySQL을 쓰면 DB명·계정·접근 호스트·문자셋·타입·이력을 관리자와 확인하고 연결 전에 백업합니다. 기본 스키마 이름과 DB_SCHEMA를 일치시킵니다. 기존 DB에 개발 프로필의 초기화 경로를 임의 적용하지 않습니다.

다음 SQL은 접속한 대상과 메타데이터만 확인합니다. 관리 클라이언트에서 실제 접속 DB를 확인한 뒤 실행합니다.

```sql
SELECT DATABASE(), VERSION(), @@session.time_zone, @@character_set_database;
SHOW TABLES;
SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;
-- 채팅을 활성화한 설치에만 존재합니다.
SELECT version, description, success FROM flyway_chat_history ORDER BY installed_rank;
```

API health와 실제 인증·기록 생성·재조회는 별도로 확인합니다. `mysqladmin ping`과 Redis PONG만으로 애플리케이션 사용자의 실제 권한·스키마 일치를 입증하지 않습니다. 시간·반복·날짜는 사용자 시간대와 JDBC UTC 규칙을 함께 확인합니다.

## 마이그레이션 구조

| 위치·버전 | 역할 |
| --- | --- |
| db/migration/V1__initial_schema.sql | 역사적 DDL. 체크섬 보존, 신규 DB에 수동 재실행 금지 |
| CoreMigrationStrategy·CoreSchemaInspector | 미관리 DB 구조·DB_SCHEMA를 검사하고 안전한 baseline 여부 결정 |
| core V3 | 누락된 안전한 core 테이블 생성 |
| workspace V4 | 체크리스트·담당자·플래너 설정 |
| Java core V5 | 기존 UUID·신규 ULID 계정 참조 폭 호환 |
| workspace V6 | feature_record·member·friend·block·file와 auth_version·planner 소유자 |
| chat V1~V4 | 채팅 테이블·멘션/태그·검색·계정 폭 |

Core는 `flyway_schema_history`, 채팅은 `flyway_chat_history`를 사용합니다. 빈 검증 DB의 Core baseline 2·Chat baseline 0은 과거 위험한 초기 경로를 피하는 실제 전략의 결과입니다. 표를 보고 baseline SQL이나 migration을 수동 실행하지 않습니다.

JPA는 `ddl-auto=validate`, Flyway clean은 비활성입니다. 알 수 없는 테이블·스키마·확장 테이블에 이력이 없으면 검사가 중단될 수 있습니다. 이는 보존 장치이며 history 삭제·clean·repair·볼륨 삭제로 우회하지 않습니다. 기존 데이터 복구 판단은 [2026-10-03 복구 기록](../development/database-recovery-2026-10-03.md)의 근거를 참고합니다.

## ERD·테이블 정의와 변경

현재 기준은 [전체 ERD와 정의서](current-database.md)와 [메타데이터 JSON](current-schema.json)입니다. 2026-10-31에 이전의 격리 검증 DB에서 사용자 데이터 없이 28개 테이블·205개 컬럼·15개 물리 FK를 확인했습니다. 실제 운영 스키마는 이력을 대조해 별도 검수합니다.

과거 `tbl_*` V1 분석과 40개 목표 DDL은 설계 이력입니다. 현재 `feature_record`의 JSON 종류를 물리 테이블 1개씩으로 그리거나 목표 DDL을 현재 DB 위에 적용하지 않습니다. 키 타입·소유권·NULL·문자열 시각·인덱스는 실제 정의를 보존합니다.

변경 절차는 요구 등록 → 영향 데이터·참조·성능·구버전 호환 분석 → 새 migration → 격리 빈 DB·기존 구조 복제에서 검증 → DB 문서 재캡처 → 배포·복구 계획입니다. migration 번호는 Core/workspace의 통합 순서와 Chat의 별도 이력을 확인해 충돌 없이 정합니다. 이미 적용한 파일을 수정하지 않습니다.

## 백업·복원·장애 대응

운영 백업 실행은 [Linux 배포·백업 절차](../deployment/gitlab-cicd.md#8-다음-릴리스백업롤백)를 따릅니다. 백업은 접근 제한·암호화·외부 보관·보존 정책을 정하고 파일 존재만 확인하지 말고 별도 격리 DB에 복원해 계정·기록·파일·이력과 서비스 기동을 검수합니다.

MySQL 버전 간 이전은 dump 호환성을 별도 확인하며 데이터 디렉터리를 그대로 복사하지 않습니다. Redis AOF와 MySQL backup은 독립적으로 검토합니다. 코드 롤백은 DB migration을 되돌리지 않으므로 구버전 호환이 없으면 중단·전진 수정·승인된 복구를 선택합니다.

| 증상 | 확인 순서 |
| --- | --- |
| 연결 실패 | 실제 host·port·엔진 상태·DB명·계정 host·권한 |
| 인증 실패 | .env/환경변수 우선순위·초기 DB 계정과 실제 비밀번호. 값은 출력하지 않음 |
| schema 불일치 | 연결 DB·Flyway 이력·필수 컬럼·마이그레이션 소스 |
| checksum 불일치 | 적용 파일 변경 여부·배포 SHA·이력, 원인 확인 전 repair 금지 |
| Redis 쓰기·SSE 이상 | 연결·암호·메모리·AOF·outbox·재조회 |
| 복원 실패 | dump 버전·문자셋·제약·이력·대상 분리, 원본 DB 보존 |

문제 해결의 실제 증거는 [트러블슈팅 기록](../development/troubleshooting.md), 정기 업무는 [운영 매뉴얼](../operations/runbook.md)에 남깁니다.
