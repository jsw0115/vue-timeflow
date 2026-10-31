// 외부 DB 없이 실제 SQL 저장과 트랜잭션을 검증하는 테스트 환경을 구성한다.
package kr.timebar.diary.feature;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.auth.*;
import kr.timebar.diary.records.*;
import kr.timebar.diary.operations.*;
import kr.timebar.diary.social.*;
import kr.timebar.diary.work.*;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import javax.sql.DataSource;
import static org.mockito.Mockito.mock;

@TestConfiguration
@EnableTransactionManagement
public class FeatureTestConfig {
    @Bean DataSource dataSource() {
        var source = new DriverManagerDataSource("jdbc:h2:mem:features_" + java.util.UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        var jdbc = new JdbcTemplate(source);
        jdbc.execute("CREATE TABLE users(id VARCHAR(36) PRIMARY KEY)");
        jdbc.execute("CREATE TABLE planner_item(id BIGINT PRIMARY KEY,date DATE)");
        new ResourceDatabasePopulator(new ClassPathResource("db/workspace/V6__frontend_feature_records.sql")).execute(source);
        return source;
    }
    @Bean DataSourceTransactionManager transactionManager(DataSource source) { return new DataSourceTransactionManager(source); }
    @Bean JdbcTemplate jdbc(DataSource source) { return new JdbcTemplate(source); }
    @Bean ObjectMapper mapper() { return new ObjectMapper().findAndRegisterModules(); }
    @Bean FeatureStore store(JdbcTemplate jdbc, ObjectMapper mapper) { return new FeatureStore(jdbc, mapper); }
    @Bean RecordService records(FeatureStore store) { return new RecordService(store); }
    @Bean ScheduleService schedules(FeatureStore store) { return new ScheduleService(store); }
    @Bean WorkService work(FeatureStore store) { return new WorkService(store); }
    @Bean UserRepository users() { return mock(UserRepository.class); }
    @Bean RefreshTokenRepository tokens() { return mock(RefreshTokenRepository.class); }
    @Bean PasswordEncoder encoder() { return new BCryptPasswordEncoder(); }
    @Bean PasswordPolicy passwords() { return new PasswordPolicy(); }
    @Bean SocialService social(FeatureStore store, JdbcTemplate jdbc, UserRepository users) { return new SocialService(store, jdbc, users); }
    @Bean AdminService admin(UserRepository users, FeatureStore store, RefreshTokenRepository tokens, PasswordEncoder encoder, PasswordPolicy passwords) { return new AdminService(users, store, tokens, encoder, passwords); }
    @Bean SettingsService settings(FeatureStore store, UserRepository users, PasswordEncoder encoder, PasswordPolicy passwords, RefreshTokenRepository tokens) { return new SettingsService(store, users, encoder, passwords, tokens); }
}
