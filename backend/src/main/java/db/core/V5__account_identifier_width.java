package db.core;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Only widens account identifiers; no resource identifiers or existing values are replaced. */
public class V5__account_identifier_width extends BaseJavaMigration {

    private static final Map<String, String> ACCOUNT_COLUMNS = Map.of(
            "users", "id", "refresh_token", "user_id", "events", "user_id",
            "task", "user_id", "routine", "user_id", "task_assignee", "user_id",
            "task_checklist_item", "assignee_id", "planner_preference", "user_id");

    @Override
    public boolean canExecuteInTransaction() {
        return false;
    }

    @Override
    public void migrate(Context context) throws SQLException {
        Connection connection = context.getConnection();
        List<ColumnChange> changes = plannedChanges(connection);
        List<ForeignKey> keys = affectedForeignKeys(connection, changes);
        for (ForeignKey key : keys) {
            execute(connection, "ALTER TABLE " + quote(key.table()) + " DROP FOREIGN KEY " + quote(key.name()));
        }
        for (ColumnChange change : changes) {
            execute(connection, change.sql());
        }
        for (ForeignKey key : keys) {
            execute(connection, key.restoreSql());
        }
    }

    private List<ColumnChange> plannedChanges(Connection connection) throws SQLException {
        List<ColumnChange> result = new ArrayList<>();
        for (Map.Entry<String, String> entry : ACCOUNT_COLUMNS.entrySet()) {
            try (ResultSet rows = connection.getMetaData().getColumns(connection.getCatalog(), null,
                    entry.getKey(), entry.getValue())) {
                while (rows.next()) {
                    if (entry.getKey().equalsIgnoreCase(rows.getString("TABLE_NAME"))
                            && entry.getValue().equalsIgnoreCase(rows.getString("COLUMN_NAME"))) {
                        int width = rows.getInt("COLUMN_SIZE");
                        int type = rows.getInt("DATA_TYPE");
                        if (type != Types.CHAR && type != Types.VARCHAR) {
                            throw new SQLException("계정 ID 컬럼이 문자열이 아닙니다: " + entry.getKey());
                        }
                        if (type == Types.CHAR || width < 36) {
                            boolean nullable = rows.getInt("NULLABLE") == DatabaseMetaData.columnNullable;
                            result.add(new ColumnChange(entry.getKey(), entry.getValue(), Math.max(36, width), nullable));
                        }
                    }
                }
            }
        }
        return result;
    }

    private List<ForeignKey> affectedForeignKeys(Connection connection, List<ColumnChange> changes)
            throws SQLException {
        Set<String> changed = new HashSet<>();
        changes.forEach(change -> changed.add(change.table() + "." + change.column()));
        verifyExternalReferences(connection, changed);
        List<ForeignKey> result = new ArrayList<>();
        for (String table : ACCOUNT_COLUMNS.keySet()) {
            inspectForeignKeys(connection, table, changed, result);
        }
        return result;
    }

    private void verifyExternalReferences(Connection connection, Set<String> changed) throws SQLException {
        if (!changed.contains("users.id")) {
            return;
        }
        String schema = connection.getCatalog();
        try (ResultSet rows = connection.getMetaData().getExportedKeys(schema, null, "users")) {
            while (rows.next()) {
                String table = rows.getString("FKTABLE_NAME");
                String column = rows.getString("FKCOLUMN_NAME");
                if (!schema.equals(rows.getString("FKTABLE_CAT"))
                        || !column.equals(ACCOUNT_COLUMNS.get(table)) || rows.getInt("KEY_SEQ") != 1) {
                    throw new SQLException("외부 계정 FK가 있어 자동 확장을 중단합니다: " + table);
                }
            }
        }
    }

    private void inspectForeignKeys(Connection connection, String table, Set<String> changed,
            List<ForeignKey> result) throws SQLException {
        String schema = connection.getCatalog();
        try (ResultSet rows = connection.getMetaData().getImportedKeys(schema, null, table)) {
            while (rows.next()) {
                String parent = rows.getString("PKTABLE_NAME");
                String parentColumn = rows.getString("PKCOLUMN_NAME");
                String column = rows.getString("FKCOLUMN_NAME");
                if (changed.contains(table + "." + column) || changed.contains(parent + "." + parentColumn)) {
                    if (!schema.equals(rows.getString("PKTABLE_CAT")) || rows.getInt("KEY_SEQ") != 1
                            || !"users".equals(parent) || !"id".equals(parentColumn)) {
                        throw new SQLException("알 수 없는 계정 FK가 있어 자동 확장을 중단합니다: " + table);
                    }
                    result.add(new ForeignKey(table, column, rows.getString("FK_NAME"), parent, parentColumn,
                            rule(rows.getInt("DELETE_RULE")), rule(rows.getInt("UPDATE_RULE"))));
                }
            }
        }
    }

    private static String rule(int value) throws SQLException {
        return switch (value) {
            case DatabaseMetaData.importedKeyCascade -> "CASCADE";
            case DatabaseMetaData.importedKeySetNull -> "SET NULL";
            case DatabaseMetaData.importedKeyRestrict -> "RESTRICT";
            case DatabaseMetaData.importedKeyNoAction -> "NO ACTION";
            default -> throw new SQLException("지원하지 않는 FK 규칙입니다.");
        };
    }

    private static String quote(String identifier) {
        return "`" + identifier.replace("`", "``") + "`";
    }

    private void execute(Connection connection, String sql) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private record ColumnChange(String table, String column, int width, boolean nullable) {
        String sql() {
            return "ALTER TABLE " + quote(table) + " MODIFY " + quote(column) + " VARCHAR(" + width + ") "
                    + (nullable ? "NULL" : "NOT NULL");
        }
    }

    private record ForeignKey(String table, String column, String name, String parent, String parentColumn,
            String deleteRule, String updateRule) {
        String restoreSql() {
            return "ALTER TABLE " + quote(table) + " ADD CONSTRAINT " + quote(name)
                    + " FOREIGN KEY (" + quote(column) + ") REFERENCES " + quote(parent)
                    + " (" + quote(parentColumn) + ") ON DELETE " + deleteRule + " ON UPDATE " + updateRule;
        }
    }
}
