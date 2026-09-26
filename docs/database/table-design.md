# Database table design

> 2026-09-26: This is an earlier, partial design summary, not the current full DDL inventory. See the [37-table source-derived dictionary](../design/02-current-database.md), [target ERD](../design/03-target-database.md), and [schema mismatch report](../design/04-schema-gaps.md). Current V1 declares `tbl_*` tables with `CREATE OR REPLACE TABLE`, while FK references and JPA mappings use unprefixed names. Do not rerun V1 on existing data. Documentation updates do not apply migrations.

| Table | Key | Purpose |
| --- | --- | --- |
| `users` | ULID | account, role, status, timezone |
| `refresh_token` | ULID | hashed/revocable device sessions |
| `login_throttle` | ULID | login rate-limit state |
| `events` | bigint | calendar and recurrence instances |
| `task` | ULID | task with soft delete/category snapshot |
| `routine` | ULID | routine definition |
| `routine_log` | routine/date unique | daily achievement |
| `planner_item` | bigint | generic legacy planner record |

`V1__initial_schema.sql` is the Flyway baseline. Never edit it after use; add `V2__...sql` with `ALTER TABLE` for future changes. `task.event_id` is a string in the current entity while `events.id` is bigint, so no foreign key is created until that API model is normalized.

Planned but not yet implemented entities: category, diary entry, memo, attachment, time block, notification, calendar group, friend, and audit log.
