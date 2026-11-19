// 할 일의 HTTP 버전 계약·소유권·동시 수정과 기존 행 마이그레이션을 검증한다(PR-07 1단계, UF-80·UF-84의 서버 전제).
package kr.timebar.diary.task;

import jakarta.persistence.EntityManagerFactory;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.security.AuthUserPrincipal;
import kr.timebar.diary.task.dto.TaskRequest;
import kr.timebar.diary.task.dto.TaskResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(TaskVersionTest.Config.class)
class TaskVersionTest {
    @EnableTransactionManagement
    @EnableJpaRepositories(basePackageClasses = TaskRepository.class)
    static class Config {
        @Bean DataSource dataSource() { return new DriverManagerDataSource("jdbc:h2:mem:task_" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1", "sa", ""); }
        @Bean LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource source) {
            var factory = new LocalContainerEntityManagerFactoryBean(); factory.setDataSource(source);
            factory.setPackagesToScan("kr.timebar.diary.task"); factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "create-drop")); return factory;
        }
        @Bean JpaTransactionManager transactionManager(EntityManagerFactory factory) { return new JpaTransactionManager(factory); }
        @Bean TaskService taskService(TaskRepository repository, DataSource source) { return new TaskService(repository, new kr.timebar.diary.common.IdempotencyKeys(new JdbcTemplate(source), new com.fasterxml.jackson.databind.ObjectMapper()), org.mockito.Mockito.mock(kr.timebar.diary.records.RecordLinks.class)); }
    }

    @Autowired TaskService tasks;
    private String owner;
    private MockMvc mvc;

    @BeforeEach void setUp() {
        owner = UUID.randomUUID().toString();
        authenticate(owner);
        mvc = MockMvcBuilders.standaloneSetup(new TaskController(tasks)).setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }
    private void authenticate(String user) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                new AuthUserPrincipal(user, "task@example.test", "USER"), null, List.of()));
    }
    private static TaskRequest input(String title, Long version) {
        return new TaskRequest(title, null, null, null, null, null, null, "업무", null, null, version);
    }
    private static String body(Long version) {
        return "{\"title\":\"수정\"" + (version == null ? "" : ",\"version\":" + version) + "}";
    }

    /** UT-120 서버 전제: 생성 1, 수정할 때마다 1씩 오르고, 오래된 version의 수정·상태 변경·삭제는 최신 저장을 덮지 못한다. */
    @Test void staleMutationsPreserveTheLatestSavedTask() {
        TaskResponse created = tasks.create(owner, input("첫 할 일", null));
        assertEquals(1L, created.version());
        TaskResponse changed = tasks.update(owner, created.id(), input("최신 할 일", created.version()));
        assertEquals(2L, changed.version());
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class, () -> tasks.update(owner, created.id(), input("오래된 수정", 1L))).errorCode());
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class, () -> tasks.toggleStatus(owner, created.id(), 1L)).errorCode());
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class, () -> tasks.delete(owner, created.id(), 1L)).errorCode());
        assertEquals("최신 할 일", tasks.list(owner).get(0).title());
        TaskResponse done = tasks.toggleStatus(owner, created.id(), 2L);
        assertEquals(TaskStatus.DONE, done.status());
        assertEquals(3L, done.version());
        tasks.delete(owner, created.id(), 3L);
        assertTrue(tasks.list(owner).isEmpty());
    }

    /** HTTP: 수정·상태 변경·삭제는 version이 필요하고(누락·1 미만은 400), 오래되면 409, 생성은 version을 생략하거나 0만 받는다. */
    @Test void httpRequiresVersionsAndReturnsTheFlushedVersion() throws Exception {
        mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(body(null)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.version").value(1));
        String path = "/api/tasks/" + tasks.list(owner).get(0).id();
        for (Long invalid : Arrays.asList(null, -1L, 0L)) {
            mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(invalid))).andExpect(status().isBadRequest());
        }
        mvc.perform(patch(path + "/status")).andExpect(status().isBadRequest());
        mvc.perform(patch(path + "/status").param("version", "0")).andExpect(status().isBadRequest());
        mvc.perform(delete(path)).andExpect(status().isBadRequest());
        mvc.perform(delete(path).param("version", "-1")).andExpect(status().isBadRequest());
        // 바뀐 내용이 있어야 저장 버전이 오른다(같은 값의 수정은 저장하지 않는다)
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(1L).replace("수정", "새 제목")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.version").value(2));
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(1L))).andExpect(status().isConflict());
        mvc.perform(patch(path + "/status").param("version", "1")).andExpect(status().isConflict());
        mvc.perform(delete(path).param("version", "1")).andExpect(status().isConflict());
        mvc.perform(patch(path + "/status").param("version", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.version").value(3)).andExpect(jsonPath("$.data.status").value("DONE"));
        mvc.perform(get(path)).andExpect(jsonPath("$.data.version").value(3));
        mvc.perform(delete(path).param("version", "3")).andExpect(status().isOk());
        mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(body(9L))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(body(0L))).andExpect(status().isCreated());
    }

    /** 다른 계정은 version을 알아도 404이고, 원래 할 일은 바뀌지 않는다. */
    @Test void anotherOwnerCannotSeeOrChangeTheTask() throws Exception {
        String id = tasks.create(owner, input("소유자 할 일", null)).id();
        String path = "/api/tasks/" + id;
        authenticate(UUID.randomUUID().toString());
        mvc.perform(get("/api/tasks")).andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(1L))).andExpect(status().isNotFound());
        mvc.perform(patch(path + "/status").param("version", "1")).andExpect(status().isNotFound());
        mvc.perform(delete(path).param("version", "1")).andExpect(status().isNotFound());
        assertEquals(1L, tasks.list(owner).get(0).version());
        assertEquals("소유자 할 일", tasks.list(owner).get(0).title());
    }

    /** 같은 version으로 동시에 수정하면 한 요청만 저장되고 다른 요청은 409다. */
    @Test @Timeout(15) void concurrentUpdatesWithTheSameVersionCannotBothSucceed() throws Exception {
        String id = tasks.create(owner, input("동시 수정", null)).id();
        var barrier = new CyclicBarrier(2);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var attempts = new ArrayList<Future<Boolean>>();
            for (String title : List.of("첫 수정", "두 번째 수정")) {
                attempts.add(executor.submit(() -> {
                    barrier.await(5, TimeUnit.SECONDS);
                    try { tasks.update(owner, id, input(title, 1L)); return true; }
                    catch (ApiException e) { assertEquals(ErrorCode.CONFLICT, e.errorCode()); return false; }
                }));
            }
            int successes = 0;
            for (var attempt : attempts) if (attempt.get(10, TimeUnit.SECONDS)) successes++;
            assertEquals(1, successes);
            assertEquals(2L, tasks.list(owner).get(0).version());
        } finally { executor.shutdownNow(); }
    }

    /** 오프라인 대기열이 응답을 잃은 수정을 같은 키로 다시 보내면 409 대신 처음 결과의 할 일을 돌려준다(PR-12, UT-182). */
    @Test void replayedUpdateWithTheSameKeyReturnsTheFirstResult(@Autowired DataSource source) {
        new JdbcTemplate(source).execute("CREATE TABLE IF NOT EXISTS idempotency_key (owner_id VARCHAR(36) NOT NULL, idem_key VARCHAR(100) NOT NULL, request_hash CHAR(64) NOT NULL, status_code INT NOT NULL, resource_id VARCHAR(100) NOT NULL, created_at TIMESTAMP(6) NOT NULL, PRIMARY KEY (owner_id, idem_key))");
        TaskResponse created = tasks.create(owner, input("오프라인 할 일", null));
        TaskResponse first = tasks.update(owner, created.id(), input("지하철에서 고침", 1L), "offline-task-update-1");
        TaskResponse again = tasks.update(owner, created.id(), input("지하철에서 고침", 1L), "offline-task-update-1");
        assertEquals(2L, first.version());
        assertEquals(first.id(), again.id());
        assertEquals(2L, again.version());
        assertEquals(1, tasks.list(owner).size());
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class, () -> tasks.update(owner, created.id(), input("다른 내용", 1L), "offline-task-update-1")).errorCode());
    }

    /** 로컬 자료 이전처럼 같은 멱등 키로 다시 만들면 처음 할 일을 돌려주고, 다른 내용이면 409다(PR-07 3단계, Q-13). */
    @Test void createWithTheSameIdempotencyKeyReturnsTheFirstTask(@Autowired DataSource source) throws Exception {
        // 이 설정의 H2는 MySQL 모드가 아니어서 V9의 ENGINE 절 없이 같은 표를 만든다(V9 자체는 IdempotencyHttpTest가 MySQL 모드로 적용한다)
        new JdbcTemplate(source).execute("CREATE TABLE IF NOT EXISTS idempotency_key (owner_id VARCHAR(36) NOT NULL, idem_key VARCHAR(100) NOT NULL, request_hash CHAR(64) NOT NULL, status_code INT NOT NULL, resource_id VARCHAR(100) NOT NULL, created_at TIMESTAMP(6) NOT NULL, PRIMARY KEY (owner_id, idem_key))");
        String body = "{\"title\":\"로컬 할 일\"}";
        String first = mvc.perform(post("/api/tasks").header("Idempotency-Key", "local:task:4").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String again = mvc.perform(post("/api/tasks").header("Idempotency-Key", "local:task:4").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        assertEquals(first, again);
        assertEquals(1, tasks.list(owner).size());
        mvc.perform(post("/api/tasks").header("Idempotency-Key", "local:task:4").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"다른 할 일\"}"))
                .andExpect(status().isConflict());
        assertEquals(1, tasks.list(owner).size());
    }

    /** V8은 기존 할 일 내용을 그대로 두고 version 0(공개 1)으로 시작한다. NULL은 넣을 수 없다. */
    @Test void migrationInitializesExistingRowsWithoutChangingTheirContents() {
        var source = new DriverManagerDataSource("jdbc:h2:mem:task_migration_" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        var jdbc = new JdbcTemplate(source);
        jdbc.execute("CREATE TABLE task (id VARCHAR(26) PRIMARY KEY, title VARCHAR(200))");
        jdbc.update("INSERT INTO task (id, title) VALUES (?, ?)", "01JTASK0000000000000000000", "기존 할 일");
        new ResourceDatabasePopulator(new ClassPathResource("db/workspace/V8__task_version.sql")).execute(source);
        assertEquals("기존 할 일", jdbc.queryForObject("SELECT title FROM task WHERE id = '01JTASK0000000000000000000'", String.class));
        assertEquals(0L, jdbc.queryForObject("SELECT version FROM task WHERE id = '01JTASK0000000000000000000'", Long.class));
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                () -> jdbc.update("UPDATE task SET version = NULL WHERE id = '01JTASK0000000000000000000'"));
    }
}
