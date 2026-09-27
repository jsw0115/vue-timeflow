-- Normalized, durable mentions and hashtags. Never store these only in Redis.
ALTER TABLE chat_message ADD UNIQUE KEY uk_chat_message_room_id (room_id, id);
CREATE TABLE chat_mention (
  room_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  message_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  read_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (message_id, user_id),
  KEY ix_chat_mention_inbox (user_id, read_at, message_id),
  KEY ix_chat_mention_message (room_id, message_id),
  KEY ix_chat_mention_member (room_id, user_id),
  CONSTRAINT fk_chat_mention_message FOREIGN KEY (room_id, message_id) REFERENCES chat_message(room_id, id),
  CONSTRAINT fk_chat_mention_member FOREIGN KEY (room_id, user_id) REFERENCES chat_member(room_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE chat_tag (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_chat_tag_name (name),
  CONSTRAINT ck_chat_tag_name CHECK (CHAR_LENGTH(name) BETWEEN 1 AND 32)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE chat_message_tag (
  message_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (message_id, tag_id),
  KEY ix_chat_message_tag_filter (tag_id, message_id),
  CONSTRAINT fk_chat_message_tag_message FOREIGN KEY (message_id) REFERENCES chat_message(id),
  CONSTRAINT fk_chat_message_tag_tag FOREIGN KEY (tag_id) REFERENCES chat_tag(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
