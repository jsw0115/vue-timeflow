-- 커뮤니티마다 채팅방 하나를 두고 커뮤니티 활성 회원과 채팅방 멤버를 맞춘다(PR-10 3b-3, Q-25). 커뮤니티 테이블은 참조하지 않는다.
ALTER TABLE chat_room ADD COLUMN community_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NULL;
ALTER TABLE chat_room ADD CONSTRAINT uk_chat_room_community UNIQUE (community_id);
ALTER TABLE chat_room ADD CONSTRAINT ck_chat_room_community CHECK (community_id IS NULL OR kind = 'GROUP');
