-- 커뮤니티 챌린지 인증을 날짜별로 저장하고, 실제 기록으로 확인한 인증은 그 기록의 서버 시각을 함께 남긴다(PR-10 3b, Q-26).
CREATE TABLE IF NOT EXISTS challenge_checkin (
    challenge_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    check_date DATE NOT NULL,
    method VARCHAR(10) NOT NULL,
    session_id VARCHAR(100) NULL,
    session_title VARCHAR(200) NULL,
    started_at DATETIME(6) NULL,
    ended_at DATETIME(6) NULL,
    minutes INT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (challenge_id, user_id, check_date),
    UNIQUE KEY uk_challenge_checkin_session (challenge_id, user_id, session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 이전 직접 인증은 feature_member의 CHECKIN 행(space_id = 챌린지 ID + ':' + yyyy-MM-dd)에 있었다. 옮긴 뒤 지운다.
INSERT INTO challenge_checkin(challenge_id, user_id, check_date, method, created_at)
SELECT SUBSTRING(space_id, 1, CHAR_LENGTH(space_id) - 11), user_id, CAST(RIGHT(space_id, 10) AS DATE), 'self', CURRENT_TIMESTAMP(6)
FROM feature_member WHERE space_type = 'CHECKIN';
DELETE FROM feature_member WHERE space_type = 'CHECKIN';
