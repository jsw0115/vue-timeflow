-- 기존 할 일을 보존하면서 동시 수정 검사용 내부 버전을 추가한다(PR-07 1단계). 공개 버전은 저장 버전 + 1이다.
ALTER TABLE task ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
