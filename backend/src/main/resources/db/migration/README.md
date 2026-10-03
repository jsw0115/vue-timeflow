# Database migrations

Flyway executes versioned migrations once. Do not edit applied migrations or run
`clean`/`repair` to bypass validation errors.

Historical `V1__initial_schema.sql` uses `tbl_` names and destructive replacement
statements. Its checksum is preserved; it is not the current JPA bootstrap.
`CoreSchemaInspector` verifies an unmanaged catalog and its known core columns
before adopting baseline 2. Empty databases take this same guarded path. Unknown
tables and workspace tables without core history are rejected before adoption.

`db/core/V3__safe_core_schema.sql` prepares missing JPA-compatible core tables using
`CREATE TABLE IF NOT EXISTS`. `db/workspace/V4` adds checklist/preferences tables.
The Java migration `db.core.V5__account_identifier_width` widens account columns to
support UUID/ULID, restoring affected existing foreign keys. Core history already
present is validated normally without rebaselining. Chat uses its own history.

See [recovery design and actual verification](../../../../../../docs/development/database-recovery-2026-10-03.md).
