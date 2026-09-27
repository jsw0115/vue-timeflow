-- Development bootstrap only: align string/integer JDBC types with current entities.
ALTER TABLE refresh_token MODIFY jti VARCHAR(36) NULL;
ALTER TABLE task MODIFY cat_color VARCHAR(7) NULL;
ALTER TABLE routine MODIFY cat_color VARCHAR(7) NULL, MODIFY at_time VARCHAR(5) NOT NULL;
ALTER TABLE users MODIFY is_enabled INT NULL DEFAULT 1;
