-- 기존 플래너 기록을 보존하면서 동시 수정 검사용 내부 버전을 추가한다.
ALTER TABLE planner_item ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
