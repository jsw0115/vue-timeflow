package kr.timebar.diary.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.stereotype.Component;

import java.sql.SQLException;

@Component
public class CoreMigrationStrategy implements FlywayMigrationStrategy {

    private static final Logger LOGGER = LoggerFactory.getLogger(CoreMigrationStrategy.class);

    private final CoreSchemaInspector inspector;
    private final String expectedSchema;
    private final boolean chatEnabled;

    public CoreMigrationStrategy(CoreSchemaInspector inspector,
            @Value("${app.database.expected-schema:timeflow}") String expectedSchema,
            @Value("${app.chat.enabled:false}") boolean chatEnabled) {
        this.inspector = inspector;
        this.expectedSchema = expectedSchema;
        this.chatEnabled = chatEnabled;
    }

    @Override
    public void migrate(Flyway core) {
        initializeHistory(core);
        core.migrate();
        if (chatEnabled) {
            Flyway.configure().dataSource(core.getConfiguration().getDataSource())
                    .locations("classpath:db/chat").table("flyway_chat_history")
                    .baselineOnMigrate(true).baselineVersion("0").cleanDisabled(true).load().migrate();
        }
    }

    private void initializeHistory(Flyway core) {
        try {
            if (inspector.requiresBaseline(core.getConfiguration().getDataSource(),
                    core.getConfiguration().getTable(), expectedSchema)) {
                // Version 2 skips the unsafe historical V1; V3 fills only missing core tables.
                Flyway.configure().configuration(core.getConfiguration()).baselineVersion("2")
                        .baselineOnMigrate(false).cleanDisabled(true).load().baseline();
                LOGGER.info("Verified unmanaged schema adopted at core baseline 2; safe V3 will follow.");
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("DB metadata 검사에 실패했습니다. baseline을 적용하지 않았습니다.", exception);
        }
    }
}
