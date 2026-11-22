-- 할 일에 선택 입력인 마감 시각을 추가한다(Q-31, 2026-11-22 사용자 결정). 기존 할 일은 NULL(시각 없음)로 그대로 둔다.
ALTER TABLE task ADD COLUMN due_time TIME NULL;
