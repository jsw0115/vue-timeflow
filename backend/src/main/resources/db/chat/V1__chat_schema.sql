-- Chat owns these tables. Core users are validated through the identity adapter.
CREATE TABLE chat_user (
  user_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  nickname VARCHAR(80) NOT NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_room (
  id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  kind VARCHAR(8) NOT NULL,
  name VARCHAR(80) NULL,
  owner_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  direct_key VARCHAR(53) CHARACTER SET ascii COLLATE ascii_bin NULL,
  last_sequence BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_chat_direct (direct_key),
  KEY ix_chat_room_owner (owner_id),
  CONSTRAINT fk_chat_room_owner FOREIGN KEY (owner_id) REFERENCES chat_user(user_id),
  CONSTRAINT ck_chat_room_kind CHECK ((kind = 'DM' AND direct_key IS NOT NULL) OR (kind = 'GROUP' AND direct_key IS NULL AND name IS NOT NULL)),
  CONSTRAINT ck_chat_room_sequence CHECK (last_sequence >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_member (
  room_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  last_read_sequence BIGINT NOT NULL DEFAULT 0,
  joined_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  left_at DATETIME(6) NULL,
  PRIMARY KEY (room_id, user_id),
  KEY ix_chat_member_user (user_id, left_at, room_id),
  CONSTRAINT fk_chat_member_room FOREIGN KEY (room_id) REFERENCES chat_room(id),
  CONSTRAINT fk_chat_member_user FOREIGN KEY (user_id) REFERENCES chat_user(user_id),
  CONSTRAINT ck_chat_member_read CHECK (last_read_sequence >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_message (
  id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  room_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  sequence_no BIGINT NOT NULL,
  sender_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  client_message_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  body VARCHAR(4000) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_chat_message_sequence (room_id, sequence_no),
  UNIQUE KEY uk_chat_message_retry (room_id, sender_id, client_message_id),
  CONSTRAINT fk_chat_message_member FOREIGN KEY (room_id, sender_id) REFERENCES chat_member(room_id, user_id),
  CONSTRAINT ck_chat_message_sequence CHECK (sequence_no > 0),
  CONSTRAINT ck_chat_message_body CHECK (CHAR_LENGTH(TRIM(body)) BETWEEN 1 AND 4000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_outbox (
  id BIGINT NOT NULL AUTO_INCREMENT,
  room_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  event_type VARCHAR(16) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  available_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  published_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_chat_outbox_pending (published_at, available_at, id),
  KEY ix_chat_outbox_room (room_id),
  CONSTRAINT fk_chat_outbox_room FOREIGN KEY (room_id) REFERENCES chat_room(id),
  CONSTRAINT ck_chat_outbox_attempts CHECK (attempts >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
