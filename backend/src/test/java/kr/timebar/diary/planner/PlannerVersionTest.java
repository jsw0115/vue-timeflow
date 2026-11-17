// 플래너의 HTTP 버전 계약·소유권·동시 쓰기와 기존 행 마이그레이션을 검증한다.
package kr.timebar.diary.planner;

import jakarta.persistence.EntityManagerFactory;
import kr.timebar.diary.common.*;
import kr.timebar.diary.security.AuthUserPrincipal;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.http.MediaType;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringJUnitConfig(PlannerPersistenceTest.Config.class)
class PlannerVersionTest {
    @Autowired PlannerService planner;
    @Autowired PlannerItemRepository repository;
    @Autowired JpaTransactionManager transactions;
    @Autowired EntityManagerFactory factory;
    private String owner;
    private MockMvc mvc;

    @BeforeEach void setUp() {
        owner = UUID.randomUUID().toString();
        authenticate(owner);
        mvc = MockMvcBuilders.standaloneSetup(new PlannerController(planner))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }
    private void authenticate(String user) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                new AuthUserPrincipal(user, "planner@example.test", "USER"), null, List.of()));
    }
    private PlannerItem input(String title, Long version) {
        return new PlannerItem(null, PlannerItem.ItemType.TASK, title, "개인", LocalDate.of(2026, 11, 16),
                null, null, PlannerItem.ItemStatus.TODO, false, "", version);
    }
    private String body(Long version) {
        return "{\"type\":\"TASK\",\"title\":\"수정\",\"status\":\"TODO\"" + (version == null ? "" : ",\"version\":" + version) + "}";
    }

    @Test void staleMutationsPreserveTheLatestSavedRecord() {
        PlannerItem created = planner.save(owner, input("첫 기록", null));
        assertEquals(1L, created.version());
        PlannerItem changed = planner.update(owner, created.id(), input("최신 기록", created.version()));
        assertEquals(2L, changed.version());
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class,
                () -> planner.update(owner, created.id(), input("오래된 수정", 1L))).errorCode());
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class,
                () -> planner.changeStatus(owner, created.id(), PlannerItem.ItemStatus.DONE, 1L)).errorCode());
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class,
                () -> planner.delete(owner, created.id(), 1L)).errorCode());
        assertEquals("최신 기록", planner.find(owner, null, null, null, null).get(0).title());
        assertEquals(3L, planner.changeStatus(owner, created.id(), PlannerItem.ItemStatus.DONE, 2L).version());
        planner.delete(owner, created.id(), 3L);
        assertTrue(planner.find(owner, null, null, null, null).isEmpty());
    }

    @Test void httpRequiresVersionsAndReturnsTheFlushedVersion() throws Exception {
        mvc.perform(post("/api/planner/items").contentType(MediaType.APPLICATION_JSON).content(body(null)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.version").value(1));
        long id = planner.find(owner, null, null, null, null).get(0).id();
        String path = "/api/planner/items/" + id;
        for (Long invalid : Arrays.asList(null, -1L, 0L)) {
            mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(invalid)))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(patch(path + "/status").param("status", "DONE")).andExpect(status().isBadRequest());
        mvc.perform(delete(path)).andExpect(status().isBadRequest());
        mvc.perform(delete(path).param("version", "-1")).andExpect(status().isBadRequest());
        mvc.perform(patch(path + "/status").param("status", "DONE").param("version", "-1")).andExpect(status().isBadRequest());
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(1L).replace("수정", "새 제목")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.version").value(2));
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(1L))).andExpect(status().isConflict());
        mvc.perform(patch(path + "/status").param("status", "DONE").param("version", "1")).andExpect(status().isConflict());
        mvc.perform(delete(path).param("version", "1")).andExpect(status().isConflict());
        mvc.perform(patch(path + "/status").param("status", "DONE").param("version", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.version").value(3));
        mvc.perform(delete(path).param("version", "3")).andExpect(status().isNoContent());
        mvc.perform(post("/api/planner/items").contentType(MediaType.APPLICATION_JSON).content(body(9L)))
                .andExpect(status().isBadRequest());
    }

    @Test void httpDoesNotExposeAnotherOwnersVersionOrAllowAnonymousMutations() throws Exception {
        long id = planner.save(owner, input("소유자 기록", null)).id();
        String path = "/api/planner/items/" + id;
        authenticate(UUID.randomUUID().toString());
        mvc.perform(get("/api/planner/items")).andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(99L))).andExpect(status().isNotFound());
        mvc.perform(patch(path + "/status").param("status", "DONE").param("version", "99")).andExpect(status().isNotFound());
        mvc.perform(delete(path).param("version", "99")).andExpect(status().isNotFound());
        SecurityContextHolder.clearContext();
        mvc.perform(get("/api/planner/items")).andExpect(status().isUnauthorized());
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(1L))).andExpect(status().isUnauthorized());
        mvc.perform(patch(path + "/status").param("status", "DONE").param("version", "1")).andExpect(status().isUnauthorized());
        mvc.perform(delete(path).param("version", "1")).andExpect(status().isUnauthorized());
        assertEquals(1L, planner.find(owner, null, null, null, null).get(0).version());
    }

    @Test @Timeout(15) void concurrentSnapshotsCannotBothCommit() throws Exception {
        long id = planner.save(owner, input("동시 수정", null)).id();
        var barrier = new CyclicBarrier(2);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var attempts = new ArrayList<Future<Boolean>>();
            for (String title : List.of("첫 수정", "두 번째 수정")) {
                attempts.add(executor.submit(() -> {
                    try {
                        new TransactionTemplate(transactions).executeWithoutResult(tx -> {
                            var row = repository.findByIdAndUserId(id, owner).orElseThrow();
                            try { barrier.await(5, TimeUnit.SECONDS); }
                            catch (Exception e) { throw new IllegalStateException(e); }
                            row.apply(input(title, row.getPublicVersion()));
                            repository.flush();
                        });
                        return true;
                    } catch (ConcurrencyFailureException e) { return false; }
                }));
            }
            int successes = 0;
            for (var attempt : attempts) if (attempt.get(10, TimeUnit.SECONDS)) successes++;
            assertEquals(1, successes);
            assertEquals(2L, planner.find(owner, null, null, null, null).get(0).version());
        } finally { executor.shutdownNow(); }
    }

    @Test void staleDeleteCannotRemoveAnUpdateCommittedAfterItsRead() {
        long id = planner.save(owner, input("삭제 전", null)).id();
        var stale = factory.createEntityManager();
        try {
            stale.getTransaction().begin();
            var row = stale.find(PlannerItemEntity.class, id);
            planner.update(owner, id, input("보존할 수정", 1L));
            stale.remove(row);
            assertThrows(jakarta.persistence.OptimisticLockException.class, stale::flush);
        } finally {
            if (stale.getTransaction().isActive()) stale.getTransaction().rollback();
            stale.close();
        }
        assertEquals("보존할 수정", planner.find(owner, null, null, null, null).get(0).title());
    }

    @Test void migrationInitializesExistingRowsWithoutChangingTheirContents() {
        var source = new DriverManagerDataSource("jdbc:h2:mem:migration_" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        var jdbc = new JdbcTemplate(source);
        jdbc.execute("CREATE TABLE planner_item (id BIGINT PRIMARY KEY, title VARCHAR(200))");
        jdbc.update("INSERT INTO planner_item (id, title) VALUES (?, ?)", 1L, "기존 기록");
        new ResourceDatabasePopulator(new ClassPathResource("db/workspace/V7__planner_item_version.sql")).execute(source);
        assertEquals("기존 기록", jdbc.queryForObject("SELECT title FROM planner_item WHERE id = 1", String.class));
        assertEquals(0L, jdbc.queryForObject("SELECT version FROM planner_item WHERE id = 1", Long.class));
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                () -> jdbc.update("UPDATE planner_item SET version = NULL WHERE id = 1"));
    }
}
