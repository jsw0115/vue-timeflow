// 계획 실행률(PR-19 UF-136, 09 Q-40): 계획 시간(일정·계획 블록) 중 실제 기록이 겹친 분 ÷ 계획 분.
// 계획 밖 실제 기록은 실행률에 넣지 않고 실제 활동 총량으로 따로 돌려준다. 날짜는 사용자 시간대·하루 시작 시각 기준이다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.planner.PlannerItem;
import kr.timebar.diary.planner.PlannerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ExecutionRate {
    public static final int MAX_DAYS = 366;
    private final ScheduleService schedules;
    private final PlannerService planner;
    private final FeatureStore store;
    private final DayPolicy days;
    public ExecutionRate(ScheduleService schedules, PlannerService planner, FeatureStore store, DayPolicy days) { this.schedules = schedules; this.planner = planner; this.store = store; this.days = days; }

    private record Span(Instant start, Instant end) { long seconds() { return Math.max(0, Duration.between(start, end).getSeconds()); } }

    public Map<String, Object> range(String user, String from, String to) {
        LocalDate a = FeatureInput.date(from), b = FeatureInput.date(to);
        if (b.isBefore(a)) FeatureInput.fail("끝 날짜는 시작 날짜와 같거나 뒤여야 해요.");
        if (ChronoUnit.DAYS.between(a, b) + 1 > MAX_DAYS) FeatureInput.fail("기간은 " + MAX_DAYS + "일까지예요.");
        var clock = days.of(user); ZoneId zone = clock.zone();
        // 하루 시작이 0시가 아니면 전날 날짜의 계획이 이 날에 걸칠 수 있어 하루 앞부터 읽는다
        var plans = new ArrayList<Span>();
        for (var row : schedules.occurrences(user, a.minusDays(1).toString(), b.toString())) {
            Instant start = LocalDateTime.of(LocalDate.parse(row.get("startDate").toString()), LocalTime.parse(row.get("startTime").toString())).atZone(zone).toInstant();
            Instant end = LocalDateTime.of(LocalDate.parse(row.get("endDate").toString()), LocalTime.parse(row.get("endTime").toString())).atZone(zone).toInstant();
            if (end.isAfter(start)) plans.add(new Span(start, end));
        }
        for (PlannerItem item : planner.find(user, null, null, null, null)) {
            if (item.date() == null || item.startTime() == null || item.endTime() == null || item.status() == PlannerItem.ItemStatus.CANCELLED) continue;
            if (item.date().isBefore(a.minusDays(1)) || item.date().isAfter(b)) continue;
            Instant start = item.date().atTime(item.startTime()).atZone(zone).toInstant(), end = item.date().atTime(item.endTime()).atZone(zone).toInstant();
            if (end.isAfter(start)) plans.add(new Span(start, end));
        }
        var actuals = new ArrayList<Span>();
        for (var row : store.all(user, FeatureType.ACTUAL_SESSION)) {
            if (!"COMPLETED".equals(row.get("state"))) continue;
            Instant start = Instant.parse(row.get("startedAt").toString()), end = Instant.parse(row.get("endedAt").toString());
            // 일시정지 구간은 실제 기록에서 뺀다(통계와 같은 규칙)
            Instant cursor = start;
            var pauses = new ArrayList<>(RecordingTime.pauses(row, start, end)); pauses.sort(Comparator.comparing(p -> p[0]));
            for (Instant[] p : pauses) { if (p[0].isAfter(cursor)) actuals.add(new Span(cursor, p[0])); if (p[1].isAfter(cursor)) cursor = p[1]; }
            if (end.isAfter(cursor)) actuals.add(new Span(cursor, end));
        }
        var dayRows = new ArrayList<Map<String, Object>>();
        long plannedTotal = 0, executedTotal = 0, actualTotal = 0;
        for (LocalDate d = a; !d.isAfter(b); d = d.plusDays(1)) {
            Instant ds = clock.start(d), de = clock.end(d);
            var plan = union(clip(plans, ds, de));
            var act = union(clip(actuals, ds, de));
            long planned = total(plan), actual = total(act), executed = overlap(plan, act);
            plannedTotal += planned; executedTotal += executed; actualTotal += actual;
            dayRows.add(row(d.toString(), planned, executed, actual));
        }
        var result = new LinkedHashMap<String, Object>();
        result.put("from", a.toString()); result.put("to", b.toString()); result.put("days", dayRows);
        result.put("totals", row(null, plannedTotal, executedTotal, actualTotal));
        return result;
    }

    private static Map<String, Object> row(String date, long planned, long executed, long actual) {
        var out = new LinkedHashMap<String, Object>();
        if (date != null) out.put("date", date);
        out.put("plannedMinutes", planned / 60); out.put("executedMinutes", executed / 60); out.put("actualMinutes", actual / 60);
        // 계획이 없는 날은 실행률이 없다(0%가 아니다). 계획 없이 한 활동을 실패로 세지 않는다
        out.put("rate", planned == 0 ? null : (int) Math.round(executed * 100.0 / planned));
        return out;
    }
    private static List<Span> clip(List<Span> spans, Instant from, Instant to) {
        var out = new ArrayList<Span>();
        for (var s : spans) { Instant start = s.start().isBefore(from) ? from : s.start(), end = s.end().isAfter(to) ? to : s.end(); if (end.isAfter(start)) out.add(new Span(start, end)); }
        return out;
    }
    /** 겹치는 구간을 합쳐 같은 시간을 두 번 세지 않는다. */
    private static List<Span> union(List<Span> spans) {
        var sorted = new ArrayList<>(spans); sorted.sort(Comparator.comparing(Span::start));
        var out = new ArrayList<Span>();
        for (var s : sorted) {
            if (!out.isEmpty() && !s.start().isAfter(out.get(out.size() - 1).end())) {
                var last = out.remove(out.size() - 1); out.add(new Span(last.start(), s.end().isAfter(last.end()) ? s.end() : last.end()));
            } else out.add(s);
        }
        return out;
    }
    private static long total(List<Span> spans) { return spans.stream().mapToLong(Span::seconds).sum(); }
    private static long overlap(List<Span> plan, List<Span> act) {
        long sum = 0;
        for (var p : plan) for (var x : act) { Instant start = p.start().isAfter(x.start()) ? p.start() : x.start(), end = p.end().isBefore(x.end()) ? p.end() : x.end(); if (end.isAfter(start)) sum += Duration.between(start, end).getSeconds(); }
        return sum;
    }
}
