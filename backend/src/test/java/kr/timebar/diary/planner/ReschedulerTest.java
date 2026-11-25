// 재배치 제안(PR-19 UF-137, UT-243): 밀린 회의 뒤의 계획 블록·마감 시각 있는 할 일을 옮기는 안을 만들고, 고정 일정은 옮기지 않으며,
// 다른 기기에서 바뀐 항목은 충돌로 남기고 나머지만 옮긴다. 되돌리기도 version을 확인한다.
package kr.timebar.diary.planner;

import jakarta.persistence.EntityManagerFactory;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.records.ScheduleService;
import kr.timebar.diary.task.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringJUnitConfig(ReschedulerTest.Config.class)
class ReschedulerTest {
    @EnableTransactionManagement
    @org.springframework.data.jpa.repository.config.EnableJpaAuditing
    @org.springframework.context.annotation.Import(kr.timebar.diary.config.QuerydslConfig.class)
    @EnableJpaRepositories(basePackageClasses = {PlannerItemRepository.class, TaskRepository.class})
    static class Config {
        @Bean DataSource dataSource() { return new DriverManagerDataSource("jdbc:h2:mem:reschedule_" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1", "sa", ""); }
        @Bean LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource source) {
            var factory = new LocalContainerEntityManagerFactoryBean(); factory.setDataSource(source);
            factory.setPackagesToScan("kr.timebar.diary.planner", "kr.timebar.diary.task"); factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "create-drop")); return factory;
        }
        @Bean JpaTransactionManager transactionManager(EntityManagerFactory factory) { return new JpaTransactionManager(factory); }
        @Bean ScheduleService schedules() { return mock(ScheduleService.class); }
        @Bean PlannerService planner(PlannerItemRepository repository) { return new PlannerService(repository); }
        @Bean Rescheduler rescheduler(PlannerItemRepository blocks, TaskRepository tasks, ScheduleService schedules) { return new Rescheduler(blocks, tasks, schedules); }
    }
    @Autowired Rescheduler rescheduler;
    @Autowired PlannerService planner;
    @Autowired TaskRepository taskRepository;
    @Autowired ScheduleService schedules;
    static final LocalDate DAY = LocalDate.of(2026, 11, 25);
    String me;

    @BeforeEach void setup() {
        me = UUID.randomUUID().toString();
        reset(schedules);
        // 고정 일정: 10:00~11:30 회의(30분 늦어짐), 13:00~14:00 점심 약속
        when(schedules.occurrences(eq(me), anyString(), anyString())).thenReturn(List.of(
                Map.of("title", "주간 회의", "startDate", "2026-11-25", "endDate", "2026-11-25", "startTime", "10:00", "endTime", "11:30"),
                Map.of("title", "점심 약속", "startDate", "2026-11-25", "endDate", "2026-11-25", "startTime", "13:00", "endTime", "14:00")));
    }
    private PlannerItem block(String title, String start, String end) {
        return planner.save(me, new PlannerItem(null, PlannerItem.ItemType.EVENT, title, "개인", DAY, LocalTime.parse(start), LocalTime.parse(end), PlannerItem.ItemStatus.SCHEDULED, false, "", null));
    }
    private TaskEntity task(String title, String due) {
        var t = new TaskEntity(me, title, "", TaskPriority.values()[0], EnergyLevel.values()[0], 30, DAY, null, null, null, null);
        t.changeDueTime(LocalTime.parse(due));
        return taskRepository.saveAndFlush(t);
    }
    private Map<String, Object> preview(String from, int delay) { return rescheduler.preview(me, new HashMap<>(Map.of("date", "2026-11-25", "from", from, "delayMinutes", delay))); }
    @SuppressWarnings("unchecked") private static List<Map<String, Object>> list(Map<String, Object> map, String key) { return (List<Map<String, Object>>) map.get(key); }
    @SuppressWarnings("unchecked") private static Map<String, Object> after(Map<String, Object> move) { return (Map<String, Object>) move.get("after"); }
    private Map<String, Object> apply(List<Map<String, Object>> moves) {
        var sent = new ArrayList<Map<String, Object>>();
        for (var m : moves) { var row = new HashMap<String, Object>(Map.of("kind", m.get("kind"), "id", m.get("id"), "version", m.get("version"))); row.putAll(after(m)); sent.add(row); }
        return rescheduler.apply(me, new HashMap<>(Map.of("moves", sent)));
    }

    /** 제안: 밀린 30분만큼 뒤로, 앞 블록과 겹치지 않게, 고정 약속과 겹치면 그 뒤로. 그 전에 시작한 블록·끝낸 블록은 옮기지 않는다. 할 일 마감도 30분 늦춘다. */
    @Test void previewShiftsBlocksAroundFixedSchedules() {
        block("아침 정리", "09:00", "09:30");
        var write = block("보고서 쓰기", "11:00", "12:00");
        var review = block("코드 리뷰", "12:00", "13:00");
        var done = block("끝낸 일", "15:00", "15:30");
        planner.changeStatus(me, done.id(), PlannerItem.ItemStatus.DONE, done.version());
        var t = task("견적 회신", "16:00");
        var result = preview("11:00", 30);
        var moves = list(result, "moves");
        assertEquals(List.of(String.valueOf(write.id()), String.valueOf(review.id()), t.getId()), moves.stream().map(m -> m.get("id")).toList());
        assertEquals(Map.of("startTime", "11:30", "endTime", "12:30"), after(moves.get(0)));
        // 12:30~13:30은 점심 약속과 겹쳐 14:00~15:00으로
        assertEquals(Map.of("startTime", "14:00", "endTime", "15:00"), after(moves.get(1)));
        assertEquals(Map.of("dueTime", "16:30"), after(moves.get(2)));
        assertEquals(2, list(result, "fixed").size());
    }

    /** UT-243: 제안 뒤 다른 기기에서 한 블록을 바꾸면 그 블록은 충돌로 남고 옮겨지지 않는다. 나머지는 옮겨지고, 고정 회의는 요청에 없다. */
    @Test void changedItemsBecomeConflictsAndOthersMove() {
        var write = block("보고서 쓰기", "11:00", "12:00");
        var review = block("코드 리뷰", "12:00", "13:00");
        var moves = list(preview("11:00", 30), "moves");
        var changed = planner.update(me, review.id(), new PlannerItem(null, PlannerItem.ItemType.EVENT, "코드 리뷰(다른 기기)", "개인", DAY, LocalTime.of(16, 0), LocalTime.of(17, 0), PlannerItem.ItemStatus.SCHEDULED, false, "", review.version()));
        var result = apply(moves);
        assertEquals(List.of(String.valueOf(write.id())), list(result, "moved").stream().map(m -> m.get("id")).toList());
        assertEquals(List.of(Map.of("kind", "block", "id", String.valueOf(review.id()), "title", "코드 리뷰(다른 기기)", "reason", "changed")), list(result, "conflicts"));
        var now = planner.find(me, DAY, null, null, null);
        assertEquals(LocalTime.of(11, 30), now.stream().filter(i -> i.id().equals(write.id())).findFirst().orElseThrow().startTime());
        assertEquals(LocalTime.of(16, 0), now.stream().filter(i -> i.id().equals(changed.id())).findFirst().orElseThrow().startTime());
        verify(schedules, never()).complete(anyString(), anyString(), anyString(), any());
    }

    /** 되돌리기는 옮긴 뒤 version으로 원래 시각을 보낸다. 그사이 바뀌었으면 충돌이다. */
    @Test void undoUsesNewVersions() {
        block("보고서 쓰기", "11:00", "12:00");
        var t = task("견적 회신", "16:00");
        var result = apply(list(preview("11:00", 30), "moves"));
        var undo = new ArrayList<Map<String, Object>>();
        for (var m : list(result, "moved")) { var row = new HashMap<String, Object>(Map.of("kind", m.get("kind"), "id", m.get("id"), "version", m.get("version"))); @SuppressWarnings("unchecked") var before = (Map<String, Object>) m.get("before"); row.putAll(before); undo.add(row); }
        var back = rescheduler.apply(me, new HashMap<>(Map.of("moves", undo)));
        assertEquals(2, list(back, "moved").size());
        assertEquals(LocalTime.of(16, 0), taskRepository.findById(t.getId()).orElseThrow().getDueTime());
        var stale = rescheduler.apply(me, new HashMap<>(Map.of("moves", undo)));
        assertEquals(2, list(stale, "conflicts").size());
    }

    /** 자정을 넘는 항목은 옮기지 않고 알린다. 다른 계정 항목·일정 종류·잘못된 값은 막는다. */
    @Test void rejectsAndReportsUnplaceable() {
        block("늦은 작업", "23:00", "23:50");
        task("자정 직전 마감", "23:50");
        var result = preview("22:00", 30);
        assertEquals(0, list(result, "moves").size());
        assertEquals(List.of("day-end", "day-end"), list(result, "unplaced").stream().map(u -> u.get("reason")).toList());
        var b = block("보고서 쓰기", "11:00", "12:00");
        var foreign = rescheduler.apply(UUID.randomUUID().toString(), new HashMap<>(Map.of("moves", List.of(Map.of("kind", "block", "id", String.valueOf(b.id()), "version", b.version(), "startTime", "12:00", "endTime", "13:00")))));
        assertEquals("missing", list(foreign, "conflicts").get(0).get("reason"));
        for (var bad : List.<Map<String, Object>>of(Map.of("date", "2026-11-25", "from", "11:00", "delayMinutes", 2), Map.of("date", "2026-11-25", "from", "25:00", "delayMinutes", 30), Map.of("date", "2026-11-25", "from", "11:00", "delayMinutes", 30, "x", 1)))
            assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> rescheduler.preview(me, new HashMap<>(bad))).errorCode());
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> rescheduler.apply(me, new HashMap<>(Map.of("moves", List.of(Map.of("kind", "schedule", "id", "s1", "version", 1)))))).errorCode());
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> rescheduler.apply(me, new HashMap<>(Map.of("moves", List.of(Map.of("kind", "block", "id", String.valueOf(b.id()), "version", b.version(), "startTime", "13:00", "endTime", "12:00")))))).errorCode());
    }
}
