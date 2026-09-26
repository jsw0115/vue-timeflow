-- 기본 스키마(timeflow)에 추가하는 events 테이블. 실행: mysql -h127.0.0.1 -P3307 -utimeflow -p timeflow < timeflow_events.sql
-- user_id는 auth_db.users.id(ULID, char(26))를 참조하는 값이므로 VARCHAR(26)로 맞춘다.

CREATE TABLE IF NOT EXISTS events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(26) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NULL,
    date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    location VARCHAR(255) NULL,
    visibility VARCHAR(20) NULL,
    note VARCHAR(1000) NULL,
    series_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY ix_events_user_date (user_id, date),
    KEY ix_events_series (series_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
