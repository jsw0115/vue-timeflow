"""Verify an old 26-character core schema with actual rows and foreign keys."""
import json
import recovery_check as recovery

SCHEMA = 'timeflow_core_upgrade_verify_20261003'
recovery.SCHEMAS.add(SCHEMA)


def main():
    if recovery.sql(SCHEMA, "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE();") == '0':
        root = recovery.ROOT / 'backend/src/main/resources/db/chat-local-core'
        recovery.sql(SCHEMA, (root / 'V1__isolated_local_core.sql').read_text('utf-8'))
        recovery.sql(SCHEMA, (root / 'V2__align_local_jpa_types.sql').read_text('utf-8'))
        recovery.sql(SCHEMA, "INSERT INTO users(id,email,pw_hash,nick,role,st,tz,email_vfy,c_at,u_at,is_enabled) "
                            "VALUES('01J00000000000000000000001','retained@example.test','fixture-not-a-hash',"
                            "'retained','USER','ACTIVE','Asia/Seoul',FALSE,UTC_TIMESTAMP(6),UTC_TIMESTAMP(6),1);"
                            "INSERT INTO task(id,user_id,title,st,pri,energy_lvl,duration_min,is_repeat,c_at,u_at) "
                            "VALUES('01J00000000000000000000002','01J00000000000000000000001','retained-task',"
                            "'TODO','MEDIUM','MEDIUM',30,FALSE,UTC_TIMESTAMP(6),UTC_TIMESTAMP(6));")
    before = recovery.sql(SCHEMA, "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS "
                                  "WHERE CONSTRAINT_SCHEMA=DATABASE(); SELECT id,user_id,title FROM task;")
    server = recovery.Server(SCHEMA, 18085, chat=False)
    try:
        server.wait()
        after = recovery.sql(SCHEMA, "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS "
                                     "WHERE CONSTRAINT_SCHEMA=DATABASE(); SELECT id,user_id,title FROM task;")
        assert before == after, 'Foreign keys or retained task values changed'
        width = recovery.sql(SCHEMA, "SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS "
                                    "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='id';")
        assert int(width) >= 36
        assert recovery.sql(SCHEMA, "SELECT COUNT(*) FROM flyway_schema_history WHERE success=0;") == '0'
        recovery.passed('old core user/task rows and all foreign keys survive identifier widening')
        recovery.passed('JPA validate accepts the upgraded existing core schema')
    finally:
        server.stop()
    (recovery.OUTPUT / 'core-upgrade-results.json').write_text(
        json.dumps({'passed': recovery.RESULTS, 'count': len(recovery.RESULTS)}, indent=2) + '\n', 'utf-8')


if __name__ == '__main__':
    main()
