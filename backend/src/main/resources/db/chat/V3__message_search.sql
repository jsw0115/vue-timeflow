CREATE TABLE chat_search_document (
    message_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
    normalized_body MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    FOREIGN KEY (message_id) REFERENCES chat_message(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chat_search_gram (
    gram VARCHAR(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    message_id CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    PRIMARY KEY (gram, message_id),
    KEY idx_chat_search_message (message_id),
    FOREIGN KEY (message_id) REFERENCES chat_search_document(message_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Existing messages are indexed in bounded batches by ChatSearchBackfill. This
-- keeps schema upgrades independent of the amount of historical message data.
