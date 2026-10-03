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
