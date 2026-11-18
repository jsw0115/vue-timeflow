// 여러 날 일정과 반복 루틴의 회차 조회 및 날짜별 완료 기록을 처리한다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional
public class ScheduleService {
    private final FeatureStore store;
    public ScheduleService(FeatureStore store) { this.store = store; }
    public List<Map<String,Object>> occurrences(String user, String from, String to) {
        LocalDate start = FeatureInput.date(from), end = FeatureInput.date(to);
        if (end.isBefore(start) || ChronoUnit.DAYS.between(start, end) > 366) FeatureInput.fail("조회 기간은 최대 367일입니다.");
        List<Map<String,Object>> result = new ArrayList<>();
        for (var event : store.all(user, FeatureType.SCHEDULE)) {
            long span = ChronoUnit.DAYS.between(FeatureInput.date(event.get("startDate").toString()), FeatureInput.date(event.get("endDate").toString()));
            for (LocalDate day : RecurrenceRule.dates(event.get("startDate").toString(), event.get("recurrence"), start.minusDays(span), end)) {
                var row = new LinkedHashMap<>(event); row.put("sourceId", event.get("id")); row.put("occurrenceKey", event.get("id") + ":" + day);
                row.put("startDate", day.toString()); row.put("endDate", day.plusDays(span).toString()); result.add(row);
            }
        }
        return result;
    }
    public Map<String,Object> complete(String user, String id, String date, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("completed", "version")); if (!(body.get("completed") instanceof Boolean)) FeatureInput.fail("completed는 boolean입니다.");
        var routine = store.lock(user, FeatureType.ROUTINE_RECORD, id); LocalDate day = FeatureInput.date(date);
        if (day.isAfter(LocalDate.now(ZoneId.of("Asia/Seoul"))) || !planned(routine, day)) FeatureInput.fail("루틴 회차 날짜를 확인해주세요.");
        if (RecurrenceRule.exceptionDates(routine.get("recurrence")).contains(day)) FeatureInput.fail("쉬는 날로 정한 날짜입니다. 쉬는 날을 해제한 뒤 기록해주세요.");
        var data = Map.of("routineId", id, "date", date, "completed", body.get("completed")); String key = id + "@" + date;
        var previous = store.optional(user, FeatureType.ROUTINE_COMPLETION, key);
        if (previous.isEmpty()) return store.create(user, FeatureType.ROUTINE_COMPLETION, key, data);
        if (previous.get().get("completed").equals(body.get("completed"))) return previous.get();
        return store.replace(user, FeatureType.ROUTINE_COMPLETION, key, FeatureInput.version(body), data);
    }
    public Map<String,Object> history(String user, String id, String from, String to) { return history(user, id, from, to, LocalDate.now(ZoneId.of("Asia/Seoul"))); }
    Map<String,Object> history(String user, String id, String from, String to, LocalDate today) {
        var routine = store.get(user, FeatureType.ROUTINE_RECORD, id); LocalDate start = FeatureInput.date(from), end = FeatureInput.date(to);
        if (end.isBefore(start) || ChronoUnit.DAYS.between(start, end) > 366) FeatureInput.fail("조회 기간은 최대 367일입니다.");
        Map<String,Boolean> logs = new HashMap<>(); for (var row : store.all(user, FeatureType.ROUTINE_COMPLETION)) if (id.equals(row.get("routineId"))) logs.put(row.get("date").toString(), Boolean.TRUE.equals(row.get("completed")));
        Set<LocalDate> skipped = RecurrenceRule.exceptionDates(routine.get("recurrence"));
        // Q-05: 쉬는 날과 반복에 없는 날은 계산에서 빼고, 지난 미완료 회차만 연속 기록을 끊는다. 오늘·미래의 미완료 회차는 아직 놓친 날이 아니다.
        List<Map<String,Object>> rows = new ArrayList<>(); int done = 0, total = 0, rest = 0, streak = 0, best = 0;
        for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
            if (!planned(routine, day)) continue;
            boolean completed = logs.getOrDefault(day.toString(), false); String status;
            if (skipped.contains(day)) { status = "skipped"; rest++; }
            else if (completed) { status = "done"; done++; total++; streak++; best = Math.max(best, streak); }
            else if (!day.isBefore(today)) status = "pending";
            else { status = "missed"; total++; streak = 0; }
            rows.add(Map.of("date", day.toString(), "completed", completed, "status", status));
        }
        return Map.of("routineId", id, "items", rows, "done", done, "total", total, "skipped", rest, "rate", total == 0 ? 0 : Math.round(100.0 * done / total), "streak", streak, "best", best);
    }
    /** 반복 규칙(없으면 요일)으로 정한 회차인지 본다. 쉬는 날 예외는 호출하는 쪽에서 따로 확인한다. */
    private boolean planned(Map<String,Object> routine, LocalDate day) {
        if (Boolean.TRUE.equals(routine.get("paused")) || day.isBefore(FeatureInput.date(routine.get("startDate").toString()))) return false;
        if (routine.get("recurrence") != null && !"none".equals(FeatureInput.object(routine.get("recurrence")).get("frequency"))) return !RecurrenceRule.plannedDates(routine.get("startDate").toString(), routine.get("recurrence"), day, day).isEmpty();
        return ((List<?>)routine.get("days")).stream().anyMatch(value -> ((Number)value).intValue() == day.getDayOfWeek().getValue() % 7);
    }
}
