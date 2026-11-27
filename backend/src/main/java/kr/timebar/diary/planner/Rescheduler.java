// 재배치 제안(PR-19 UF-137, Q-36): 하루 계획이 밀렸을 때 그 뒤의 계획 블록과 마감 시각 있는 할 일을 밀린 만큼 뒤로 옮기는 안을 만들고,
// 사용자가 고른 항목만 version을 확인해 옮긴다. 일정(SCHEDULE)은 다른 사람과의 약속일 수 있어 언제나 고정이며 옮기지 않는다.
package kr.timebar.diary.planner;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.records.ScheduleService;
import kr.timebar.diary.task.TaskEntity;
import kr.timebar.diary.task.TaskRepository;
import kr.timebar.diary.task.TaskStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Service
@Transactional
public class Rescheduler {
    /** 밀린 시간은 5분~8시간, 한 번에 옮기는 항목은 50개까지다. 원문에 없는 제안값이다. */
    public static final int MIN_DELAY = 5, MAX_DELAY = 480, MAX_MOVES = 50;
    private static final int DAY = 24 * 60;
    private final PlannerItemRepository blocks;
    private final TaskRepository tasks;
    private final ScheduleService schedules;
    public Rescheduler(PlannerItemRepository blocks, TaskRepository tasks, ScheduleService schedules) { this.blocks = blocks; this.tasks = tasks; this.schedules = schedules; }

    private static int minutes(LocalTime time) { return time.getHour() * 60 + time.getMinute(); }
    private static String clock(int minutes) { return String.format("%02d:%02d", minutes / 60, minutes % 60); }
    private static LocalTime time(Object value, String field) {
        String text = Objects.toString(value, "");
        if (!text.matches("\\d{2}:\\d{2}")) FeatureInput.fail(field + "는 HH:mm 시각이에요.");
        try { return LocalTime.parse(text); } catch (RuntimeException e) { FeatureInput.fail(field + "는 HH:mm 시각이에요."); return null; }
    }
    private static boolean open(PlannerItem.ItemStatus status) { return status != PlannerItem.ItemStatus.DONE && status != PlannerItem.ItemStatus.CANCELLED; }
    private static boolean open(TaskStatus status) { return status != TaskStatus.DONE && status != TaskStatus.CANCELED; }

    /** 그날 고정 구간(분). 여러 날에 걸친 일정은 그날 안으로 자른다. */
    private List<int[]> fixed(String user, LocalDate date, List<Map<String, Object>> titles) {
        var result = new ArrayList<int[]>();
        for (var row : schedules.occurrences(user, date.toString(), date.toString())) {
            LocalDate startDate = LocalDate.parse(row.get("startDate").toString()), endDate = LocalDate.parse(row.get("endDate").toString());
            if (date.isBefore(startDate) || date.isAfter(endDate)) continue;
            int start = startDate.isBefore(date) ? 0 : minutes(LocalTime.parse(row.get("startTime").toString()));
            int end = endDate.isAfter(date) ? DAY : minutes(LocalTime.parse(row.get("endTime").toString()));
            if (end <= start) continue;
            result.add(new int[]{start, end});
            titles.add(Map.of("title", Objects.toString(row.get("title"), ""), "startTime", clock(start), "endTime", end == DAY ? "24:00" : clock(end)));
        }
        return result;
    }

    /**
     * 제안을 만든다. from 이후 시작하는 열린 계획 블록은 시작 순서대로 (원래 시작+밀린 분)과 앞 블록 끝 중 늦은 때에 놓고,
     * 고정 구간(일정과 from 전에 시작한 블록)과 겹치면 그 구간이 끝난 뒤로 민다. 마감 시각 있는 열린 할 일은 마감을 밀린 분만큼 늦춘다.
     * 자정을 넘으면 옮기지 않고 unplaced로 돌려준다. 아무것도 바꾸지 않는다.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> preview(String user, Map<String, Object> body) {
        if (body == null) FeatureInput.fail("요청 본문이 필요합니다.");
        FeatureInput.keys(body, Set.of("date", "from", "delayMinutes"));
        LocalDate date = FeatureInput.date(FeatureInput.requiredText(body, "date"));
        int from = minutes(time(body.get("from"), "from"));
        if (!(body.get("delayMinutes") instanceof Number n) || n.doubleValue() != n.intValue() || n.intValue() < MIN_DELAY || n.intValue() > MAX_DELAY) {
            FeatureInput.fail("밀린 시간은 " + MIN_DELAY + "~" + MAX_DELAY + "분이에요."); return null;
        }
        int delay = ((Number) body.get("delayMinutes")).intValue();
        var fixedTitles = new ArrayList<Map<String, Object>>();
        var obstacles = fixed(user, date, fixedTitles);
        var dayBlocks = blocks.findByUserIdOrderByStartTimeAsc(user).stream()
                .filter(b -> date.equals(b.getDate()) && b.getStartTime() != null && b.getEndTime() != null && open(b.getStatus())).toList();
        for (var b : dayBlocks) if (minutes(b.getStartTime()) < from) obstacles.add(new int[]{minutes(b.getStartTime()), minutes(b.getEndTime())});
        var moves = new ArrayList<Map<String, Object>>(); var unplaced = new ArrayList<Map<String, Object>>();
        int cursor = 0;
        for (var b : dayBlocks.stream().filter(b -> minutes(b.getStartTime()) >= from).sorted(Comparator.comparing(PlannerItemEntity::getStartTime)).toList()) {
            int start = minutes(b.getStartTime()), length = minutes(b.getEndTime()) - start;
            int next = Math.max(start + delay, cursor);
            for (boolean moved = true; moved; ) {
                moved = false;
                for (int[] o : obstacles) if (next < o[1] && next + length > o[0]) { next = o[1]; moved = true; }
            }
            if (next + length > DAY - 1) { unplaced.add(Map.of("kind", "block", "id", String.valueOf(b.getId()), "title", b.getTitle(), "reason", "day-end")); continue; }
            cursor = next + length;
            moves.add(move("block", String.valueOf(b.getId()), b.getPublicVersion(), b.getTitle(), Map.of("startTime", clock(start), "endTime", clock(start + length)), Map.of("startTime", clock(next), "endTime", clock(next + length))));
        }
        for (var t : tasks.findByUserIdAndDeletedAtIsNullOrderByDueAscCreatedAtAsc(user).stream().filter(t -> date.equals(t.getDue()) && t.getDueTime() != null && open(t.getStatus()) && minutes(t.getDueTime()) >= from)
                .sorted(Comparator.comparing(TaskEntity::getDueTime)).toList()) {
            int due = minutes(t.getDueTime()) + delay;
            if (due > DAY - 1) { unplaced.add(Map.of("kind", "task", "id", t.getId(), "title", t.getTitle(), "reason", "day-end")); continue; }
            moves.add(move("task", t.getId(), t.getPublicVersion(), t.getTitle(), Map.of("dueTime", clock(minutes(t.getDueTime()))), Map.of("dueTime", clock(due))));
        }
        var result = new LinkedHashMap<String, Object>();
        result.put("date", date.toString()); result.put("from", clock(from)); result.put("delayMinutes", delay);
        result.put("fixed", fixedTitles); result.put("moves", moves); result.put("unplaced", unplaced);
        return result;
    }
    private static Map<String, Object> move(String kind, String id, long version, String title, Map<String, Object> before, Map<String, Object> after) {
        var row = new LinkedHashMap<String, Object>();
        row.put("kind", kind); row.put("id", id); row.put("version", version); row.put("title", title); row.put("before", before); row.put("after", after);
        return row;
    }

    /**
     * 고른 항목만 옮긴다. 항목마다 보낸 version이 지금 값과 다르면 옮기지 않고 conflicts에 넣는다(다른 항목은 계속 옮긴다).
     * 되돌리기도 같은 경로로 원래 시각과 옮긴 뒤 version을 보내 같은 확인을 거친다. 일정은 받지 않는다.
     */
    public Map<String, Object> apply(String user, Map<String, Object> body) {
        if (body == null) FeatureInput.fail("요청 본문이 필요합니다.");
        FeatureInput.keys(body, Set.of("moves"));
        if (!(body.get("moves") instanceof List<?> list) || list.isEmpty() || list.size() > MAX_MOVES) { FeatureInput.fail("옮길 항목은 1~" + MAX_MOVES + "개예요."); return null; }
        var moved = new ArrayList<Map<String, Object>>(); var conflicts = new ArrayList<Map<String, Object>>();
        for (Object entry : list) {
            if (!(entry instanceof Map<?, ?> raw)) { FeatureInput.fail("moves는 객체 배열이에요."); return null; }
            @SuppressWarnings("unchecked") var m = (Map<String, Object>) raw;
            String kind = Objects.toString(m.get("kind"), ""), id = Objects.toString(m.get("id"), "");
            if (!(m.get("version") instanceof Number v)) { FeatureInput.fail("version이 필요해요."); return null; }
            long version = v.longValue();
            if (kind.equals("block")) {
                FeatureInput.keys(m, Set.of("kind", "id", "version", "startTime", "endTime"));
                LocalTime start = time(m.get("startTime"), "startTime"), end = time(m.get("endTime"), "endTime");
                if (!end.isAfter(start)) FeatureInput.fail("끝 시각은 시작 시각보다 뒤여야 해요.");
                Optional<PlannerItemEntity> found;
                try { found = blocks.findByIdAndUserId(Long.parseLong(id), user); } catch (NumberFormatException e) { found = Optional.empty(); }
                if (found.isEmpty()) { conflicts.add(Map.of("kind", kind, "id", id, "reason", "missing")); continue; }
                var b = found.get();
                if (b.getPublicVersion() != version) { conflicts.add(Map.of("kind", kind, "id", id, "title", b.getTitle(), "reason", "changed")); continue; }
                var before = Map.<String, Object>of("startTime", clock(minutes(b.getStartTime())), "endTime", clock(minutes(b.getEndTime())));
                b.moveTo(start, end); blocks.flush();
                moved.add(move(kind, id, b.getPublicVersion(), b.getTitle(), before, Map.of("startTime", clock(minutes(start)), "endTime", clock(minutes(end)))));
            } else if (kind.equals("task")) {
                FeatureInput.keys(m, Set.of("kind", "id", "version", "dueTime"));
                LocalTime due = time(m.get("dueTime"), "dueTime");
                var found = tasks.findByIdAndUserIdAndDeletedAtIsNull(id, user);
                if (found.isEmpty()) { conflicts.add(Map.of("kind", kind, "id", id, "reason", "missing")); continue; }
                var t = found.get();
                if (t.getPublicVersion() != version) { conflicts.add(Map.of("kind", kind, "id", id, "title", t.getTitle(), "reason", "changed")); continue; }
                if (t.getDue() == null || t.getDueTime() == null) { conflicts.add(Map.of("kind", kind, "id", id, "title", t.getTitle(), "reason", "changed")); continue; }
                var before = Map.<String, Object>of("dueTime", clock(minutes(t.getDueTime())));
                t.changeDueTime(due); tasks.flush();
                moved.add(move(kind, id, t.getPublicVersion(), t.getTitle(), before, Map.of("dueTime", clock(minutes(due)))));
            } else FeatureInput.fail("옮길 수 있는 것은 계획 블록(block)과 할 일(task)이에요. 일정은 옮기지 않아요.");
        }
        return Map.of("moved", moved, "conflicts", conflicts);
    }
}
