// 실제 JPA 저장으로 플래너 사용자 격리와 재조회·수정·삭제를 검증한다.
package kr.timebar.diary.planner;

import kr.timebar.diary.common.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.*;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(PlannerPersistenceTest.Config.class)
class PlannerPersistenceTest {
    @TestConfiguration
    @EnableTransactionManagement
    @EnableJpaAuditing
    @Import(kr.timebar.diary.config.QuerydslConfig.class)
    @EnableJpaRepositories(basePackageClasses=PlannerItemRepository.class)
    static class Config {
        @Bean DataSource dataSource() { return new DriverManagerDataSource("jdbc:h2:mem:planner_" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1", "sa", ""); }
        @Bean LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource source) {
            var factory = new LocalContainerEntityManagerFactoryBean(); factory.setDataSource(source);
            factory.setPackagesToScan("kr.timebar.diary.planner"); factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "create-drop")); return factory;
        }
        @Bean JpaTransactionManager transactionManager(EntityManagerFactory factory) { return new JpaTransactionManager(factory); }
        @Bean PlannerService planner(PlannerItemRepository repository) { return new PlannerService(repository); }
    }
    @Autowired PlannerService planner;
    @Autowired PlannerItemRepository repository;

    @Test void userScopedRowsPersistAndCannotBeMutatedByAnotherUser() {
        String alice = UUID.randomUUID().toString(), bob = UUID.randomUUID().toString();
        var input = new PlannerItem(null, PlannerItem.ItemType.EVENT, "계획", "개인", LocalDate.parse("2026-10-10"), LocalTime.of(9,0), LocalTime.of(10,0), PlannerItem.ItemStatus.SCHEDULED, false, "");
        long id = planner.save(alice, input).id();
        assertEquals(1, new PlannerService(repository).find(alice, null, null, null, null).size());
        assertTrue(planner.find(bob, null, null, null, null).isEmpty());
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> planner.update(bob, id, input)).errorCode());
        assertThrows(ApiException.class, () -> planner.delete(bob, id));
        planner.changeStatus(alice, id, PlannerItem.ItemStatus.DONE);
        assertEquals(PlannerItem.ItemStatus.DONE, planner.find(alice, null, null, null, null).get(0).status());
        planner.delete(alice, id); assertTrue(planner.find(alice, null, null, null, null).isEmpty());
    }
    @Test void oldUnownedRecordsAreHiddenAndInvalidTimeRangeIsRejected() {
        String user = UUID.randomUUID().toString();
        repository.saveAndFlush(new PlannerItemEntity(PlannerItem.ItemType.MEMO, "기존 행", "개인", LocalDate.now(), null, null, null, false, ""));
        assertTrue(planner.find(user, null, null, null, null).isEmpty());
        assertThrows(ApiException.class, () -> planner.save(user, new PlannerItem(null, PlannerItem.ItemType.EVENT, "역전", null, LocalDate.now(), LocalTime.of(10,0), LocalTime.of(9,0), null, false, "")));
    }
}
