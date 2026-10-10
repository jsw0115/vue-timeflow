// 프런트엔드 반복 규칙의 간격·요일·종료 조건과 말일·윤년 회차를 계산한다.
package kr.timebar.diary.feature;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

public final class RecurrenceRule {
    private RecurrenceRule() { }
    public static Map<String,Object> validate(Object value, String startDate) {
        if (value == null) return Map.of("frequency", "none");
        Map<String,Object> rule = FeatureInput.object(value);
        FeatureInput.keys(rule, Set.of("frequency", "interval", "weekdays", "endMode", "until", "count"));
        FeatureInput.choice(rule, "frequency", "none", "daily", "weekly", "monthly", "yearly");
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
    public static List<LocalDate> dates(String startDate, Object value, LocalDate from, LocalDate to) {
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
}
