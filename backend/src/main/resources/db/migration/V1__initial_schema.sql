-- Timeflow initial schema for MariaDB 10.6+ (utf8mb4).
-- This file is immutable after it has been applied by Flyway.

CREATE OR REPLACE TABLE tbl_users (
  id CHAR(26) NOT NULL, email VARCHAR(255) NOT NULL, pw_hash VARCHAR(255) NOT NULL,
  nick VARCHAR(80) NOT NULL, role VARCHAR(20) NOT NULL, st VARCHAR(20) NOT NULL,
  tz VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul', email_vfy BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_utc DATETIME(6) NULL, pw_chg_utc DATETIME(6) NULL,
  c_at DATETIME(6) NOT NULL, u_at DATETIME(6) NOT NULL, d_at DATETIME(6) NULL,
  is_enabled TINYINT NULL DEFAULT 1,
  PRIMARY KEY (id), UNIQUE KEY uk_users_email (email), KEY ix_users_status (st, d_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_refresh_token (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, device_id VARCHAR(128) NULL,
  tok_hash VARCHAR(255) NOT NULL, jti CHAR(36) NULL, exp_utc DATETIME(6) NOT NULL,
  rev_utc DATETIME(6) NULL, last_used_utc DATETIME(6) NULL, c_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uk_refresh_token_hash (tok_hash),
  KEY ix_refresh_token_user (user_id, rev_utc, exp_utc),
  CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_login_throttle (
  id CHAR(26) NOT NULL, key_type VARCHAR(10) NOT NULL, key_val VARCHAR(255) NOT NULL,
  fail_cnt INT NOT NULL DEFAULT 0, lock_utc DATETIME(6) NULL, last_fail_utc DATETIME(6) NULL,
  u_at DATETIME(6) NOT NULL, PRIMARY KEY (id),
  UNIQUE KEY uk_login_throttle_key (key_type, key_val), KEY ix_login_throttle_lock (lock_utc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_events (
  id BIGINT NOT NULL AUTO_INCREMENT, user_id CHAR(26) NOT NULL, title VARCHAR(255) NOT NULL,
  category VARCHAR(255) NULL, date DATE NOT NULL, start_time TIME NULL, end_time TIME NULL,
  location VARCHAR(255) NULL, visibility VARCHAR(20) NULL, note VARCHAR(255) NULL,
  series_id BIGINT NULL, created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id), KEY ix_events_user_date (user_id, date), KEY ix_events_series_date (series_id, date),
  CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_task (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, title VARCHAR(200) NOT NULL, note TEXT NULL,
  st VARCHAR(20) NOT NULL, pri VARCHAR(20) NOT NULL, energy_lvl VARCHAR(20) NOT NULL,
  duration_min INT NOT NULL DEFAULT 30, due DATE NULL, cat_id CHAR(26) NULL, cat_name VARCHAR(60) NULL,
  cat_color CHAR(7) NULL, cat_icon VARCHAR(16) NULL, event_id CHAR(26) NULL,
  is_repeat BOOLEAN NOT NULL DEFAULT FALSE, c_at DATETIME(6) NOT NULL, u_at DATETIME(6) NOT NULL,
  d_at DATETIME(6) NULL, PRIMARY KEY (id), KEY ix_task_user_due (user_id, due, c_at),
  KEY ix_task_user_status (user_id, st, d_at),
  CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_routine (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, name VARCHAR(200) NOT NULL, icon VARCHAR(16) NULL,
  cat_id CHAR(26) NULL, cat_name VARCHAR(60) NULL, cat_color CHAR(7) NULL, cat_icon VARCHAR(16) NULL,
  at_time CHAR(5) NOT NULL, days VARCHAR(32) NOT NULL, onoff BOOLEAN NOT NULL DEFAULT TRUE,
  notify BOOLEAN NOT NULL DEFAULT FALSE, n_min INT NULL, c_at DATETIME(6) NOT NULL,
  u_at DATETIME(6) NOT NULL, d_at DATETIME(6) NULL, PRIMARY KEY (id),
  KEY ix_routine_user_time (user_id, onoff, at_time),
  CONSTRAINT fk_routine_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_routine_log (
  id CHAR(26) NOT NULL, routine_id CHAR(26) NOT NULL, dt DATE NOT NULL, st VARCHAR(10) NOT NULL,
  u_at DATETIME(6) NOT NULL, PRIMARY KEY (id), UNIQUE KEY uk_routine_log_date (routine_id, dt),
  KEY ix_routine_log_date (dt),
  CONSTRAINT fk_routine_log_routine FOREIGN KEY (routine_id) REFERENCES routine (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_planner_item (
  id BIGINT NOT NULL AUTO_INCREMENT, type VARCHAR(20) NOT NULL, title VARCHAR(255) NOT NULL,
  category VARCHAR(255) NULL, date DATE NULL, start_time TIME NULL, end_time TIME NULL,
  status VARCHAR(20) NULL, dday BOOLEAN NOT NULL DEFAULT FALSE, note VARCHAR(255) NULL,
  created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id), KEY ix_planner_item_date_type (date, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extended schema from the product DDL.  The application is a single MariaDB
-- database, so references are local foreign keys instead of cross-service IDs.
CREATE OR REPLACE TABLE tbl_category (
  id CHAR(26) NOT NULL, user_id CHAR(26) NULL, parent_id CHAR(26) NULL,
  name VARCHAR(60) NOT NULL, color CHAR(7) NOT NULL DEFAULT '#64748b', icon VARCHAR(16) NULL,
  ord INT NOT NULL DEFAULT 0, scope VARCHAR(12) NOT NULL DEFAULT 'ALL', is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  st VARCHAR(12) NOT NULL DEFAULT 'ACTIVE', c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL,
  d_at DATETIME(3) NULL, d_by CHAR(26) NULL, PRIMARY KEY (id),
  UNIQUE KEY uk_category_user_name (user_id, name), KEY ix_category_parent (user_id, parent_id), KEY ix_category_state (user_id, st),
  CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_user_pref (
  user_id CHAR(26) NOT NULL, start_scr VARCHAR(32) NOT NULL DEFAULT 'home', date_fmt VARCHAR(32) NOT NULL DEFAULT 'YYYY-MM-DD',
  time_fmt VARCHAR(3) NOT NULL DEFAULT '24h', theme_id VARCHAR(64) NOT NULL DEFAULT 'default',
  push_on BOOLEAN NOT NULL DEFAULT TRUE, email_on BOOLEAN NOT NULL DEFAULT FALSE, inapp_on BOOLEAN NOT NULL DEFAULT TRUE,
  dnd_s CHAR(5) NULL, dnd_e CHAR(5) NULL, week_start VARCHAR(3) NOT NULL DEFAULT 'MON', locale VARCHAR(16) NOT NULL DEFAULT 'ko-KR',
  time_step_min INT NOT NULL DEFAULT 10, def_event_vis VARCHAR(12) NOT NULL DEFAULT 'PRIVATE', def_event_all_day BOOLEAN NOT NULL DEFAULT TRUE,
  def_event_dur_min INT NOT NULL DEFAULT 60, def_reminder_min INT NULL, overlap_warn_on BOOLEAN NOT NULL DEFAULT TRUE,
  u_at DATETIME(3) NOT NULL, PRIMARY KEY (user_id), CONSTRAINT fk_user_pref_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_dash_layout (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, scope VARCHAR(12) NOT NULL DEFAULT 'all', bp VARCHAR(16) NULL,
  `json` LONGTEXT NOT NULL, c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL, PRIMARY KEY (id),
  UNIQUE KEY uk_dash_layout (user_id, scope, bp), CONSTRAINT fk_dash_layout_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_dash_portlet_pref (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, portlet_id VARCHAR(64) NOT NULL, vis BOOLEAN NOT NULL DEFAULT TRUE,
  ord INT NOT NULL DEFAULT 0, cfg_json LONGTEXT NULL, u_at DATETIME(3) NOT NULL, PRIMARY KEY (id),
  UNIQUE KEY uk_dash_portlet (user_id, portlet_id), CONSTRAINT fk_dash_portlet_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_notif_pref (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, evt VARCHAR(64) NOT NULL, push_on BOOLEAN NOT NULL DEFAULT TRUE,
  email_on BOOLEAN NOT NULL DEFAULT FALSE, inapp_on BOOLEAN NOT NULL DEFAULT TRUE, cfg_json LONGTEXT NULL, u_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uk_notif_pref (user_id, evt), CONSTRAINT fk_notif_pref_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_user_device (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, device_id VARCHAR(128) NOT NULL, platform VARCHAR(10) NOT NULL DEFAULT 'WEB',
  push_tok VARCHAR(512) NULL, app_ver VARCHAR(32) NULL, last_seen_utc DATETIME(3) NULL, revoked_utc DATETIME(3) NULL,
  c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL, PRIMARY KEY (id), UNIQUE KEY uk_user_device (user_id, device_id),
  CONSTRAINT fk_user_device_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Import/export, calendar synchronisation and operational records.
CREATE OR REPLACE TABLE tbl_data_file (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, kind VARCHAR(10) NOT NULL, filename VARCHAR(255) NOT NULL,
  mime VARCHAR(100) NULL, size_b BIGINT NOT NULL DEFAULT 0, sha256 CHAR(64) NULL, storage_key VARCHAR(512) NOT NULL,
  exp_utc DATETIME(3) NULL, c_at DATETIME(3) NOT NULL, PRIMARY KEY (id), KEY ix_data_file_user_kind (user_id, kind),
  CONSTRAINT fk_data_file_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_data_job (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, typ VARCHAR(10) NOT NULL, fmt VARCHAR(8) NOT NULL,
  st VARCHAR(10) NOT NULL DEFAULT 'PENDING', params_json LONGTEXT NULL, result_file_id CHAR(26) NULL, err_msg VARCHAR(500) NULL,
  c_at DATETIME(3) NOT NULL, s_utc DATETIME(3) NULL, e_utc DATETIME(3) NULL, PRIMARY KEY (id), KEY ix_data_job_user_state (user_id, st),
  CONSTRAINT fk_data_job_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_data_job_result FOREIGN KEY (result_file_id) REFERENCES data_file (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_import_mapping_profile (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, src_typ VARCHAR(8) NOT NULL, name VARCHAR(100) NOT NULL,
  map_json LONGTEXT NOT NULL, rule_json LONGTEXT NULL, c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL, PRIMARY KEY (id),
  KEY ix_import_mapping_user (user_id, src_typ), CONSTRAINT fk_import_mapping_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_ext_cal_account (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, provider VARCHAR(10) NOT NULL, st VARCHAR(12) NOT NULL DEFAULT 'CONNECTED',
  scopes VARCHAR(500) NULL, meta_json LONGTEXT NULL, c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL, PRIMARY KEY (id),
  UNIQUE KEY uk_ext_cal_account (user_id, provider), CONSTRAINT fk_ext_cal_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_sync_run_log (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, provider VARCHAR(10) NOT NULL, st VARCHAR(10) NOT NULL,
  started_utc DATETIME(3) NOT NULL, ended_utc DATETIME(3) NOT NULL, pulled_cnt INT NOT NULL DEFAULT 0, pushed_cnt INT NOT NULL DEFAULT 0,
  conflict_cnt INT NOT NULL DEFAULT 0, err_msg VARCHAR(500) NULL, meta_json LONGTEXT NULL, PRIMARY KEY (id),
  KEY ix_sync_run_user_time (user_id, started_utc), CONSTRAINT fk_sync_run_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_support_ticket (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, typ VARCHAR(16) NOT NULL DEFAULT 'OTHER', st VARCHAR(16) NOT NULL DEFAULT 'OPEN',
  title VARCHAR(200) NOT NULL, body LONGTEXT NOT NULL, meta_json LONGTEXT NULL, c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id), KEY ix_support_ticket_state (st), CONSTRAINT fk_support_ticket_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_settings_audit_log (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, area VARCHAR(32) NOT NULL, action VARCHAR(32) NOT NULL,
  diff_json LONGTEXT NULL, at_utc DATETIME(3) NOT NULL, PRIMARY KEY (id), KEY ix_settings_audit_user_time (user_id, at_utc),
  CONSTRAINT fk_settings_audit_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- `events` uses BIGINT IDs in the existing Spring API. The following references match it;
-- do not replace it with the source DDL's CHAR(26) `event` table without a full API migration.
CREATE OR REPLACE TABLE tbl_event_policy (
  event_id BIGINT NOT NULL, editor_del BOOLEAN NOT NULL DEFAULT FALSE, def_edit_sc VARCHAR(8) NOT NULL DEFAULT 'future',
  def_del_sc VARCHAR(8) NOT NULL DEFAULT 'none', max_edit_sc VARCHAR(8) NOT NULL DEFAULT 'future', max_del_sc VARCHAR(8) NOT NULL DEFAULT 'future',
  u_at DATETIME(3) NOT NULL, PRIMARY KEY (event_id), CONSTRAINT fk_event_policy_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_event_share (
  id CHAR(26) NOT NULL, event_id BIGINT NOT NULL, user_id CHAR(26) NOT NULL, role VARCHAR(8) NOT NULL,
  edit_sc VARCHAR(8) NOT NULL DEFAULT 'single', del_sc VARCHAR(8) NOT NULL DEFAULT 'none', by_id CHAR(26) NOT NULL, `at` DATETIME(3) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uk_event_share (event_id, user_id), KEY ix_event_share_user (user_id),
  CONSTRAINT fk_event_share_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_event_share_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_event_ex (
  id CHAR(26) NOT NULL, event_id BIGINT NOT NULL, occ_start CHAR(16) NOT NULL, cancel BOOLEAN NOT NULL DEFAULT FALSE,
  o_title VARCHAR(200) NULL, o_note TEXT NULL, o_loc VARCHAR(255) NULL, o_start_utc DATETIME(3) NULL, o_end_utc DATETIME(3) NULL,
  o_all_day BOOLEAN NULL, o_tz VARCHAR(64) NULL, o_cat_id CHAR(26) NULL, o_cat_name VARCHAR(60) NULL, o_cat_color CHAR(7) NULL, o_cat_icon VARCHAR(16) NULL,
  by_id CHAR(26) NOT NULL, c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL, PRIMARY KEY (id), UNIQUE KEY uk_event_ex (event_id, occ_start),
  CONSTRAINT fk_event_ex_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_event_ver (
  id CHAR(26) NOT NULL, event_id BIGINT NOT NULL, ver_no INT NOT NULL, `at` DATETIME(3) NOT NULL, by_id CHAR(26) NOT NULL,
  summary VARCHAR(255) NULL, snap LONGTEXT NOT NULL, diff LONGTEXT NULL, PRIMARY KEY (id), UNIQUE KEY uk_event_version (event_id, ver_no),
  CONSTRAINT fk_event_ver_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_time_entry (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, typ VARCHAR(8) NOT NULL, title VARCHAR(200) NOT NULL,
  start_utc DATETIME(3) NOT NULL, end_utc DATETIME(3) NOT NULL, tz VARCHAR(64) NOT NULL, cat_id CHAR(26) NULL,
  cat_name VARCHAR(60) NULL, cat_color CHAR(7) NULL, cat_icon VARCHAR(16) NULL, event_id BIGINT NULL, memo TEXT NULL,
  c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL, d_at DATETIME(3) NULL, PRIMARY KEY (id),
  KEY ix_time_entry_user_time (user_id, start_utc, end_utc), KEY ix_time_entry_kind (user_id, typ, start_utc),
  CONSTRAINT fk_time_entry_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_time_entry_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_task_member (
  id BIGINT NOT NULL AUTO_INCREMENT, task_id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, joined_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uk_task_member (task_id, user_id), KEY ix_task_member_user (user_id),
  CONSTRAINT fk_task_member_task FOREIGN KEY (task_id) REFERENCES task (id) ON DELETE CASCADE,
  CONSTRAINT fk_task_member_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_task_repeat_rule (
  task_id CHAR(26) NOT NULL, freq VARCHAR(10) NOT NULL DEFAULT 'DAILY', interval_val INT NOT NULL DEFAULT 1, weekdays VARCHAR(30) NULL,
  end_type VARCHAR(8) NOT NULL DEFAULT 'NONE', end_until DATE NULL, PRIMARY KEY (task_id),
  CONSTRAINT fk_task_repeat_task FOREIGN KEY (task_id) REFERENCES task (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_memo (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, typ VARCHAR(8) NOT NULL DEFAULT 'text', title VARCHAR(200) NULL,
  body LONGTEXT NULL, stt LONGTEXT NULL, st VARCHAR(10) NOT NULL DEFAULT 'inbox', tags VARCHAR(500) NULL,
  c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL, d_at DATETIME(3) NULL, PRIMARY KEY (id), KEY ix_memo_user_state (user_id, st),
  CONSTRAINT fk_memo_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_diary (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, dt DATE NOT NULL, mood VARCHAR(10) NOT NULL DEFAULT 'good',
  sumry TEXT NULL, body TEXT NULL, grat TEXT NULL, c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uk_diary_user_date (user_id, dt), CONSTRAINT fk_diary_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_friend (
  id CHAR(26) NOT NULL, a_id CHAR(26) NOT NULL, b_id CHAR(26) NOT NULL, st VARCHAR(10) NOT NULL DEFAULT 'pending', req_by CHAR(26) NOT NULL,
  c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL, PRIMARY KEY (id), UNIQUE KEY uk_friend_pair (a_id, b_id),
  CONSTRAINT fk_friend_a FOREIGN KEY (a_id) REFERENCES users (id), CONSTRAINT fk_friend_b FOREIGN KEY (b_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_cal_group (
  id CHAR(26) NOT NULL, owner_id CHAR(26) NOT NULL, name VARCHAR(80) NOT NULL, note VARCHAR(255) NULL,
  c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL, PRIMARY KEY (id),
  CONSTRAINT fk_cal_group_owner FOREIGN KEY (owner_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_cal_group_mem (
  id CHAR(26) NOT NULL, gid CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, role VARCHAR(10) NOT NULL DEFAULT 'member', `at` DATETIME(3) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uk_cal_group_member (gid, user_id), KEY ix_cal_group_member_user (user_id),
  CONSTRAINT fk_cal_group_mem_group FOREIGN KEY (gid) REFERENCES cal_group (id) ON DELETE CASCADE,
  CONSTRAINT fk_cal_group_mem_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE TABLE tbl_theme_catalog (
  id VARCHAR(64) NOT NULL, name VARCHAR(80) NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE, ord INT NOT NULL DEFAULT 0,
  meta_json LONGTEXT NULL, u_at DATETIME(3) NOT NULL, PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_sticker_pack (
  id CHAR(26) NOT NULL, code VARCHAR(64) NOT NULL, name VARCHAR(80) NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ord INT NOT NULL DEFAULT 0, meta_json LONGTEXT NULL, c_at DATETIME(3) NOT NULL, u_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id), UNIQUE KEY uk_sticker_pack_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_sticker_item (
  id CHAR(26) NOT NULL, pack_id CHAR(26) NOT NULL, code VARCHAR(64) NOT NULL, label VARCHAR(80) NULL,
  asset_url VARCHAR(512) NOT NULL, ord INT NOT NULL DEFAULT 0, meta_json LONGTEXT NULL, PRIMARY KEY (id),
  UNIQUE KEY uk_sticker_item (pack_id, code), CONSTRAINT fk_sticker_item_pack FOREIGN KEY (pack_id) REFERENCES sticker_pack (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE OR REPLACE TABLE tbl_user_sticker_pack (
  id CHAR(26) NOT NULL, user_id CHAR(26) NOT NULL, pack_id CHAR(26) NOT NULL, installed BOOLEAN NOT NULL DEFAULT TRUE,
  pinned BOOLEAN NOT NULL DEFAULT FALSE, `at` DATETIME(3) NOT NULL, PRIMARY KEY (id), UNIQUE KEY uk_user_sticker_pack (user_id, pack_id),
  CONSTRAINT fk_user_sticker_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_sticker_pack FOREIGN KEY (pack_id) REFERENCES sticker_pack (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
