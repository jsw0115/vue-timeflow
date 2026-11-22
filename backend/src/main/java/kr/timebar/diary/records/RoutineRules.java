// 루틴 저장 직전에 서버가 정하는 값: 지난 날짜 쉬는 날 표시와 연간 한도(Q-19), 중지 시작일과 중지 기간(Q-20).
package kr.timebar.diary.records;

import kr.timebar.diary.feature.FeatureInput;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.*;

@Component
public class RoutineRules {
    /** 지난 날짜를 쉬는 날로 추가할 수 있는 횟수. 루틴마다, 그 날짜가 속한 달력 연도 기준이다(2026-11-22 사용자 결정). */
    public static final int RETRO_SKIPS_PER_YEAR = 5;
    /** 중지·재개 기록 한도. 넘기면 오래된 기간을 지우지 않고 거부한다(지우면 지난 통계가 바뀐다). */
    public static final int MAX_PAUSED_RANGES = 100;
    private final DayPolicy days;
    public RoutineRules(DayPolicy days) { this.days = days; }

    /** previous는 수정 전 저장값(새로 만들 때는 null), data는 검증을 마친 요청 값이다. 클라이언트가 보낸 retro·pausedFrom·pausedRanges는 믿지 않고 다시 정한다. */
    public Map<String,Object> prepare(String user, Map<String,Object> previous, Map<String,Object> data) {
        return prepare(previous, data, days.of(user).today());
    }

    static Map<String,Object> prepare(Map<String,Object> previous, Map<String,Object> data, LocalDate today) {
        var result = new LinkedHashMap<String,Object>(data);
        retro(previous, result, today);
        pause(previous, result, today);
        return result;
    }

    /**
     * 오늘 이전 날짜의 쉬는 날 중 이번 저장에서 새로 생긴 것에 retro 표시를 붙인다. 미리 지정해 두었다가 날짜가 지난 쉬는 날은 retro가 아니다.
     * 한 해의 retro가 한도를 넘으면 거부한다.
     */
    private static void retro(Map<String,Object> previous, Map<String,Object> data, LocalDate today) {
        if (!(data.get("recurrence") instanceof Map<?,?> raw) || !(raw.get("exceptions") instanceof List<?> list)) return;
        Map<String,Boolean> before = new HashMap<>();
        if (previous != null && previous.get("recurrence") instanceof Map<?,?> old && old.get("exceptions") instanceof List<?> oldList)
            for (Object item : oldList) if (item instanceof Map<?,?> e && "skip".equals(e.get("action"))) before.put(String.valueOf(e.get("date")), Boolean.TRUE.equals(e.get("retro")));
        var exceptions = new ArrayList<Map<String,Object>>();
        var perYear = new TreeMap<Integer,Integer>();
        for (Object item : list) {
            var exception = new LinkedHashMap<String,Object>(FeatureInput.object(item));
            exception.remove("retro");
            if ("skip".equals(exception.get("action"))) {
                String date = String.valueOf(exception.get("date"));
                LocalDate day = FeatureInput.date(date);
                boolean retro = day.isBefore(today) && before.getOrDefault(date, true); // 처음 생긴 지난 날짜면 true, 전에 있던 날짜면 그때 표시를 따른다
                if (retro) { exception.put("retro", true); perYear.merge(day.getYear(), 1, Integer::sum); }
            }
            exceptions.add(exception);
        }
        perYear.forEach((year, count) -> { if (count > RETRO_SKIPS_PER_YEAR) FeatureInput.fail("지난 날짜 쉬는 날은 루틴마다 한 해에 " + RETRO_SKIPS_PER_YEAR + "번까지 추가할 수 있어요. " + year + "년은 " + count + "번이에요."); });
        var rule = new LinkedHashMap<String,Object>(FeatureInput.object(raw));
        rule.put("exceptions", exceptions);
        data.put("recurrence", rule);
    }

    /** 중지하면 그날부터 회차에서 빼고, 재개하면 중지했던 기간(어제까지)을 pausedRanges에 남긴다. 예전에 중지 시작일 없이 중지한 루틴은 그대로 둔다. */
    private static void pause(Map<String,Object> previous, Map<String,Object> data, LocalDate today) {
        boolean was = previous != null && Boolean.TRUE.equals(previous.get("paused"));
        boolean now = Boolean.TRUE.equals(data.get("paused"));
        var ranges = new ArrayList<Map<String,Object>>();
        if (previous != null && previous.get("pausedRanges") instanceof List<?> old)
            for (Object item : old) if (item instanceof Map<?,?> range) ranges.add(new LinkedHashMap<>(Map.of("from", String.valueOf(range.get("from")), "to", String.valueOf(range.get("to")))));
        Object from = was ? previous.get("pausedFrom") : today.toString();
        data.remove("pausedFrom");
        if (now) { if (from != null) data.put("pausedFrom", from.toString()); }
        else if (was && from != null) {
            LocalDate start = FeatureInput.date(from.toString()), end = today.minusDays(1);
            if (!end.isBefore(start)) ranges.add(new LinkedHashMap<>(Map.of("from", start.toString(), "to", end.toString())));
        }
        if (ranges.size() > MAX_PAUSED_RANGES) FeatureInput.fail("중지·재개 기록은 루틴마다 " + MAX_PAUSED_RANGES + "번까지예요.");
        if (ranges.isEmpty()) data.remove("pausedRanges"); else data.put("pausedRanges", ranges);
    }

    /** 그날이 중지 기간인지 본다. 중지 시작일이 없는 예전 중지는 모든 날을 뺀다(기존 동작). */
    public static boolean paused(Map<String,Object> routine, LocalDate day) {
        if (Boolean.TRUE.equals(routine.get("paused"))) {
            Object from = routine.get("pausedFrom");
            if (from == null || !day.isBefore(FeatureInput.date(from.toString()))) return true;
        }
        if (routine.get("pausedRanges") instanceof List<?> ranges)
            for (Object item : ranges) if (item instanceof Map<?,?> range && !day.isBefore(FeatureInput.date(String.valueOf(range.get("from")))) && !day.isAfter(FeatureInput.date(String.valueOf(range.get("to"))))) return true;
        return false;
    }
}
