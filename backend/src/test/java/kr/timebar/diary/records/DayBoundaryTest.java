// 사용자 시간대·하루 경계로 기록의 날짜를 정하고, 저장된 시각은 바꾸지 않는지 검증한다(PR-08 2단계, TS-31).
package kr.timebar.diary.records;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.auth.UserRole;
import kr.timebar.diary.auth.UserStatus;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.operations.SettingsService;
import kr.timebar.diary.planner.PlannerAggregationService;
import kr.timebar.diary.planner.PlannerService;
import kr.timebar.diary.planner.PlannerViewResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(FeatureTestConfig.class)
class DayBoundaryTest {
    @Autowired FeatureStore store;
    @Autowired RecordService records;
    @Autowired ScheduleService schedules;
    @Autowired SettingsService settings;
    @Autowired UserRepository users;
    @Autowired DayPolicy days;
    @Autowired JdbcTemplate jdbc;
    String user;
    InsightService insight;

    @BeforeEach void setup() {
        user = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO users(id) VALUES (?)", user);
        zone("Asia/Seoul");
        var aggregation = mock(PlannerAggregationService.class);
        when(aggregation.range(eq(user), any(), any())).thenReturn(new PlannerViewResponse(List.of(), List.of(), List.of()));
        insight = new InsightService(store, aggregation, mock(PlannerService.class), schedules, days);
    }

    /** UT-146: 11-18 23:30~11-19 01:30 기록은 두 날짜에 30분·90분으로 나뉘고 기간 합계는 120분이다. 원본 ID는 하나다. */
    @Test void recordAcrossMidnightIsSplitButCountedOnce() {
        String id = actual("2026-11-18T14:30:00Z", "2026-11-18T16:30:00Z");
        assertEquals(30L, actualMinutes("2026-11-18", "2026-11-18"));
        assertEquals(90L, actualMinutes("2026-11-19", "2026-11-19"));
        assertEquals(120L, actualMinutes("2026-11-18", "2026-11-19"));
        assertEquals(List.of(id), insight.timeBlocks(user, "2026-11-19", null).stream().map(block -> block.get("id")).toList());
    }

    /** UT-147: 하루 경계를 04:00으로 정하면 11-19 03:00~03:30 기록은 11-18 기록이고 11-18 일간 통계에 들어간다. */
    @Test void earlyMorningRecordBelongsToPreviousDayWithBoundary() {
        actual("2026-11-18T18:00:00Z", "2026-11-18T18:30:00Z");
        profile(Map.of("nickname", "점검", "dayStartHour", 4));
        assertEquals(30L, actualMinutes("2026-11-18", "2026-11-18"));
        assertEquals(0L, actualMinutes("2026-11-19", "2026-11-19"));
        assertEquals(1, insight.timeBlocks(user, "2026-11-18", null).size());
    }

    /** UT-148: America/New_York의 2026-11-01은 25시간, 2026-03-08은 23시간이고 기록이 빠지거나 겹치지 않는다. */
    @Test void daylightSavingDaysHaveTheirRealLength() {
        zone("America/New_York");
        actual("2026-10-31T12:00:00Z", "2026-11-02T12:00:00Z");
        assertEquals(1500L, actualMinutes("2026-11-01", "2026-11-01"));
        assertEquals(actualMinutes("2026-10-31", "2026-11-02"), actualMinutes("2026-10-31", "2026-10-31") + 1500L + actualMinutes("2026-11-02", "2026-11-02"));
        assertEquals(2880L, actualMinutes("2026-10-31", "2026-11-02"));
        actual("2026-03-07T12:00:00Z", "2026-03-09T12:00:00Z");
        assertEquals(1380L, actualMinutes("2026-03-08", "2026-03-08"));
        assertEquals(2880L, actualMinutes("2026-03-07", "2026-03-09"));
    }

    /** UT-149: 경계를 00:00에서 04:00으로 바꿔도 저장된 시작·종료 시각은 그대로이고 날짜 귀속만 바뀐다. */
    @Test void changingBoundaryKeepsStoredTimes() {
        String id = actual("2026-11-18T18:00:00Z", "2026-11-18T18:30:00Z");
        var before = store.get(user, FeatureType.ACTUAL_SESSION, id);
        assertEquals(30L, actualMinutes("2026-11-19", "2026-11-19"));
        profile(Map.of("nickname", "점검", "dayStartHour", 4));
        var after = store.get(user, FeatureType.ACTUAL_SESSION, id);
        assertEquals(before, after);
        assertEquals(0L, actualMinutes("2026-11-19", "2026-11-19"));
        assertEquals(30L, actualMinutes("2026-11-18", "2026-11-18"));
    }

    /** 일정 계획 시간도 같은 경계를 쓴다. 경계 04:00이면 11-19 02:00~03:00 일정은 11-18 계획이다. */
    @Test void plannedSchedulesFollowTheSameBoundary() {
        records.create(user, FeatureType.SCHEDULE, new LinkedHashMap<>(Map.of("title", "야간 근무", "startDate", "2026-11-19", "endDate", "2026-11-19", "startTime", "02:00", "endTime", "03:00")));
        assertEquals(60L, insight.stats(user, "2026-11-19", "2026-11-19").get("plannedMinutes"));
        profile(Map.of("nickname", "점검", "dayStartHour", 4));
        assertEquals(60L, insight.stats(user, "2026-11-18", "2026-11-18").get("plannedMinutes"));
        assertEquals(0L, insight.stats(user, "2026-11-19", "2026-11-19").get("plannedMinutes"));
    }

    /** 경계는 0~6 정수만 받고, 오늘은 사용자 시간대와 경계로 정한다. */
    @Test void boundaryIsValidatedAndDecidesToday() {
        for (Object hour : List.of(7, -1, 2.5, "4")) {
            var body = new LinkedHashMap<String,Object>(Map.of("nickname", "점검")); body.put("dayStartHour", hour);
            assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> settings.profile(user, body)).errorCode());
        }
        assertEquals(4, ((Map<?,?>) profile(Map.of("nickname", "점검", "dayStartHour", 4)).get("extra")).get("dayStartHour"));
        var clock = Clock.fixed(Instant.parse("2026-11-18T18:00:00Z"), ZoneOffset.UTC); // 서울 11-19 03:00
        assertEquals(LocalDate.of(2026, 11, 18), new DayPolicy(users, store, clock).of(user).today());
        profile(Map.of("nickname", "점검", "dayStartHour", 0));
        assertEquals(LocalDate.of(2026, 11, 19), new DayPolicy(users, store, clock).of(user).today());
    }

    private void zone(String zone) {
        var account = new UserEntity(user + "@example.test", "점검", "hash", UserRole.USER, UserStatus.ACTIVE);
        account.changeTimeZone(zone);
        when(users.findById(user)).thenReturn(Optional.of(account));
    }
    private Map<String,Object> profile(Map<String,Object> body) { return settings.profile(user, new LinkedHashMap<>(body)); }
    private String actual(String start, String end) {
        long seconds = Duration.between(Instant.parse(start), Instant.parse(end)).getSeconds();
        return store.create(user, FeatureType.ACTUAL_SESSION, Map.of("title", "기록", "state", "COMPLETED", "timeZone", "Asia/Seoul",
                "startedAt", start, "endedAt", end, "elapsedSeconds", seconds)).get("id").toString();
    }
    private long actualMinutes(String from, String to) { return (Long) insight.stats(user, from, to).get("actualMinutes"); }
}
