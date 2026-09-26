package kr.timebar.diary.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * TimeFlow uses one MariaDB DataSource (`spring.datasource`) for every module.
 * Spring Boot owns the DataSource, EntityManagerFactory, transaction manager and Flyway lifecycle.
 */
@Configuration
@EnableJpaAuditing
@EnableJpaRepositories(basePackages = "kr.timebar.diary")
public class JpaConfig {
}