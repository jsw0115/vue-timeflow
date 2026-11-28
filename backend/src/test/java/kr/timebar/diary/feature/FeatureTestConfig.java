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
        var source = new DriverManagerDataSource("jdbc:h2:mem:features_" + java.util.UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000", "sa", "");
        var jdbc = new JdbcTemplate(source);
        jdbc.execute("CREATE TABLE users(id VARCHAR(36) PRIMARY KEY)");
        jdbc.execute("CREATE TABLE planner_item(id BIGINT PRIMARY KEY,date DATE)");
        // 기록 연결(PR-08)이 소유자·삭제 여부를 확인하는 할 일 열만 둔다
        jdbc.execute("CREATE TABLE task(id VARCHAR(26) PRIMARY KEY,user_id VARCHAR(36) NOT NULL,title VARCHAR(200) NOT NULL,d_at TIMESTAMP(6) NULL)");
        new ResourceDatabasePopulator(new ClassPathResource("db/workspace/V6__frontend_feature_records.sql"), new ClassPathResource("db/workspace/V9__idempotency_key.sql"), new ClassPathResource("db/workspace/V10__record_link.sql"), new ClassPathResource("db/workspace/V11__group_share_level.sql"), new ClassPathResource("db/workspace/V12__challenge_checkin.sql")).execute(source);
        return source;
    }
    @Bean DataSourceTransactionManager transactionManager(DataSource source) { return new DataSourceTransactionManager(source); }
    @Bean JdbcTemplate jdbc(DataSource source) { return new JdbcTemplate(source); }
    @Bean ObjectMapper mapper() { return new ObjectMapper().findAndRegisterModules(); }
    @Bean FeatureStore store(JdbcTemplate jdbc, ObjectMapper mapper) { return new FeatureStore(jdbc, mapper); }
    @Bean kr.timebar.diary.common.IdempotencyKeys idempotency(JdbcTemplate jdbc, ObjectMapper mapper) { return new kr.timebar.diary.common.IdempotencyKeys(jdbc, mapper); }
    @Bean kr.timebar.diary.records.RoutineRules routineRules(DayPolicy days) { return new kr.timebar.diary.records.RoutineRules(days); }
    @Bean RecordService records(FeatureStore store, kr.timebar.diary.common.IdempotencyKeys idempotency, kr.timebar.diary.records.RoutineRules routines) { return new RecordService(store, idempotency, routines); }
    @Bean RecordLinks links(JdbcTemplate jdbc, FeatureStore store, kr.timebar.diary.common.IdempotencyKeys idempotency) { return new RecordLinks(jdbc, store, idempotency); }
    @Bean ActualRecordingService actualRecordings(FeatureStore store, JdbcTemplate jdbc, RecordLinks links) { return new ActualRecordingService(store, jdbc, links); }
    @Bean BackupService backups(FeatureStore store, JdbcTemplate jdbc, ObjectMapper mapper) { return new BackupService(store, jdbc, mapper); }
    @Bean ScheduleService schedules(FeatureStore store) { return new ScheduleService(store); }
    @Bean DayPolicy days(UserRepository users, FeatureStore store) { return new DayPolicy(users, store); }
    @Bean kr.timebar.diary.records.ProjectActuals projectActuals(FeatureStore store, RecordLinks links, JdbcTemplate jdbc, DayPolicy days) { return new kr.timebar.diary.records.ProjectActuals(store, links, jdbc, days); }
    @Bean WorkService work(FeatureStore store, kr.timebar.diary.common.IdempotencyKeys idempotency) { return new WorkService(store, idempotency); }
    @Bean kr.timebar.diary.career.CareerService career(FeatureStore store, kr.timebar.diary.common.IdempotencyKeys idempotency, RecordLinks links) { return new kr.timebar.diary.career.CareerService(store, idempotency, links); }
    @Bean kr.timebar.diary.career.ActivitySources activitySources(RecordLinks links, JdbcTemplate jdbc) { return new kr.timebar.diary.career.ActivitySources(links, jdbc); }
    @Bean kr.timebar.diary.career.DocumentVersions documentVersions(FeatureStore store, RecordLinks links, JdbcTemplate jdbc) { return new kr.timebar.diary.career.DocumentVersions(store, links, jdbc); }
    @Bean UserRepository users() { return mock(UserRepository.class); }
    @Bean RefreshTokenRepository tokens() { return mock(RefreshTokenRepository.class); }
    @Bean PasswordEncoder encoder() { return new BCryptPasswordEncoder(); }
    @Bean PasswordPolicy passwords() { return new PasswordPolicy(); }
    @Bean SocialService social(FeatureStore store, JdbcTemplate jdbc, UserRepository users, org.springframework.context.ApplicationEventPublisher events) { return new SocialService(store, jdbc, users, events); }
    @Bean kr.timebar.diary.social.ShareCalendar shareCalendar(SocialService social, ScheduleService schedules, JdbcTemplate jdbc, UserRepository users) { return new kr.timebar.diary.social.ShareCalendar(social, schedules, jdbc, users); }
    @Bean kr.timebar.diary.social.ChallengeService challenges(FeatureStore store, JdbcTemplate jdbc, SocialService social, DayPolicy days, UserRepository users) { return new kr.timebar.diary.social.ChallengeService(store, jdbc, social, days, users); }
    @Bean kr.timebar.diary.social.PeopleFinder peopleFinder(UserRepository users, SocialService social) { return new kr.timebar.diary.social.PeopleFinder(users, social); }
    @Bean kr.timebar.diary.records.ContactAccounts contactAccounts(FeatureStore store, kr.timebar.diary.social.PeopleFinder people) { return new kr.timebar.diary.records.ContactAccounts(store, people); }
    @Bean AdminService admin(UserRepository users, FeatureStore store, RefreshTokenRepository tokens, PasswordEncoder encoder, PasswordPolicy passwords) { return new AdminService(users, store, tokens, encoder, passwords); }
    @Bean LoginThrottleRepository throttles() { return mock(LoginThrottleRepository.class); }
    @Bean SettingsService settings(FeatureStore store, UserRepository users, PasswordEncoder encoder, PasswordPolicy passwords, RefreshTokenRepository tokens, LoginThrottleRepository throttles) { return new SettingsService(store, users, encoder, passwords, tokens, throttles); }
}
