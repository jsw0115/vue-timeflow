// 테스트 클래스가 포함된 classpath에서도 실제 서버 기동과 운영 빈 구성을 검증한다.
package kr.timebar.diary.config;

import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import javax.sql.DataSource;
import kr.timebar.diary.TimebarDiaryApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.FilteredClassLoader;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.io.DefaultResourceLoader;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApplicationStartupTest {
    @Test
    void ordinaryRuntimeScanIgnoresTestConfigurationsWithoutBootTestDependencies() throws Exception {
        try (var classLoader = new FilteredClassLoader("org.springframework.boot.test")) {
            var scanner = new ClassPathScanningCandidateComponentProvider(true);
            scanner.setResourceLoader(new DefaultResourceLoader(classLoader));
            var candidates = scanner.findCandidateComponents(TimebarDiaryApplication.class.getPackageName())
                    .stream().map(candidate -> candidate.getBeanClassName()).toList();
            assertTrue(candidates.contains(JpaConfig.class.getName()));
            assertFalse(candidates.contains("kr.timebar.diary.feature.FeatureTestConfig"));
            assertFalse(candidates.contains("kr.timebar.diary.planner.PlannerPersistenceTest$Config"));
        }
    }

    @Test
    void applicationStartsWithoutDiscoveringTestConfigurations() throws Exception {
        var application = new SpringApplication(TimebarDiaryApplication.class);
        try (var context = application.run(
                "--spring.config.location=optional:classpath:/startup-isolation-test.yml",
                "--spring.datasource.driver-class-name=org.h2.Driver",
                "--spring.datasource.url=jdbc:h2:mem:startup_" + UUID.randomUUID() + ";MODE=MySQL",
                "--spring.datasource.username=sa",
                "--spring.datasource.password=",
                "--spring.jpa.hibernate.ddl-auto=create-drop",
                "--spring.flyway.enabled=false",
                "--spring.main.allow-bean-definition-overriding=false",
                "--app.chat.enabled=false",
                "--app.security.jwt.secret=startup-regression-test-secret-32-bytes",
                "--management.health.redis.enabled=false",
                "--server.address=127.0.0.1",
                "--server.port=0")) {
            assertFalse(context.containsBean("featureTestConfig"));
            assertFalse(context.containsBean("plannerPersistenceTest.Config"));
            assertEquals(1, context.getBeansOfType(DataSource.class).size());
            assertInstanceOf(HikariDataSource.class, context.getBean(DataSource.class));
            int port = ((ServletWebServerApplicationContext) context).getWebServer().getPort();
            var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/actuator/health"))
                    .GET().build();
            var response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            assertEquals(200, response.statusCode());
            assertTrue(response.body().contains("\"status\":\"UP\""));
        }
    }
}
