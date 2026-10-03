-- Additive workspace API schema. Requires existing JPA-compatible task/users tables.
-- External FKs are intentionally omitted until legacy CHAR/VARCHAR/collation differences are resolved.
-- Application transactions validate parent ownership and serialize mutations on the parent row.
CREATE TABLE task_assignee (
    id VARCHAR(26) NOT NULL,
    task_id VARCHAR(26) NOT NULL,
    user_id VARCHAR(26) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_task_assignee (task_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE task_checklist_item (
    id VARCHAR(26) NOT NULL,
    task_id VARCHAR(26) NOT NULL,
    title VARCHAR(200) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    assignee_id VARCHAR(26) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY ix_checklist_task_created (task_id, created_at, id),
    KEY ix_checklist_task_assignee (task_id, assignee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE planner_preference (
    user_id VARCHAR(26) NOT NULL,
    default_view VARCHAR(10) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
