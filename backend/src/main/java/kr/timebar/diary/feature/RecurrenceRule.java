// 프런트엔드 반복 규칙의 간격·요일·종료 조건, 말일·윤년 회차와 회차 예외(쉬는 날·회차 변경)를 계산한다.
package kr.timebar.diary.feature;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

public final class RecurrenceRule {
    /** 예외 목록은 반복 규칙 JSON 안에 저장하므로 반복마다 개수를 묶어 크기를 제한한다(Q-03). */
    public static final int MAX_EXCEPTIONS = 366;
    /** 회차 하나만 바꿀 때(override) 바꿀 수 있는 필드. 날짜는 바꾸지 않는다(IM-14 2단계). */
    public static final List<String> OVERRIDE_FIELDS = List.of("title", "startTime", "endTime");
    private RecurrenceRule() { }
    /** 루틴용 검증. 회차 예외는 쉬는 날(skip)만 받는다. */
    public static Map<String,Object> validate(Object value, String startDate) { return validate(value, startDate, false); }
    /** overrides가 참이면 일정처럼 회차 하나만 바꾸는 예외(override)도 받는다. */
    public static Map<String,Object> validate(Object value, String startDate, boolean overrides) {
        if (value == null) return Map.of("frequency", "none");
        Map<String,Object> rule = FeatureInput.object(value);
        FeatureInput.keys(rule, Set.of("frequency", "interval", "weekdays", "endMode", "until", "count", "exceptions"));
        FeatureInput.choice(rule, "frequency", "none", "daily", "weekly", "monthly", "yearly");
        exceptions(rule, overrides);
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
    /** 쉬는 날로 정한 날짜. 규칙이 없으면 빈 집합이다. 저장된 값은 쓸 때 검증했으므로 회차 변경도 읽기만 허용한다. */
    public static Set<LocalDate> skipDates(Object value) {
        Set<LocalDate> dates = new HashSet<>();
        if (value != null) exceptions(FeatureInput.object(value), true).forEach((day, item) -> { if ("skip".equals(item.get("action"))) dates.add(day); });
        return dates;
    }
    /** 회차 하나만 바꾼 날짜와 바꾼 필드(title·startTime·endTime 중 저장된 것만). */
    public static Map<LocalDate, Map<String,Object>> overrides(Object value) {
        Map<LocalDate, Map<String,Object>> result = new HashMap<>();
        if (value == null) return result;
        exceptions(FeatureInput.object(value), true).forEach((day, item) -> {
            if (!"override".equals(item.get("action"))) return;
            Map<String,Object> fields = new LinkedHashMap<>();
            for (String key : OVERRIDE_FIELDS) if (item.containsKey(key)) fields.put(key, key.equals("title") ? item.get(key).toString().trim() : item.get(key));
            result.put(day, fields);
        });
        return result;
    }
    /** 회차 변경을 적용한 시간이 성립하는지 본다. 바꾸지 않은 시각은 원본 값을 쓰고, 종료 시각은 회차 종료일에 적용한다. */
    public static void checkOverrideTimes(Object value, String startDate, String endDate, String startTime, String endTime) {
        long span = ChronoUnit.DAYS.between(FeatureInput.date(startDate), FeatureInput.date(endDate));
        overrides(value).forEach((day, fields) -> {
            LocalDateTime start = day.atTime(FeatureInput.time(fields.getOrDefault("startTime", startTime).toString()));
            LocalDateTime end = day.plusDays(span).atTime(FeatureInput.time(fields.getOrDefault("endTime", endTime).toString()));
            if (!end.isAfter(start)) FeatureInput.fail(day + " 회차 변경의 종료는 시작 이후여야 합니다.");
        });
    }
    /** 쉬는 날을 뺀 회차. 쉬는 날도 횟수 종료 조건의 회차 수에는 포함되어 반복이 뒤로 늘어나지 않는다. 회차 변경은 회차를 빼지 않는다. */
    public static List<LocalDate> dates(String startDate, Object value, LocalDate from, LocalDate to) {
        Set<LocalDate> skipped = skipDates(value);
        List<LocalDate> result = new ArrayList<>(plannedDates(startDate, value, from, to));
        result.removeIf(skipped::contains);
        return result;
    }
    /** 반복 규칙만으로 정한 회차. 회차 예외를 적용하지 않는다. */
    public static List<LocalDate> plannedDates(String startDate, Object value, LocalDate from, LocalDate to) {
        LocalDate start = FeatureInput.date(startDate); Map<String,Object> rule = validate(value, startDate, true);
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
    /** 날짜별 예외. 한 날짜에는 쉬는 날이나 회차 변경 하나만 둘 수 있다. */
    private static Map<LocalDate, Map<String,Object>> exceptions(Map<String,Object> rule, boolean overrides) {
        Object raw = rule.get("exceptions");
        if (raw == null) return Map.of();
        if (!(raw instanceof List<?> list) || list.size() > MAX_EXCEPTIONS) { FeatureInput.fail("쉬는 날·회차 변경은 반복마다 최대 " + MAX_EXCEPTIONS + "개입니다."); return Map.of(); }
        Map<LocalDate, Map<String,Object>> result = new HashMap<>();
        for (Object item : list) {
            Map<String,Object> exception = FeatureInput.object(item);
            if (overrides) FeatureInput.choice(exception, "action", "skip", "override");
            else FeatureInput.choice(exception, "action", "skip");
            // 루틴 쉬는 날의 retro(지난 날짜에 추가함)는 서버(RoutineRules)가 다시 정하는 값이라 받기만 한다(Q-19). 일정에서는 읽는 곳이 없다
            if ("skip".equals(exception.get("action"))) { FeatureInput.keys(exception, Set.of("date", "action", "retro")); if (exception.get("retro") != null && !(exception.get("retro") instanceof Boolean)) FeatureInput.fail("retro는 boolean이어야 합니다."); }
            else override(exception);
            if (result.put(FeatureInput.date(FeatureInput.text(exception, "date")), exception) != null) FeatureInput.fail("같은 날짜에는 쉬는 날이나 회차 변경을 하나만 둘 수 있습니다.");
        }
        return result;
    }
    private static void override(Map<String,Object> exception) {
        Set<String> allowed = new HashSet<>(OVERRIDE_FIELDS); allowed.addAll(Set.of("date", "action"));
        FeatureInput.keys(exception, allowed);
        if (OVERRIDE_FIELDS.stream().noneMatch(exception::containsKey)) FeatureInput.fail("회차 변경에는 바꿀 제목이나 시각이 필요합니다.");
        if (exception.containsKey("title")) FeatureInput.requiredText(exception, "title");
        for (String key : List.of("startTime", "endTime")) {
            if (!exception.containsKey(key)) continue;
            if (!(exception.get(key) instanceof String text)) { FeatureInput.fail("시간은 HH:mm 형식이어야 합니다."); return; }
            FeatureInput.time(text);
        }
    }
}
