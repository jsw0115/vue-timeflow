-- Timeflow target design, MySQL 8.4 / InnoDB; empty schema only.
-- Review artifact, NOT a Flyway migration. No DROP/REPLACE or FK disabling.
-- Select a newly created empty database before sourcing this file.
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- 사용자
CREATE TABLE `tbl_users` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `pw_hash` VARCHAR(255) NOT NULL,
  `nick` VARCHAR(80) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `st` VARCHAR(20) NOT NULL,
  `tz` VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul',
  `email_vfy` BOOLEAN NOT NULL DEFAULT FALSE,
  `last_login_utc` DATETIME(6) NULL,
  `pw_chg_utc` DATETIME(6) NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `d_at` DATETIME(6) NULL,
  `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  KEY ix_users_status (st, d_at),
  CONSTRAINT ck_users_role CHECK (role IN ('USER', 'ADMIN')),
  CONSTRAINT ck_users_st CHECK (st IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  CONSTRAINT ck_users_email_vfy_bool CHECK (`email_vfy` IN (0, 1)),
  CONSTRAINT ck_users_is_enabled_bool CHECK (`is_enabled` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자';

-- 로그인 시도 제한
CREATE TABLE `tbl_login_throttle` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `key_type` VARCHAR(10) NOT NULL,
  `key_val` VARCHAR(255) NOT NULL,
  `fail_cnt` INT NOT NULL DEFAULT 0,
  `lock_utc` DATETIME(6) NULL,
  `last_fail_utc` DATETIME(6) NULL,
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_login_throttle_key (key_type, key_val),
  KEY ix_login_throttle_lock (lock_utc),
  CONSTRAINT ck_login_throttle_count CHECK (fail_cnt >= 0),
  CONSTRAINT ck_login_throttle_key_type CHECK (key_type IN ('EMAIL', 'IP'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='로그인 시도 제한';

-- 테마 카탈로그
CREATE TABLE `tbl_theme_catalog` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `ord` INT NOT NULL DEFAULT 0,
  `meta_json` JSON NULL,
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT ck_theme_catalog_enabled_bool CHECK (`enabled` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='테마 카탈로그';

-- 스티커 팩
CREATE TABLE `tbl_sticker_pack` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `code` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `ord` INT NOT NULL DEFAULT 0,
  `meta_json` JSON NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_sticker_pack_code (code),
  CONSTRAINT ck_sticker_pack_enabled_bool CHECK (`enabled` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='스티커 팩';

-- 개인 카테고리
CREATE TABLE `tbl_category` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `parent_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `name` VARCHAR(60) NOT NULL,
  `color` CHAR(7) NOT NULL DEFAULT '#64748b',
  `icon` VARCHAR(16) NULL,
  `ord` INT NOT NULL DEFAULT 0,
  `scope` VARCHAR(12) NOT NULL DEFAULT 'ALL',
  `is_pinned` BOOLEAN NOT NULL DEFAULT FALSE,
  `st` VARCHAR(12) NOT NULL DEFAULT 'ACTIVE',
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `d_at` DATETIME(6) NULL,
  `d_by` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_category_user_name (user_id, name),
  KEY ix_category_parent (user_id, parent_id),
  KEY ix_category_state (user_id, st),
  CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  UNIQUE KEY uk_category_owner_id (user_id, id),
  CONSTRAINT fk_category_parent FOREIGN KEY (user_id, parent_id) REFERENCES tbl_category (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_category_deleted_by FOREIGN KEY (d_by) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_category_parent CHECK (parent_id IS NULL OR parent_id <> id),
  CONSTRAINT ck_category_order CHECK (ord >= 0),
  CONSTRAINT ck_category_scope CHECK (scope IN ('ALL', 'EVENT', 'TASK', 'ROUTINE', 'ACTUAL')),
  CONSTRAINT ck_category_st CHECK (st IN ('ACTIVE', 'ARCHIVED')),
  CONSTRAINT ck_category_is_pinned_bool CHECK (`is_pinned` IN (0, 1)),
  KEY ix_category_fk_deleted_by (d_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='개인 카테고리';

-- 사용자 환경설정
CREATE TABLE `tbl_user_pref` (
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `start_scr` VARCHAR(32) NOT NULL DEFAULT 'home',
  `date_fmt` VARCHAR(32) NOT NULL DEFAULT 'YYYY-MM-DD',
  `time_fmt` VARCHAR(3) NOT NULL DEFAULT '24h',
  `theme_id` VARCHAR(64) NOT NULL DEFAULT 'default',
  `push_on` BOOLEAN NOT NULL DEFAULT TRUE,
  `email_on` BOOLEAN NOT NULL DEFAULT FALSE,
  `inapp_on` BOOLEAN NOT NULL DEFAULT TRUE,
  `dnd_s` TIME NULL,
  `dnd_e` TIME NULL,
  `week_start` VARCHAR(3) NOT NULL DEFAULT 'MON',
  `locale` VARCHAR(16) NOT NULL DEFAULT 'ko-KR',
  `time_step_min` INT NOT NULL DEFAULT 10,
  `def_event_vis` VARCHAR(12) NOT NULL DEFAULT 'PRIVATE',
  `def_event_all_day` BOOLEAN NOT NULL DEFAULT TRUE,
  `def_event_dur_min` INT NOT NULL DEFAULT 60,
  `def_reminder_min` INT NULL,
  `overlap_warn_on` BOOLEAN NOT NULL DEFAULT TRUE,
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_pref_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_user_pref_theme FOREIGN KEY (theme_id) REFERENCES tbl_theme_catalog (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_user_pref_dnd CHECK ((dnd_s IS NULL AND dnd_e IS NULL) OR (dnd_s IS NOT NULL AND dnd_e IS NOT NULL AND dnd_s >= '00:00:00' AND dnd_s < '24:00:00' AND dnd_e >= '00:00:00' AND dnd_e < '24:00:00')),
  CONSTRAINT ck_user_pref_duration CHECK (time_step_min > 0 AND def_event_dur_min > 0 AND (def_reminder_min IS NULL OR def_reminder_min >= 0)),
  CONSTRAINT ck_user_pref_time_fmt CHECK (time_fmt IN ('12h', '24h')),
  CONSTRAINT ck_user_pref_week_start CHECK (week_start IN ('MON', 'SUN')),
  CONSTRAINT ck_user_pref_def_event_vis CHECK (def_event_vis IN ('PRIVATE', 'FRIENDS', 'SHARED', 'PUBLIC')),
  CONSTRAINT ck_user_pref_push_on_bool CHECK (`push_on` IN (0, 1)),
  CONSTRAINT ck_user_pref_email_on_bool CHECK (`email_on` IN (0, 1)),
  CONSTRAINT ck_user_pref_inapp_on_bool CHECK (`inapp_on` IN (0, 1)),
  CONSTRAINT ck_user_pref_def_event_all_day_bool CHECK (`def_event_all_day` IN (0, 1)),
  CONSTRAINT ck_user_pref_overlap_warn_on_bool CHECK (`overlap_warn_on` IN (0, 1)),
  KEY ix_user_pref_fk_theme (theme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 환경설정';

-- 대시보드 배치
CREATE TABLE `tbl_dash_layout` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `scope` VARCHAR(12) NOT NULL DEFAULT 'all',
  `bp` VARCHAR(16) NOT NULL DEFAULT 'default',
  `json` JSON NOT NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_dash_layout (user_id, scope, bp),
  CONSTRAINT fk_dash_layout_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='대시보드 배치';

-- 대시보드 위젯 설정
CREATE TABLE `tbl_dash_portlet_pref` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `portlet_id` VARCHAR(64) NOT NULL,
  `vis` BOOLEAN NOT NULL DEFAULT TRUE,
  `ord` INT NOT NULL DEFAULT 0,
  `cfg_json` JSON NULL,
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_dash_portlet (user_id, portlet_id),
  CONSTRAINT fk_dash_portlet_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_dash_portlet_pref_vis_bool CHECK (`vis` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='대시보드 위젯 설정';

-- 알림 유형 설정
CREATE TABLE `tbl_notif_pref` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `evt` VARCHAR(64) NOT NULL,
  `push_on` BOOLEAN NOT NULL DEFAULT TRUE,
  `email_on` BOOLEAN NOT NULL DEFAULT FALSE,
  `inapp_on` BOOLEAN NOT NULL DEFAULT TRUE,
  `cfg_json` JSON NULL,
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_notif_pref (user_id, evt),
  CONSTRAINT fk_notif_pref_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_notif_pref_push_on_bool CHECK (`push_on` IN (0, 1)),
  CONSTRAINT ck_notif_pref_email_on_bool CHECK (`email_on` IN (0, 1)),
  CONSTRAINT ck_notif_pref_inapp_on_bool CHECK (`inapp_on` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='알림 유형 설정';

-- 사용자 기기
CREATE TABLE `tbl_user_device` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `device_id` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `platform` VARCHAR(10) NOT NULL DEFAULT 'WEB',
  `push_tok` VARCHAR(512) NULL,
  `app_ver` VARCHAR(32) NULL,
  `last_seen_utc` DATETIME(6) NULL,
  `revoked_utc` DATETIME(6) NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_device (user_id, device_id),
  CONSTRAINT fk_user_device_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_user_device_platform CHECK (platform IN ('WEB', 'IOS', 'ANDROID'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 기기';

-- 데이터 파일
CREATE TABLE `tbl_data_file` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `kind` VARCHAR(10) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `mime` VARCHAR(100) NULL,
  `size_b` BIGINT NOT NULL DEFAULT 0,
  `sha256` CHAR(64) NULL,
  `storage_key` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `exp_utc` DATETIME(6) NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_data_file_user_kind (user_id, kind),
  CONSTRAINT fk_data_file_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  UNIQUE KEY uk_data_file_owner_id (user_id, id),
  CONSTRAINT ck_data_file_size CHECK (size_b >= 0),
  KEY ix_data_file_expiry (exp_utc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='데이터 파일';

-- 가져오기 매핑 프로필
CREATE TABLE `tbl_import_mapping_profile` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `src_typ` VARCHAR(8) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `map_json` JSON NOT NULL,
  `rule_json` JSON NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_import_mapping_user (user_id, src_typ),
  CONSTRAINT fk_import_mapping_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  UNIQUE KEY uk_import_mapping_profile_name (user_id, src_typ, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='가져오기 매핑 프로필';

-- 외부 캘린더 계정
CREATE TABLE `tbl_ext_cal_account` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `provider` VARCHAR(10) NOT NULL,
  `st` VARCHAR(12) NOT NULL DEFAULT 'CONNECTED',
  `scopes` VARCHAR(500) NULL,
  `meta_json` JSON NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `external_subject` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_ext_cal_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  UNIQUE KEY uk_ext_cal_account_identity (user_id, provider, external_subject),
  UNIQUE KEY uk_ext_cal_account_owner_id (user_id, id),
  CONSTRAINT ck_ext_cal_account_st CHECK (st IN ('CONNECTED', 'DISCONNECTED', 'ERROR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='외부 캘린더 계정';

-- 고객 문의
CREATE TABLE `tbl_support_ticket` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `typ` VARCHAR(16) NOT NULL DEFAULT 'OTHER',
  `st` VARCHAR(16) NOT NULL DEFAULT 'OPEN',
  `title` VARCHAR(200) NOT NULL,
  `body` LONGTEXT NOT NULL,
  `meta_json` JSON NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_support_ticket_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  KEY ix_support_ticket_state_time (st, c_at, id),
  KEY ix_support_ticket_fk_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='고객 문의';

-- 설정 변경 감사 기록
CREATE TABLE `tbl_settings_audit_log` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `area` VARCHAR(32) NOT NULL,
  `action` VARCHAR(32) NOT NULL,
  `diff_json` JSON NULL,
  `at_utc` DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_settings_audit_user_time (user_id, at_utc),
  CONSTRAINT fk_settings_audit_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='설정 변경 감사 기록';

-- 메모
CREATE TABLE `tbl_memo` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `typ` VARCHAR(8) NOT NULL DEFAULT 'text',
  `title` VARCHAR(200) NULL,
  `body` LONGTEXT NULL,
  `stt` LONGTEXT NULL,
  `st` VARCHAR(10) NOT NULL DEFAULT 'inbox',
  `tags` VARCHAR(500) NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `d_at` DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY ix_memo_user_state (user_id, st),
  CONSTRAINT fk_memo_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='메모';

-- 다이어리
CREATE TABLE `tbl_diary` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `dt` DATE NOT NULL,
  `mood` VARCHAR(10) NOT NULL DEFAULT 'good',
  `sumry` TEXT NULL,
  `body` TEXT NULL,
  `grat` TEXT NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_diary_user_date (user_id, dt),
  CONSTRAINT fk_diary_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='다이어리';

-- 친구 관계
CREATE TABLE `tbl_friend` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `a_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `b_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `st` VARCHAR(10) NOT NULL DEFAULT 'pending',
  `req_by` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_friend_pair (a_id, b_id),
  CONSTRAINT fk_friend_a FOREIGN KEY (a_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_friend_b FOREIGN KEY (b_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_friend_requester FOREIGN KEY (req_by) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_friend_pair CHECK (a_id < b_id AND req_by IN (a_id, b_id)),
  KEY ix_friend_a_state (a_id, st),
  KEY ix_friend_b_state (b_id, st),
  CONSTRAINT ck_friend_st CHECK (st IN ('pending', 'accepted', 'rejected', 'blocked')),
  KEY ix_friend_fk_requester (req_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='친구 관계';

-- 캘린더 그룹
CREATE TABLE `tbl_cal_group` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `owner_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `note` VARCHAR(255) NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_cal_group_owner FOREIGN KEY (owner_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  KEY ix_cal_group_fk_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='캘린더 그룹';

-- 스티커 항목
CREATE TABLE `tbl_sticker_item` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `pack_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `code` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `label` VARCHAR(80) NULL,
  `asset_url` VARCHAR(512) NOT NULL,
  `ord` INT NOT NULL DEFAULT 0,
  `meta_json` JSON NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sticker_item (pack_id, code),
  CONSTRAINT fk_sticker_item_pack FOREIGN KEY (pack_id) REFERENCES tbl_sticker_pack (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='스티커 항목';

-- 사용자 스티커 팩
CREATE TABLE `tbl_user_sticker_pack` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `pack_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `installed` BOOLEAN NOT NULL DEFAULT TRUE,
  `pinned` BOOLEAN NOT NULL DEFAULT FALSE,
  `at` DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_sticker_pack (user_id, pack_id),
  CONSTRAINT fk_user_sticker_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_user_sticker_pack FOREIGN KEY (pack_id) REFERENCES tbl_sticker_pack (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_user_sticker_pack_installed_bool CHECK (`installed` IN (0, 1)),
  CONSTRAINT ck_user_sticker_pack_pinned_bool CHECK (`pinned` IN (0, 1)),
  KEY ix_user_sticker_pack_fk_fk_user_sticker_pack (pack_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 스티커 팩';

-- 반복 일정 시리즈
CREATE TABLE `tbl_event_series` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `rrule` VARCHAR(1000) NULL,
  `tz` VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul',
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_event_series_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  UNIQUE KEY uk_event_series_owner_id (user_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='반복 일정 시리즈';

-- 갱신 토큰
CREATE TABLE `tbl_refresh_token` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `device_id` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `tok_hash` CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `jti` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `exp_utc` DATETIME(6) NOT NULL,
  `rev_utc` DATETIME(6) NULL,
  `last_used_utc` DATETIME(6) NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_refresh_token_hash (tok_hash),
  KEY ix_refresh_token_user (user_id, rev_utc, exp_utc),
  CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  UNIQUE KEY uk_refresh_token_jti (jti),
  CONSTRAINT fk_refresh_token_device FOREIGN KEY (user_id, device_id) REFERENCES tbl_user_device (user_id, device_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_refresh_token_expiry CHECK (exp_utc > c_at),
  KEY ix_refresh_token_expiry (exp_utc),
  KEY ix_refresh_token_fk_device (user_id, device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='갱신 토큰';

-- 일정 회차
CREATE TABLE `tbl_events` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NULL,
  `visibility` VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
  `note` VARCHAR(255) NULL,
  `series_id` BIGINT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `cat_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `all_day` BOOLEAN NOT NULL DEFAULT FALSE,
  `start_utc` DATETIME(6) NULL,
  `end_utc` DATETIME(6) NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `tz` VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul',
  `d_at` DATETIME(6) NULL,
  `row_version` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  UNIQUE KEY uk_events_owner_id (user_id, id),
  CONSTRAINT fk_events_series FOREIGN KEY (user_id, series_id) REFERENCES tbl_event_series (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_events_category FOREIGN KEY (user_id, cat_id) REFERENCES tbl_category (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_events_range CHECK ((all_day = 0 AND start_utc IS NOT NULL AND end_utc IS NOT NULL AND end_utc > start_utc AND start_date IS NULL AND end_date IS NULL) OR (all_day = 1 AND start_date IS NOT NULL AND end_date IS NOT NULL AND end_date > start_date AND start_utc IS NULL AND end_utc IS NULL)),
  CONSTRAINT ck_events_version CHECK (row_version >= 0),
  KEY ix_events_user_time (user_id, d_at, start_utc, id),
  KEY ix_events_user_day (user_id, d_at, start_date, id),
  KEY ix_events_series_time (series_id, start_utc),
  KEY ix_events_series_day (series_id, start_date),
  CONSTRAINT ck_events_visibility CHECK (visibility IN ('PRIVATE', 'FRIENDS', 'SHARED', 'PUBLIC')),
  CONSTRAINT ck_events_all_day_bool CHECK (`all_day` IN (0, 1)),
  KEY ix_events_fk_series (user_id, series_id),
  KEY ix_events_fk_category (user_id, cat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='일정 회차';

-- 루틴
CREATE TABLE `tbl_routine` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `icon` VARCHAR(16) NULL,
  `cat_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `at_time` TIME NOT NULL,
  `onoff` BOOLEAN NOT NULL DEFAULT TRUE,
  `notify` BOOLEAN NOT NULL DEFAULT FALSE,
  `n_min` INT NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `d_at` DATETIME(6) NULL,
  `tz` VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul',
  PRIMARY KEY (id),
  KEY ix_routine_user_time (user_id, onoff, at_time),
  CONSTRAINT fk_routine_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_routine_category FOREIGN KEY (user_id, cat_id) REFERENCES tbl_category (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_routine_clock CHECK (at_time >= '00:00:00' AND at_time < '24:00:00'),
  CONSTRAINT ck_routine_reminder CHECK (n_min IS NULL OR n_min >= 0),
  CONSTRAINT ck_routine_onoff_bool CHECK (`onoff` IN (0, 1)),
  CONSTRAINT ck_routine_notify_bool CHECK (`notify` IN (0, 1)),
  KEY ix_routine_fk_category (user_id, cat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='루틴';

-- 플래너 수동 항목
CREATE TABLE `tbl_planner_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(20) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `date` DATE NULL,
  `start_time` TIME NULL,
  `end_time` TIME NULL,
  `status` VARCHAR(20) NULL,
  `dday` BOOLEAN NOT NULL DEFAULT FALSE,
  `note` VARCHAR(255) NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `cat_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_planner_item_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_planner_item_category FOREIGN KEY (user_id, cat_id) REFERENCES tbl_category (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  KEY ix_planner_item_user_date_type (user_id, date, type),
  CONSTRAINT ck_planner_item_time CHECK ((start_time IS NULL AND end_time IS NULL) OR (date IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time >= '00:00:00' AND end_time < '24:00:00' AND end_time > start_time)),
  CONSTRAINT ck_planner_item_dday_bool CHECK (`dday` IN (0, 1)),
  KEY ix_planner_item_fk_category (user_id, cat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플래너 수동 항목';

-- 가져오기·내보내기 작업
CREATE TABLE `tbl_data_job` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `typ` VARCHAR(10) NOT NULL,
  `fmt` VARCHAR(8) NOT NULL,
  `st` VARCHAR(10) NOT NULL DEFAULT 'PENDING',
  `params_json` JSON NULL,
  `result_file_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `err_msg` VARCHAR(500) NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `s_utc` DATETIME(6) NULL,
  `e_utc` DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY ix_data_job_user_state (user_id, st),
  CONSTRAINT fk_data_job_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_data_job_result FOREIGN KEY (user_id, result_file_id) REFERENCES tbl_data_file (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_data_job_time CHECK ((s_utc IS NULL OR s_utc >= c_at) AND (e_utc IS NULL OR (s_utc IS NOT NULL AND e_utc >= s_utc))),
  KEY ix_data_job_queue (st, c_at, id),
  CONSTRAINT ck_data_job_typ CHECK (typ IN ('IMPORT', 'EXPORT')),
  CONSTRAINT ck_data_job_fmt CHECK (fmt IN ('CSV', 'JSON', 'ICS', 'XLSX')),
  CONSTRAINT ck_data_job_st CHECK (st IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED')),
  KEY ix_data_job_fk_result (user_id, result_file_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='가져오기·내보내기 작업';

-- 동기화 실행 기록
CREATE TABLE `tbl_sync_run_log` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `st` VARCHAR(10) NOT NULL,
  `started_utc` DATETIME(6) NOT NULL,
  `ended_utc` DATETIME(6) NULL,
  `pulled_cnt` INT NOT NULL DEFAULT 0,
  `pushed_cnt` INT NOT NULL DEFAULT 0,
  `conflict_cnt` INT NOT NULL DEFAULT 0,
  `err_msg` VARCHAR(500) NULL,
  `meta_json` JSON NULL,
  `account_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (id),
  KEY ix_sync_run_user_time (user_id, started_utc),
  CONSTRAINT fk_sync_run_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_sync_run_log_account FOREIGN KEY (user_id, account_id) REFERENCES tbl_ext_cal_account (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_sync_run_log_time CHECK (ended_utc IS NULL OR ended_utc >= started_utc),
  CONSTRAINT ck_sync_run_log_counts CHECK (pulled_cnt >= 0 AND pushed_cnt >= 0 AND conflict_cnt >= 0),
  KEY ix_sync_run_log_account_time (account_id, started_utc),
  CONSTRAINT ck_sync_run_log_st CHECK (st IN ('RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL')),
  KEY ix_sync_run_log_fk_account (user_id, account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='동기화 실행 기록';

-- 캘린더 그룹 멤버
CREATE TABLE `tbl_cal_group_mem` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `gid` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `role` VARCHAR(10) NOT NULL DEFAULT 'member',
  `at` DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cal_group_member (gid, user_id),
  KEY ix_cal_group_member_user (user_id),
  CONSTRAINT fk_cal_group_mem_group FOREIGN KEY (gid) REFERENCES tbl_cal_group (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_cal_group_mem_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_cal_group_mem_role CHECK (role IN ('member', 'editor', 'admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='캘린더 그룹 멤버';

-- 할 일
CREATE TABLE `tbl_task` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `note` TEXT NULL,
  `st` VARCHAR(20) NOT NULL,
  `pri` VARCHAR(20) NOT NULL,
  `energy_lvl` VARCHAR(20) NOT NULL,
  `duration_min` INT NOT NULL DEFAULT 30,
  `due` DATE NULL,
  `cat_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `event_id` BIGINT NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `d_at` DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY ix_task_user_due (user_id, due, c_at),
  KEY ix_task_user_status (user_id, st, d_at),
  CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_task_category FOREIGN KEY (user_id, cat_id) REFERENCES tbl_category (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_task_event FOREIGN KEY (user_id, event_id) REFERENCES tbl_events (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_task_duration CHECK (duration_min > 0),
  CONSTRAINT ck_task_st CHECK (st IN ('TODO', 'DOING', 'DONE', 'CANCELED')),
  CONSTRAINT ck_task_pri CHECK (pri IN ('LOW', 'MEDIUM', 'HIGH')),
  CONSTRAINT ck_task_energy_lvl CHECK (energy_lvl IN ('LOW', 'MEDIUM', 'HIGH')),
  KEY ix_task_fk_category (user_id, cat_id),
  KEY ix_task_fk_event (user_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='할 일';

-- 루틴 실행 기록
CREATE TABLE `tbl_routine_log` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `routine_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `dt` DATE NOT NULL,
  `st` VARCHAR(10) NOT NULL,
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_routine_log_date (routine_id, dt),
  KEY ix_routine_log_date (dt),
  CONSTRAINT fk_routine_log_routine FOREIGN KEY (routine_id) REFERENCES tbl_routine (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_routine_log_st CHECK (st IN ('done', 'missed', 'skip'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='루틴 실행 기록';

-- 일정 편집 정책
CREATE TABLE `tbl_event_policy` (
  `event_id` BIGINT NOT NULL,
  `editor_del` BOOLEAN NOT NULL DEFAULT FALSE,
  `def_edit_sc` VARCHAR(8) NOT NULL DEFAULT 'future',
  `def_del_sc` VARCHAR(8) NOT NULL DEFAULT 'none',
  `max_edit_sc` VARCHAR(8) NOT NULL DEFAULT 'future',
  `max_del_sc` VARCHAR(8) NOT NULL DEFAULT 'future',
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (event_id),
  CONSTRAINT fk_event_policy_event FOREIGN KEY (event_id) REFERENCES tbl_events (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_event_policy_def_edit_sc CHECK (def_edit_sc IN ('none', 'single', 'future', 'all')),
  CONSTRAINT ck_event_policy_def_del_sc CHECK (def_del_sc IN ('none', 'single', 'future', 'all')),
  CONSTRAINT ck_event_policy_max_edit_sc CHECK (max_edit_sc IN ('none', 'single', 'future', 'all')),
  CONSTRAINT ck_event_policy_max_del_sc CHECK (max_del_sc IN ('none', 'single', 'future', 'all')),
  CONSTRAINT ck_event_policy_editor_del_bool CHECK (`editor_del` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='일정 편집 정책';

-- 일정 공유
CREATE TABLE `tbl_event_share` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `event_id` BIGINT NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `role` VARCHAR(8) NOT NULL,
  `edit_sc` VARCHAR(8) NOT NULL DEFAULT 'single',
  `del_sc` VARCHAR(8) NOT NULL DEFAULT 'none',
  `by_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `at` DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_share (event_id, user_id),
  KEY ix_event_share_user (user_id),
  CONSTRAINT fk_event_share_event FOREIGN KEY (event_id) REFERENCES tbl_events (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_event_share_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_event_share_actor FOREIGN KEY (by_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_event_share_role CHECK (role IN ('viewer', 'editor')),
  CONSTRAINT ck_event_share_edit_sc CHECK (edit_sc IN ('none', 'single', 'future', 'all')),
  CONSTRAINT ck_event_share_del_sc CHECK (del_sc IN ('none', 'single', 'future', 'all')),
  KEY ix_event_share_fk_actor (by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='일정 공유';

-- 일정 회차 예외
CREATE TABLE `tbl_event_ex` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `event_id` BIGINT NOT NULL,
  `occ_start` DATETIME(6) NOT NULL,
  `cancel` BOOLEAN NOT NULL DEFAULT FALSE,
  `o_title` VARCHAR(200) NULL,
  `o_note` TEXT NULL,
  `o_loc` VARCHAR(255) NULL,
  `o_start_utc` DATETIME(6) NULL,
  `o_end_utc` DATETIME(6) NULL,
  `o_all_day` BOOLEAN NULL,
  `o_tz` VARCHAR(64) NULL,
  `o_cat_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `by_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `o_start_date` DATE NULL,
  `o_end_date` DATE NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_event_ex_actor FOREIGN KEY (by_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_event_ex_event FOREIGN KEY (user_id, event_id) REFERENCES tbl_events (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_event_ex_category FOREIGN KEY (user_id, o_cat_id) REFERENCES tbl_category (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  UNIQUE KEY uk_event_ex_occurrence (event_id),
  CONSTRAINT ck_event_ex_range CHECK ((o_start_utc IS NULL AND o_end_utc IS NULL AND o_start_date IS NULL AND o_end_date IS NULL AND o_all_day IS NULL) OR (o_all_day IS NOT NULL AND o_all_day = 0 AND o_start_utc IS NOT NULL AND o_end_utc IS NOT NULL AND o_end_utc > o_start_utc AND o_start_date IS NULL AND o_end_date IS NULL) OR (o_all_day IS NOT NULL AND o_all_day = 1 AND o_start_date IS NOT NULL AND o_end_date IS NOT NULL AND o_end_date > o_start_date AND o_start_utc IS NULL AND o_end_utc IS NULL)),
  CONSTRAINT ck_event_ex_cancel_bool CHECK (`cancel` IN (0, 1)),
  CONSTRAINT ck_event_ex_o_all_day_bool CHECK (`o_all_day` IN (0, 1)),
  KEY ix_event_ex_fk_actor (by_id),
  KEY ix_event_ex_fk_event (user_id, event_id),
  KEY ix_event_ex_fk_category (user_id, o_cat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='일정 회차 예외';

-- 일정 변경 버전
CREATE TABLE `tbl_event_ver` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `event_id` BIGINT NOT NULL,
  `ver_no` INT NOT NULL,
  `at` DATETIME(6) NOT NULL,
  `by_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `summary` VARCHAR(255) NULL,
  `snap` JSON NOT NULL,
  `diff` JSON NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_version (event_id, ver_no),
  CONSTRAINT fk_event_ver_event FOREIGN KEY (event_id) REFERENCES tbl_events (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_event_ver_actor FOREIGN KEY (by_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_event_ver_number CHECK (ver_no > 0),
  KEY ix_event_ver_fk_actor (by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='일정 변경 버전';

-- 실제 시간 기록
CREATE TABLE `tbl_time_entry` (
  `id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `typ` VARCHAR(8) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `start_utc` DATETIME(6) NOT NULL,
  `end_utc` DATETIME(6) NOT NULL,
  `tz` VARCHAR(64) NOT NULL,
  `cat_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL,
  `event_id` BIGINT NULL,
  `memo` TEXT NULL,
  `c_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `u_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `d_at` DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY ix_time_entry_user_time (user_id, start_utc, end_utc),
  KEY ix_time_entry_kind (user_id, typ, start_utc),
  CONSTRAINT fk_time_entry_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_time_entry_category FOREIGN KEY (user_id, cat_id) REFERENCES tbl_category (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_time_entry_event FOREIGN KEY (user_id, event_id) REFERENCES tbl_events (user_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_time_entry_range CHECK (end_utc > start_utc),
  KEY ix_time_entry_fk_category (user_id, cat_id),
  KEY ix_time_entry_fk_event (user_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='실제 시간 기록';

-- 루틴 반복 요일
CREATE TABLE `tbl_routine_weekday` (
  `routine_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `weekday` TINYINT NOT NULL,
  PRIMARY KEY (routine_id, weekday),
  CONSTRAINT fk_routine_weekday_routine FOREIGN KEY (routine_id) REFERENCES tbl_routine (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_routine_weekday_day CHECK (weekday BETWEEN 1 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='루틴 반복 요일';

-- 할 일 참여자
CREATE TABLE `tbl_task_member` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `task_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `joined_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_task_member (task_id, user_id),
  KEY ix_task_member_user (user_id),
  CONSTRAINT fk_task_member_task FOREIGN KEY (task_id) REFERENCES tbl_task (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_task_member_user FOREIGN KEY (user_id) REFERENCES tbl_users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='할 일 참여자';

-- 할 일 반복 규칙
CREATE TABLE `tbl_task_repeat_rule` (
  `task_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `freq` VARCHAR(10) NOT NULL DEFAULT 'DAILY',
  `interval_val` INT NOT NULL DEFAULT 1,
  `end_type` VARCHAR(8) NOT NULL DEFAULT 'NONE',
  `end_until` DATE NULL,
  `tz` VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul',
  PRIMARY KEY (task_id),
  CONSTRAINT fk_task_repeat_task FOREIGN KEY (task_id) REFERENCES tbl_task (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_task_repeat_rule_interval CHECK (interval_val > 0),
  CONSTRAINT ck_task_repeat_rule_end CHECK ((end_type = 'NONE' AND end_until IS NULL) OR (end_type = 'UNTIL' AND end_until IS NOT NULL)),
  CONSTRAINT ck_task_repeat_rule_freq CHECK (freq IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='할 일 반복 규칙';

-- 할 일 반복 요일
CREATE TABLE `tbl_task_repeat_weekday` (
  `task_id` CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `weekday` TINYINT NOT NULL,
  PRIMARY KEY (task_id, weekday),
  CONSTRAINT fk_task_repeat_weekday_rule FOREIGN KEY (task_id) REFERENCES tbl_task_repeat_rule (task_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_task_repeat_weekday_day CHECK (weekday BETWEEN 1 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='할 일 반복 요일';

-- Required reference data for tbl_user_pref.theme_id DEFAULT 'default'.
INSERT INTO tbl_theme_catalog (id, name) VALUES ('default', '기본 테마');
