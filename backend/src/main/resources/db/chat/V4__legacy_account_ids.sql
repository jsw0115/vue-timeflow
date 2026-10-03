-- Account IDs may be legacy UUIDs (36) or new ULIDs (26). Resource IDs stay ULIDs.
ALTER TABLE chat_room DROP FOREIGN KEY fk_chat_room_owner;
ALTER TABLE chat_member DROP FOREIGN KEY fk_chat_member_user;
ALTER TABLE chat_message DROP FOREIGN KEY fk_chat_message_member;
ALTER TABLE chat_mention DROP FOREIGN KEY fk_chat_mention_member;

ALTER TABLE chat_user MODIFY user_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;
ALTER TABLE chat_room MODIFY owner_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    MODIFY direct_key VARCHAR(73) CHARACTER SET ascii COLLATE ascii_bin NULL;
ALTER TABLE chat_member MODIFY user_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;
ALTER TABLE chat_message MODIFY sender_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;
ALTER TABLE chat_mention MODIFY user_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL;

ALTER TABLE chat_room ADD CONSTRAINT fk_chat_room_owner FOREIGN KEY (owner_id) REFERENCES chat_user(user_id);
ALTER TABLE chat_member ADD CONSTRAINT fk_chat_member_user FOREIGN KEY (user_id) REFERENCES chat_user(user_id);
ALTER TABLE chat_message ADD CONSTRAINT fk_chat_message_member FOREIGN KEY (room_id, sender_id) REFERENCES chat_member(room_id, user_id);
ALTER TABLE chat_mention ADD CONSTRAINT fk_chat_mention_member FOREIGN KEY (room_id, user_id) REFERENCES chat_member(room_id, user_id);
