-- 프런트엔드 기능의 개인 기록과 소셜 관계를 영속 저장하는 테이블을 추가한다.
CREATE TABLE IF NOT EXISTS feature_record (
    owner_id VARCHAR(36) NOT NULL,
    kind VARCHAR(40) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    payload LONGTEXT NOT NULL,
    version BIGINT NOT NULL DEFAULT 1,
    created_at VARCHAR(40) NOT NULL,
    updated_at VARCHAR(40) NOT NULL,
    PRIMARY KEY (owner_id, kind, record_id),
    INDEX ix_feature_kind (kind, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feature_member (
    space_type VARCHAR(20) NOT NULL,
    space_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message VARCHAR(2000) NOT NULL DEFAULT '',
    updated_at VARCHAR(40) NOT NULL,
    PRIMARY KEY (space_type, space_id, user_id),
    INDEX ix_feature_member_user (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feature_friend (
    id VARCHAR(26) NOT NULL PRIMARY KEY,
    pair_key VARCHAR(80) NOT NULL UNIQUE,
    sender_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feature_block (
    user_id VARCHAR(36) NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (user_id, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE planner_item ADD COLUMN user_id VARCHAR(36) NULL;
CREATE INDEX ix_planner_item_user_date ON planner_item(user_id, date);

ALTER TABLE users ADD COLUMN auth_version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS feature_file (
    id VARCHAR(26) NOT NULL PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(26) NULL,
    name VARCHAR(200) NOT NULL,
    size_bytes INT NOT NULL,
    content MEDIUMBLOB NOT NULL,
    expires_at VARCHAR(40) NULL,
    created_at VARCHAR(40) NOT NULL,
    INDEX ix_feature_file_owner (owner_id, created_at),
    INDEX ix_feature_file_group (group_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
