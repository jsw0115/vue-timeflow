package kr.timebar.diary.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CoreSchemaInspectorTest {

    private DataSource dataSource;
    private Connection connection;
    private DatabaseMetaData metadata;
    private CoreSchemaInspector inspector;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = mock(DataSource.class);
        connection = mock(Connection.class);
        metadata = mock(DatabaseMetaData.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getCatalog()).thenReturn("timeflow");
        when(connection.getMetaData()).thenReturn(metadata);
        inspector = new CoreSchemaInspector();
    }

    @Test
    void emptyVerifiedSchemaCanBeInitialized() throws Exception {
        tables(List.of());
        assertTrue(inspector.requiresBaseline(dataSource, "flyway_schema_history", "timeflow"));
    }

    @Test
    void existingHistoryIsNeverRebaselinedEvenForDifferentExpectedSchema() throws Exception {
        tables(List.of("flyway_schema_history", "users"));
        assertFalse(inspector.requiresBaseline(dataSource, "flyway_schema_history", "different"));
    }

    @Test
    void wrongDatabaseCannotBeAutomaticallyAdopted() throws Exception {
        tables(List.of());
        assertThrows(IllegalStateException.class,
                () -> inspector.requiresBaseline(dataSource, "flyway_schema_history", "different"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"unknown_data", "tbl_users", "flyway_chat_history"})
    void unknownOrPrefixedSchemaIsRejected(String table) throws Exception {
        tables(List.of(table));
        assertThrows(IllegalStateException.class,
                () -> inspector.requiresBaseline(dataSource, "flyway_schema_history", "timeflow"));
    }

    @Test
    void legacyEventsAndLogTableAreRecognizedWithoutChangingData() throws Exception {
        tables(List.of("events", "tbllog"));
        columns("events", List.of("id", "user_id", "title", "category", "date", "start_time", "end_time",
                "location", "visibility", "note", "series_id", "created_at", "updated_at"));
        assertTrue(inspector.requiresBaseline(dataSource, "flyway_schema_history", "timeflow"));
    }

    @Test
    void incompleteExistingTablesFailBeforeBaseline() throws Exception {
        tables(List.of("users"));
        columns("users", List.of("id", "email"));
        assertThrows(IllegalStateException.class,
                () -> inspector.requiresBaseline(dataSource, "flyway_schema_history", "timeflow"));
    }

    @Test
    void workspaceTablesWithoutHistoryCannotBeBlindlyRecreated() throws Exception {
        tables(List.of("task_assignee"));
        assertThrows(IllegalStateException.class,
                () -> inspector.requiresBaseline(dataSource, "flyway_schema_history", "timeflow"));
    }

    private void tables(List<String> names) throws Exception {
        ResultSet rows = mock(ResultSet.class);
        int[] index = {-1};
        when(rows.next()).thenAnswer(invocation -> ++index[0] < names.size());
        when(rows.getString("TABLE_NAME")).thenAnswer(invocation -> names.get(index[0]));
        when(metadata.getTables(eq("timeflow"), eq(null), eq("%"), any(String[].class))).thenReturn(rows);
    }

    private void columns(String table, List<String> names) throws Exception {
        ResultSet rows = mock(ResultSet.class);
        int[] index = {-1};
        when(rows.next()).thenAnswer(invocation -> ++index[0] < names.size());
        when(rows.getString("TABLE_NAME")).thenReturn(table);
        when(rows.getString("COLUMN_NAME")).thenAnswer(invocation -> names.get(index[0]));
        when(metadata.getColumns("timeflow", null, table, "%")).thenReturn(rows);
    }
}
