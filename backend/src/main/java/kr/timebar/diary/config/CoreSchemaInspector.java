package kr.timebar.diary.config;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class CoreSchemaInspector {

    private static final Map<String, Set<String>> REQUIRED_COLUMNS = Map.ofEntries(
            Map.entry("users", columns("id,email,pw_hash,nick,role,st,tz,email_vfy,last_login_utc,pw_chg_utc,c_at,u_at,d_at,is_enabled")),
            Map.entry("refresh_token", columns("id,user_id,device_id,tok_hash,jti,exp_utc,rev_utc,last_used_utc,c_at")),
            Map.entry("login_throttle", columns("id,key_type,key_val,fail_cnt,lock_utc,last_fail_utc,u_at")),
            Map.entry("events", columns("id,user_id,title,category,date,start_time,end_time,location,visibility,note,series_id,created_at,updated_at")),
            Map.entry("task", columns("id,user_id,title,note,st,pri,energy_lvl,duration_min,due,cat_id,cat_name,cat_color,cat_icon,event_id,is_repeat,c_at,u_at,d_at")),
            Map.entry("routine", columns("id,user_id,name,icon,cat_id,cat_name,cat_color,cat_icon,at_time,days,onoff,notify,n_min,c_at,u_at,d_at")),
            Map.entry("routine_log", columns("id,routine_id,dt,st,u_at")),
            Map.entry("planner_item", columns("id,type,title,category,date,start_time,end_time,status,dday,note,created_at,updated_at")),
            Map.entry("task_assignee", columns("id,task_id,user_id")),
            Map.entry("task_checklist_item", columns("id,task_id,title,completed,assignee_id,version,created_at,updated_at")),
            Map.entry("planner_preference", columns("user_id,default_view,version,created_at,updated_at")));

    public boolean requiresBaseline(DataSource dataSource, String historyTable, String expectedSchema)
            throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            String schema = connection.getCatalog();
            Set<String> tables = tableNames(connection, schema);
            if (tables.contains(historyTable.toLowerCase(Locale.ROOT))) {
                return false;
            }
            if (!expectedSchema.equals(schema)) {
                throw new IllegalStateException("미관리 DB의 schema가 DB_SCHEMA와 다릅니다. 자동 baseline을 중단합니다.");
            }
            for (String table : tables) {
                inspectTable(connection, schema, table);
            }
            return true;
        }
    }

    private void inspectTable(Connection connection, String schema, String table) throws SQLException {
        if (table.equals("task_assignee") || table.equals("task_checklist_item") || table.equals("planner_preference")) {
            throw new IllegalStateException("확장 테이블은 있으나 core history가 없습니다. "
                    + "적용 버전을 확인한 뒤 명시적으로 baseline 해야 합니다: " + table);
        }
        Set<String> required = REQUIRED_COLUMNS.get(table);
        if (required == null) {
            if (!table.equals("tbllog")) {
                throw new IllegalStateException("미관리 DB에 인식할 수 없는 테이블이 있습니다: " + table
                        + ". 백업과 schema 검토 후 명시적으로 baseline 해야 합니다.");
            }
            return;
        }
        Set<String> actual = columnNames(connection, schema, table);
        if (!actual.containsAll(required)) {
            Set<String> missing = new HashSet<>(required);
            missing.removeAll(actual);
            throw new IllegalStateException("기존 테이블 필수 컬럼이 없습니다: " + table + " " + missing);
        }
    }

    private Set<String> tableNames(Connection connection, String schema) throws SQLException {
        Set<String> result = new HashSet<>();
        try (ResultSet rows = connection.getMetaData().getTables(schema, null, "%", new String[]{"TABLE"})) {
            while (rows.next()) {
                result.add(rows.getString("TABLE_NAME").toLowerCase(Locale.ROOT));
            }
        }
        return result;
    }

    private Set<String> columnNames(Connection connection, String schema, String table) throws SQLException {
        Set<String> result = new HashSet<>();
        try (ResultSet rows = connection.getMetaData().getColumns(schema, null, table, "%")) {
            while (rows.next()) {
                if (table.equalsIgnoreCase(rows.getString("TABLE_NAME"))) {
                    result.add(rows.getString("COLUMN_NAME").toLowerCase(Locale.ROOT));
                }
            }
        }
        return result;
    }

    private static Set<String> columns(String names) {
        return Set.of(names.split(","));
    }
}
