-- 생성 요청의 멱등 키를 계정별로 저장해 로컬 자료 이전(PR-07)과 오프라인 재전송(PR-12)이 같은 기록을 두 번 만들지 않게 한다(Q-13).
CREATE TABLE IF NOT EXISTS idempotency_key (
    owner_id VARCHAR(36) NOT NULL,
    idem_key VARCHAR(100) NOT NULL,
    request_hash CHAR(64) NOT NULL,
    status_code INT NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (owner_id, idem_key),
    INDEX ix_idempotency_key_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
