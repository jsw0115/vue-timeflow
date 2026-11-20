// 실제 기록의 타이머 모드·목표 시간·일시정지 구간을 검사하고 일시정지를 뺀 기록 시간을 한 곳에서 계산한다(PR-09 UF-120~UF-122).
package kr.timebar.diary.records;

import kr.timebar.diary.feature.FeatureInput;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

public final class RecordingTime {
    /** 기록 하나의 일시정지 횟수 한도. 저장 크기를 묶는다. */
    public static final int MAX_PAUSES = 100;
    public static final Set<String> MODES = Set.of("pomodoro", "countdown", "stopwatch");

    private RecordingTime() { }

    /**
     * 타이머 모드와 목표 시간을 확인한다. 포모도로·카운트다운은 목표 1~1,440분이 필요하고,
     * 스톱워치와 모드 없는 기록(플래너의 실제 기록)은 목표 시간을 받지 않는다(UT-210, UT-211).
     */
    public static void validateTimer(Map<String,Object> body) {
        String mode = FeatureInput.text(body, "mode");
        if (body.containsKey("mode") && !MODES.contains(mode)) FeatureInput.fail("mode는 pomodoro, countdown, stopwatch 중 하나입니다.");
        boolean target = body.containsKey("targetMinutes");
        if ("pomodoro".equals(mode) || "countdown".equals(mode)) {
            if (!target) FeatureInput.fail("포모도로·카운트다운은 목표 시간(targetMinutes)이 필요합니다.");
            FeatureInput.number(body, "targetMinutes", 1, 1440, true);
        } else if (target) FeatureInput.fail("목표 시간은 포모도로·카운트다운에만 정합니다.");
    }

    /**
     * 일시정지 구간을 확인한다. 시작 이후, 서로 겹치지 않게 시간 순서로 놓이고, 끝은 시작보다 늦다.
     * 끝(to)이 없는 구간은 마지막에 하나만 둘 수 있다(일시정지 중). end가 있으면 모든 구간이 그 안에 있어야 한다.
     */
    public static List<Instant[]> pauses(Map<String,Object> row, Instant start, Instant end) {
        Object raw = row.get("pauses");
        if (raw == null) return List.of();
        if (!(raw instanceof List<?> list)) { FeatureInput.fail("pauses는 배열입니다."); return List.of(); }
        if (list.size() > MAX_PAUSES) FeatureInput.fail("일시정지는 한 기록에 " + MAX_PAUSES + "번까지입니다.");
        var result = new ArrayList<Instant[]>();
        Instant last = start;
        for (int i = 0; i < list.size(); i++) {
            if (!(list.get(i) instanceof Map<?,?> item)) { FeatureInput.fail("일시정지 구간 형식이 올바르지 않습니다."); continue; }
            @SuppressWarnings("unchecked") var pause = (Map<String,Object>)item;
            FeatureInput.keys(pause, Set.of("from", "to"));
            Instant from = FeatureInput.instant(FeatureInput.requiredText(pause, "from"));
            Instant to = pause.get("to") == null ? null : FeatureInput.instant(pause.get("to").toString());
            if (to == null && i != list.size() - 1) FeatureInput.fail("끝나지 않은 일시정지는 마지막에만 있을 수 있습니다.");
            if (from.isBefore(last) || to != null && !to.isAfter(from) || end != null && (to == null || to.isAfter(end)))
                FeatureInput.fail("일시정지 구간은 기록 안에서 시간 순서로 겹치지 않아야 합니다.");
            result.add(new Instant[] { from, to });
            if (to != null) last = to;
        }
        return result;
    }

    /** 끝낸 기록 전체에서 일시정지를 뺀 초. */
    public static long seconds(Map<String,Object> row) {
        return seconds(row, Instant.MIN, Instant.MAX);
    }

    /** 끝낸 기록이 [from, to) 구간과 겹친 초에서 같은 구간과 겹친 일시정지를 뺀다. 음수는 만들지 않는다. */
    public static long seconds(Map<String,Object> row, Instant from, Instant to) {
        Instant start = Instant.parse(row.get("startedAt").toString()), end = Instant.parse(row.get("endedAt").toString());
        long total = overlap(start, end, from, to);
        for (var pause : pauses(row, start, end)) total -= overlap(pause[0], pause[1], from, to);
        return Math.max(0, total);
    }

    /** 다음 일시정지·종료가 가능한 가장 이른 시각. 시작 또는 마지막 일시정지·재개 시각이다. */
    public static Instant lastBoundary(Map<String,Object> row) {
        Instant last = Instant.parse(row.get("startedAt").toString());
        for (var pause : pauses(row, last, null)) last = pause[1] == null ? pause[0] : pause[1];
        return last;
    }

    private static long overlap(Instant a, Instant b, Instant from, Instant to) {
        Instant left = a.isAfter(from) ? a : from, right = b.isBefore(to) ? b : to;
        return right.isAfter(left) ? Duration.between(left, right).getSeconds() : 0;
    }
}
