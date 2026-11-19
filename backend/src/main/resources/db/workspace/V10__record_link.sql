-- 할 일·일정·실제 기록 사이의 연결을 계정별로 저장해 원본에서 만든 기록을 오갈 수 있게 한다(PR-08, Q-12).
CREATE TABLE IF NOT EXISTS record_link (
    owner_id VARCHAR(36) NOT NULL,
    source_kind VARCHAR(20) NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    target_kind VARCHAR(20) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (owner_id, source_kind, source_id, target_kind, target_id),
    INDEX ix_record_link_target (owner_id, target_kind, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
