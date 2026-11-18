// 프런트엔드 반복 규칙의 간격·요일·종료 조건, 말일·윤년 회차와 쉬는 날 예외를 계산한다.
package kr.timebar.diary.feature;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

public final class RecurrenceRule {
    /** 예외 목록은 반복 규칙 JSON 안에 저장하므로 반복마다 개수를 묶어 크기를 제한한다(Q-03). */
    public static final int MAX_EXCEPTIONS = 366;
    private RecurrenceRule() { }
    public static Map<String,Object> validate(Object value, String startDate) {
        if (value == null) return Map.of("frequency", "none");
        Map<String,Object> rule = FeatureInput.object(value);
        FeatureInput.keys(rule, Set.of("frequency", "interval", "weekdays", "endMode", "until", "count", "exceptions"));
        FeatureInput.choice(rule, "frequency", "none", "daily", "weekly", "monthly", "yearly");
        exceptions(rule);
        if (rule.get("frequency").equals("none")) return rule;
        FeatureInput.number(rule, "interval", 1, 99, true);
        FeatureInput.choice(rule, "endMode", "never", "until", "count");
        if (rule.get("frequency").equals("weekly")) {
            if (!(rule.get("weekdays") instanceof List<?> days) || days.isEmpty()) FeatureInput.fail("반복 요일을 선택해주세요.");
            for (Object day : (List<?>)rule.get("weekdays")) FeatureInput.number(Map.of("day", day), "day", 0, 6, true);
        }
        if (rule.get("endMode").equals("until")) FeatureInput.range(startDate, FeatureInput.requiredText(rule, "until"));
        if (rule.get("endMode").equals("count")) FeatureInput.number(rule, "count", 1, 999, true);
        return rule;
    }
    /** 쉬는 날로 정한 날짜. 규칙이 없으면 빈 집합이다. 날짜 중복·형식·개수는 여기서 함께 검증한다. */
    public static Set<LocalDate> exceptionDates(Object value) {
        return value == null ? Set.of() : exceptions(FeatureInput.object(value));
    }
    /** 쉬는 날을 뺀 회차. 쉬는 날도 횟수 종료 조건의 회차 수에는 포함되어 반복이 뒤로 늘어나지 않는다. */
    public static List<LocalDate> dates(String startDate, Object value, LocalDate from, LocalDate to) {
        Set<LocalDate> skipped = exceptionDates(value);
        List<LocalDate> result = new ArrayList<>(plannedDates(startDate, value, from, to));
        result.removeIf(skipped::contains);
        return result;
    }
    /** 반복 규칙만으로 정한 회차. 쉬는 날 예외를 적용하지 않는다. */
    public static List<LocalDate> plannedDates(String startDate, Object value, LocalDate from, LocalDate to) {
        LocalDate start = FeatureInput.date(startDate); Map<String,Object> rule = validate(value, startDate);
        String frequency = rule.get("frequency").toString();
        if (frequency.equals("none")) return start.isBefore(from) || start.isAfter(to) ? List.of() : List.of(start);
        boolean counted = rule.get("endMode").equals("count"); int limit = counted ? ((Number)rule.get("count")).intValue() : Integer.MAX_VALUE;
        int interval = ((Number)rule.get("interval")).intValue();
        LocalDate upper = rule.get("endMode").equals("until") && FeatureInput.date(rule.get("until").toString()).isBefore(to) ? FeatureInput.date(rule.get("until").toString()) : to;
        List<LocalDate> result = new ArrayList<>(); int seen = 0;
        if (frequency.equals("daily")) {
            long n = counted ? 0 : Math.max(0, (ChronoUnit.DAYS.between(start, from) + interval - 1) / interval);
            for (LocalDate day = start.plusDays(n * interval); !day.isAfter(upper) && seen < limit; day = day.plusDays(interval)) { seen++; if (!day.isBefore(from)) result.add(day); }
        } else if (frequency.equals("weekly")) {
            LocalDate week = start.minusDays(start.getDayOfWeek().getValue() % 7);
            List<Integer> weekdays = ((List<?>)rule.get("weekdays")).stream().map(day -> ((Number)day).intValue()).distinct().sorted().toList();
            long n = counted ? 0 : Math.max(0, ChronoUnit.DAYS.between(week, from) / (7L * interval));
            for (LocalDate first = week.plusWeeks(n * interval); !first.isAfter(upper) && seen < limit; first = first.plusWeeks(interval)) for (int weekday : weekdays) {
                LocalDate day = first.plusDays(weekday); if (day.isBefore(start) || day.isAfter(upper) || seen >= limit) continue;
                seen++; if (!day.isBefore(from)) result.add(day);
            }
        } else {
            int step = frequency.equals("yearly") ? interval * 12 : interval;
            long n = counted ? 0 : Math.max(0, ChronoUnit.MONTHS.between(YearMonth.from(start), YearMonth.from(from)) / step);
            for (YearMonth month = YearMonth.from(start).plusMonths(n * step); !month.atDay(1).isAfter(upper) && seen < limit; month = month.plusMonths(step)) {
                if (start.getDayOfMonth() > month.lengthOfMonth()) continue;
                LocalDate day = month.atDay(start.getDayOfMonth()); if (day.isAfter(upper)) continue;
                seen++; if (!day.isBefore(from)) result.add(day);
            }
        }
        return result;
    }
    private static Set<LocalDate> exceptions(Map<String,Object> rule) {
        Object raw = rule.get("exceptions");
        if (raw == null) return Set.of();
        if (!(raw instanceof List<?> list) || list.size() > MAX_EXCEPTIONS) { FeatureInput.fail("쉬는 날은 반복마다 최대 " + MAX_EXCEPTIONS + "개입니다."); return Set.of(); }
        Set<LocalDate> dates = new HashSet<>();
        for (Object item : list) {
            Map<String,Object> exception = FeatureInput.object(item);
            FeatureInput.keys(exception, Set.of("date", "action"));
            FeatureInput.choice(exception, "action", "skip");
            if (!dates.add(FeatureInput.date(FeatureInput.text(exception, "date")))) FeatureInput.fail("같은 날짜의 쉬는 날이 이미 있습니다.");
        }
        return dates;
    }
}
