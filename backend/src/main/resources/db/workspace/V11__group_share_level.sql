-- 공유 그룹 멤버가 그 그룹에 자기 일정을 보이는 범위(공유 안 함·바쁜 시간만·제목 포함·상세 포함)를 저장한다(PR-10).
ALTER TABLE feature_member ADD COLUMN share_level VARCHAR(10) NOT NULL DEFAULT 'none';
