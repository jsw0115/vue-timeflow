-- Additive bootstrap for verified empty/unmanaged schemas and existing core history.
-- Historical V1 is preserved but never replayed against an unmanaged database.
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL, email VARCHAR(255) NOT NULL, pw_hash VARCHAR(255) NOT NULL,
    nick VARCHAR(80) NOT NULL, role VARCHAR(20) NOT NULL, st VARCHAR(20) NOT NULL,
    tz VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul', email_vfy BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_utc DATETIME(6) NULL, pw_chg_utc DATETIME(6) NULL,
    c_at DATETIME(6) NOT NULL, u_at DATETIME(6) NOT NULL, d_at DATETIME(6) NULL,
    is_enabled INT NULL DEFAULT 1,
    PRIMARY KEY (id), UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_token (
    id VARCHAR(26) NOT NULL, user_id VARCHAR(36) NOT NULL, device_id VARCHAR(128) NULL,
    tok_hash VARCHAR(255) NOT NULL, jti VARCHAR(36) NULL, exp_utc DATETIME(6) NOT NULL,
    rev_utc DATETIME(6) NULL, last_used_utc DATETIME(6) NULL, c_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id), UNIQUE KEY uk_refresh_token_hash (tok_hash),
    KEY ix_refresh_token_user (user_id, rev_utc, exp_utc),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_throttle (
    id VARCHAR(26) NOT NULL, key_type VARCHAR(10) NOT NULL, key_val VARCHAR(255) NOT NULL,
    fail_cnt INT NOT NULL DEFAULT 0, lock_utc DATETIME(6) NULL,
    last_fail_utc DATETIME(6) NULL, u_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id), UNIQUE KEY uk_login_throttle_key (key_type, key_val)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
    id BIGINT NOT NULL AUTO_INCREMENT, user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL, category VARCHAR(255) NULL, date DATE NOT NULL,
    start_time TIME NULL, end_time TIME NULL, location VARCHAR(255) NULL,
    visibility VARCHAR(20) NULL, note VARCHAR(1000) NULL, series_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id), KEY ix_events_user_date (user_id, date), KEY ix_events_series_date (series_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task (
    id VARCHAR(26) NOT NULL, user_id VARCHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
    note TEXT NULL, st VARCHAR(20) NOT NULL, pri VARCHAR(20) NOT NULL, energy_lvl VARCHAR(20) NOT NULL,
    duration_min INT NOT NULL DEFAULT 30, due DATE NULL, cat_id VARCHAR(26) NULL,
    cat_name VARCHAR(60) NULL, cat_color VARCHAR(7) NULL, cat_icon VARCHAR(16) NULL,
    event_id VARCHAR(26) NULL, is_repeat BOOLEAN NOT NULL DEFAULT FALSE,
    c_at DATETIME(6) NOT NULL, u_at DATETIME(6) NOT NULL, d_at DATETIME(6) NULL,
    PRIMARY KEY (id), KEY ix_task_user_due (user_id, due, c_at),
    KEY ix_task_user_status (user_id, st, d_at),
    CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS routine (
    id VARCHAR(26) NOT NULL, user_id VARCHAR(36) NOT NULL, name VARCHAR(200) NOT NULL,
    icon VARCHAR(16) NULL, cat_id VARCHAR(26) NULL, cat_name VARCHAR(60) NULL,
    cat_color VARCHAR(7) NULL, cat_icon VARCHAR(16) NULL, at_time VARCHAR(5) NOT NULL,
    days VARCHAR(32) NOT NULL, onoff BOOLEAN NOT NULL DEFAULT TRUE, notify BOOLEAN NOT NULL DEFAULT FALSE,
    n_min INT NULL, c_at DATETIME(6) NOT NULL, u_at DATETIME(6) NOT NULL, d_at DATETIME(6) NULL,
    PRIMARY KEY (id), KEY ix_routine_user_time (user_id, onoff, at_time),
    CONSTRAINT fk_routine_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS routine_log (
    id VARCHAR(26) NOT NULL, routine_id VARCHAR(26) NOT NULL, dt DATE NOT NULL,
    st VARCHAR(10) NOT NULL, u_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id), UNIQUE KEY uk_routine_log_date (routine_id, dt),
    CONSTRAINT fk_routine_log_routine FOREIGN KEY (routine_id) REFERENCES routine (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS planner_item (
    id BIGINT NOT NULL AUTO_INCREMENT, type VARCHAR(20) NOT NULL, title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NULL, date DATE NULL, start_time TIME NULL, end_time TIME NULL,
    status VARCHAR(20) NULL, dday BOOLEAN NOT NULL DEFAULT FALSE, note VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id), KEY ix_planner_item_date_type (date, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
