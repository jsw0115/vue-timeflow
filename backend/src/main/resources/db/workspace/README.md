# Workspace API additive migrations

`V4__task_checklist_and_planner_preferences.sql` creates three new tables for the
checklist, task assignee candidates and planner default-view APIs. Both the main
Flyway configuration and the isolated `chat-local` profile include this directory.
Chat migrations still use their own Flyway history; workspace V4 uses core history.

This is an upgrade for a JPA-compatible database with `task` and `users` already
present. It does not resolve the legacy V1 `tbl_` naming/FK inconsistencies. Existing
V1/V2 migrations and checksums are preserved. Do not replay the old V1 against data.
The initial source-only implementation did not apply migrations. The subsequent
startup recovery was verified on actual MySQL and applied to local `timeflow` on
2026-10-03/04, preserving existing data and accounts; see the recovery record below.
Safe core V3 prepares missing parent tables before this V4. Core V5 widens account
references to accept both UUID 36 and ULID 26 without changing their values.

Existing ID types and collations differ across legacy schemas, so external foreign
keys are deliberately deferred. Services validate the parent and active users and
serialize all child writes on the task row. Table access outside these services
requires equivalent checks. A future physical FK migration needs a real schema audit.

The new entity timestamps use UTC `DATETIME(6)`. Stored optimistic versions start at
zero; the public API exposes stored version plus one. Unstored planner preferences
are the only response with public version zero.

See [API design](../../../../../../docs/api/implementation-plan-2026-10-03.md) and
[contracts](../../../../../../docs/api/task-planner-contract.md).
See [actual recovery verification](../../../../../../docs/development/database-recovery-2026-10-03.md).

## 플래너 버전 추가 V7

`V7__planner_item_version.sql`은 기존 행을 유지하고 `planner_item.version BIGINT NOT NULL DEFAULT 0`을 추가한다. 기본·chat-local 모두 같은 workspace 경로를 사용한다. 기존 migration과 체크섬은 수정하지 않는다. 공개 버전은 내부 값+1이며 수정·상태 변경·삭제에 조회한 버전이 필요하다.

운영 적용 전 백업·별도 복원을 확인하고 구버전 쓰기를 중지한 뒤 V7과 새 서버·클라이언트를 함께 적용한다. 구버전 서버는 version을 검사하지 않으므로 혼합 배포 중에는 충돌 보호를 보장할 수 없다. 롤백 시 추가 열과 사용자 데이터를 보존하고 쓰기를 중지한 상태에서 이전 코드의 덮어쓰기 정책을 검토한다. 이 작업에서 운영 DB에는 적용하지 않았다. H2 검증과 실제 MySQL 검증을 구분한다.

## 할 일 버전 추가 V8

`V8__task_version.sql`은 기존 행을 유지하고 `task.version BIGINT NOT NULL DEFAULT 0`을 추가한다(PR-07 1단계). 기본·chat-local 모두 같은 workspace 경로를 사용한다. 공개 버전은 내부 값+1이며, 할 일의 수정(본문 `version`)·상태 변경·삭제(쿼리 `version`)에 조회한 버전이 필요하다. 체크리스트 변경은 할 일 행을 잠그지만 할 일 버전은 바꾸지 않는다.

운영 적용 조건은 V7과 같다. 백업·별도 복원을 확인하고 구버전 쓰기를 중지한 뒤 V8과 새 서버·클라이언트를 함께 적용한다. 구버전 서버는 version을 검사하지 않는다. 이 작업에서 운영 DB와 격리 MySQL에는 적용하지 않았고, H2 테스트(`TaskVersionTest`)로만 확인했다.
