// 실제 migration과 저장·사용자 격리·버전 충돌·업무 계층을 검증한다.
package kr.timebar.diary.feature;

import kr.timebar.diary.common.*;
import kr.timebar.diary.records.RecordService;
import kr.timebar.diary.work.WorkService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class FeaturePersistenceTest {
    @Autowired FeatureStore store;
    @Autowired RecordService records;
    @Autowired WorkService work;
    @Autowired kr.timebar.diary.records.ScheduleService schedules;
    String user;
    @BeforeEach void setup() { user = java.util.UUID.randomUUID().toString(); }

    @Test void persistedRecordsSurviveServiceRecreationAndDoNotLeakAcrossUsers() {
        var row = records.create(user, FeatureType.MEMO, Map.of("title", "테스트", "body", "#검증"));
        String id = row.get("id").toString();
        assertEquals("테스트", new RecordService(store).get(user, FeatureType.MEMO, id).get("title"));
        assertTrue(store.all("other", FeatureType.MEMO).stream().noneMatch(item -> id.equals(item.get("id"))));
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> store.get("other", FeatureType.MEMO, id)).errorCode());
    }
    @Test void oneOfTwoConcurrentWritersSucceedsAndTheOtherConflicts() throws Exception {
        String id = records.create(user, FeatureType.MEMO, Map.of("title", "초안")).get("id").toString();
        ExecutorService executor = Executors.newFixedThreadPool(2); CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Boolean>> writes = new ArrayList<>();
            for (String title : List.of("수정 A", "수정 B")) writes.add(executor.submit(() -> {
                start.await();
                try { records.update(user, FeatureType.MEMO, id, Map.of("title", title, "version", 1)); return true; }
                catch (ApiException error) { assertEquals(ErrorCode.CONFLICT, error.errorCode()); return false; }
            }));
            start.countDown(); assertNotEquals(writes.get(0).get(10, TimeUnit.SECONDS), writes.get(1).get(10, TimeUnit.SECONDS));
            assertEquals(2L, store.get(user, FeatureType.MEMO, id).get("version"));
        } finally { executor.shutdownNow(); }
    }
    @Test void moneySummaryUsesSignedAmountsAndTheEntireFilteredRange() {
        records.create(user, FeatureType.MONEY, Map.of("title", "수입", "date", "2026-10-10", "amount", 100, "type", "in"));
        records.create(user, FeatureType.MONEY, Map.of("title", "지출", "date", "2026-10-10", "amount", -25, "type", "out", "category", "식비"));
        records.create(user, FeatureType.MONEY, Map.of("title", "지난달", "date", "2026-09-10", "amount", -50, "type", "out"));
        var summary = records.moneySummary(user, "2026-10-01", "2026-10-31");
        assertEquals(100L, summary.get("income")); assertEquals(25L, summary.get("expense")); assertEquals(75L, summary.get("balance"));
    }
    @Test void wbsRejectsCyclesRollsUpWeightedProgressAndDeletesDescendants() {
        var root = work.create(user, FeatureType.WBS, Map.of("title", "프로젝트", "md", 0, "progress", 0)); String parent = root.get("id").toString();
        var one = work.create(user, FeatureType.WBS, Map.of("title", "A", "parentId", parent, "md", 2, "progress", 100));
        work.create(user, FeatureType.WBS, Map.of("title", "B", "parentId", parent, "md", 3, "progress", 0));
        var rollup = work.wbs(user); assertEquals(5.0, rollup.get("totalMd")); assertEquals(40L, rollup.get("totalProgress"));
        assertThrows(ApiException.class, () -> work.update(user, FeatureType.WBS, parent, Map.of("title", "순환", "md", 0, "progress", 0, "parentId", one.get("id"), "version", 1)));
        assertEquals(1L, store.get(user, FeatureType.WBS, parent).get("version"));
        work.delete(user, FeatureType.WBS, parent, 1); assertTrue(store.all(user, FeatureType.WBS).isEmpty());
    }
    @Test void wikiHistoryIsServerGeneratedAndDeletingParentPromotesChildren() {
        var root = work.create(user, FeatureType.WIKI, Map.of("title", "상위", "space", "개발", "body", "원본")); String id = root.get("id").toString();
        var child = work.create(user, FeatureType.WIKI, Map.of("title", "하위", "space", "개발", "parentId", id));
        work.update(user, FeatureType.WIKI, id, Map.of("title", "수정", "space", "개발", "body", "최신", "version", 1));
        assertEquals("원본", work.history(user, id).get(0).get("body")); assertEquals(2, work.current(user, FeatureType.WIKI).size());
        assertThrows(ApiException.class, () -> work.delete(user, FeatureType.WIKI, id + "@1", 1));
        assertThrows(ApiException.class, () -> work.update(user, FeatureType.WIKI, id + "@1", Map.of("title", "위조", "space", "개발", "version", 1)));
        work.delete(user, FeatureType.WIKI, id, 2); assertNull(store.get(user, FeatureType.WIKI, child.get("id").toString()).get("parentId"));
    }
    @Test void realDatesMalformedBoardAndImpossibleWorkRecordsAreRejectedBeforeStorage() {
        assertThrows(ApiException.class, () -> records.create(user, FeatureType.DIARY, Map.of("title", "invalid", "date", "2026-02-30")));
        assertThrows(ApiException.class, () -> FeatureInput.validate(FeatureType.MONEY, Map.of("title", "invalid", "date", "2026-10-10", "type", "out", "amount", 10)));
        assertThrows(ApiException.class, () -> FeatureInput.validate(FeatureType.BOARD, Map.of("columns", List.of(Map.of("id", "todo", "title", "할 일", "wip", 0)), "cards", List.of(Map.of("id", "card", "columnId", "unknown", "title", "카드", "priority", "normal", "order", 1)))));
        assertThrows(ApiException.class, () -> FeatureInput.validate(FeatureType.WORK_RECORD, Map.of("title", "반차", "type", "반차", "owner", "나", "startDate", "2026-10-10", "endDate", "2026-10-11", "startTime", "09:00", "endTime", "10:00", "half", "오전")));
        assertTrue(store.all(user, FeatureType.DIARY).isEmpty());
    }
    @Test void recurrenceMatchesMonthEndLeapYearWeekdaysAndCountRules() {
        var monthly = Map.of("frequency", "monthly", "interval", 1, "endMode", "count", "count", 3);
        assertEquals(List.of(java.time.LocalDate.parse("2026-01-31"), java.time.LocalDate.parse("2026-03-31"), java.time.LocalDate.parse("2026-05-31")), RecurrenceRule.dates("2026-01-31", monthly, java.time.LocalDate.parse("2026-01-01"), java.time.LocalDate.parse("2026-12-31")));
        var yearly = Map.of("frequency", "yearly", "interval", 1, "endMode", "count", "count", 2);
        assertEquals(List.of(java.time.LocalDate.parse("2024-02-29"), java.time.LocalDate.parse("2028-02-29")), RecurrenceRule.dates("2024-02-29", yearly, java.time.LocalDate.parse("2024-01-01"), java.time.LocalDate.parse("2030-01-01")));
        var weekly = Map.of("frequency", "weekly", "interval", 2, "endMode", "count", "count", 3, "weekdays", List.of(1,3));
        assertEquals(List.of(java.time.LocalDate.parse("2026-10-05"), java.time.LocalDate.parse("2026-10-07"), java.time.LocalDate.parse("2026-10-19")), RecurrenceRule.dates("2026-10-05", weekly, java.time.LocalDate.parse("2026-10-01"), java.time.LocalDate.parse("2026-11-01")));
    }
    @Test void multiDayOccurrencesOverlapVisibleRangeAndRoutineCompletionIsIdempotent() {
        records.create(user, FeatureType.SCHEDULE, Map.of("title", "자정 넘김", "startDate", "2026-10-09", "endDate", "2026-10-10", "startTime", "23:00", "endTime", "01:00"));
        assertEquals(1, schedules.occurrences(user, "2026-10-10", "2026-10-10").size());
        String today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Seoul")).toString();
        String id = records.create(user, FeatureType.ROUTINE_RECORD, Map.of("title", "물 마시기", "startDate", today, "time", "08:00", "duration", 1, "days", List.of(0,1,2,3,4,5,6), "goal", Map.of("count", 8, "unit", "잔"))).get("id").toString();
        schedules.complete(user, id, today, Map.of("completed", true)); schedules.complete(user, id, today, Map.of("completed", true));
        assertEquals(1, store.all(user, FeatureType.ROUTINE_COMPLETION).size()); assertEquals(100L, schedules.history(user, id, today, today).get("rate"));
    }
}
