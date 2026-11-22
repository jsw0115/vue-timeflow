// 할 일·지원 마감 알림(Q-32). 모든 계정을 도는 예약 작업 없이, 사용자가 앱·알림함을 열 때 그 사용자의 다가오는 마감만 계산해 알림을 만든다.
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.task.TaskEntity;
import kr.timebar.diary.task.TaskRepository;
import kr.timebar.diary.task.TaskStatus;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DueReminders {
    /** 시각 있는 할 일을 몇 분 전에 알릴지. 사용자 설정 notifications.dueLeadMinutes, 기본 60. */
    public static final List<Integer> LEAD_MINUTES = List.of(0, 10, 30, 60, 180, 1440);
    /** 지원 마감·면접을 며칠 전에 알릴지. 사용자 설정 notifications.applicationLeadDays, 기본은 커리어 목표에 따라 1 또는 3. */
    public static final List<Integer> LEAD_DAYS = List.of(0, 1, 3, 7);
    /** 같은 사용자는 5분에 한 번만 다시 계산한다. 서버 한 대의 메모리에 두며, 여러 대면 대마다 따로 센다. */
    static final Duration MIN_INTERVAL = Duration.ofMinutes(5);
    private static final Set<String> CLOSED = Set.of("accepted", "rejected", "withdrawn");
    private final FeatureStore store;
    private final TaskRepository tasks;
    private final DayPolicy days;
    private final Map<String, Instant> lastRun = new ConcurrentHashMap<>();

    public DueReminders(FeatureStore store, TaskRepository tasks, DayPolicy days) { this.store = store; this.tasks = tasks; this.days = days; }

    /** 앱·알림함을 열 때 부른다. 5분 안에 다시 부르면 계산하지 않는다. 만든 알림 수를 돌려준다. */
    public int refresh(String user) {
        var day = days.of(user);
        Instant now = day.clock().instant();
        Instant previous = lastRun.get(user);
        if (previous != null && Duration.between(previous, now).compareTo(MIN_INTERVAL) < 0) return 0;
        lastRun.put(user, now);
        return generate(user, day, now);
    }

    int generate(String user, DayPolicy.Day day, Instant now) {
        var settings = settings(user);
        if (Boolean.FALSE.equals(settings.get("dueReminders"))) return 0;
        int leadMinutes = choice(settings.get("dueLeadMinutes"), LEAD_MINUTES, 60);
        int leadDays = choice(settings.get("applicationLeadDays"), LEAD_DAYS, defaultLeadDays(user));
        LocalDate today = day.today();
        int created = 0;
        for (TaskEntity task : tasks.findByUserIdAndDeletedAtIsNullOrderByDueAscCreatedAtAsc(user)) {
            if (task.getDue() == null || task.getStatus() == TaskStatus.DONE) continue;
            if (task.getDue().isBefore(today.minusDays(1)) || task.getDue().isAfter(today.plusDays(2))) continue;
            Instant remindAt, until; String title;
            if (task.getDueTime() != null) {
                Instant dueAt = task.getDue().atTime(task.getDueTime()).atZone(day.zone()).toInstant();
                remindAt = dueAt.minus(Duration.ofMinutes(leadMinutes)); until = dueAt.plus(Duration.ofHours(24));
                title = "‘" + task.getTitle() + "’ 마감이 " + task.getDueTime() + "이에요";
            } else {
                remindAt = day.start(task.getDue()); until = day.start(task.getDue().plusDays(1));
                title = "‘" + task.getTitle() + "’ 오늘 마감이에요";
            }
            if (!now.isBefore(remindAt) && now.isBefore(until))
                created += create(user, "due:task:" + task.getId() + ":" + task.getDue() + (task.getDueTime() == null ? "" : "T" + task.getDueTime()), title, "/tasks/" + task.getId(),
                        Map.of("action", Map.of("kind", "task", "id", task.getId()), "expiresAt", until.toString()));
        }
        for (var app : store.all(user, FeatureType.JOB_APPLICATION)) {
            if (CLOSED.contains(FeatureInput.text(app, "status"))) continue;
            String name = FeatureInput.text(app, "company") + " · " + FeatureInput.text(app, "title");
            for (var field : List.of("deadline", "interviewDate")) {
                String value = FeatureInput.text(app, field);
                if (value.isEmpty()) continue;
                LocalDate date = LocalDate.parse(value);
                Instant remindAt = day.start(date.minusDays(leadDays)), until = day.start(date.plusDays(1));
                if (now.isBefore(remindAt) || !now.isBefore(until)) continue;
                String what = field.equals("deadline") ? "지원 마감" : "면접";
                created += create(user, "due:" + field + ":" + app.get("id") + ":" + date, "‘" + name + "’ " + what + "이 " + date + "이에요", "/career/applications", Map.of("expiresAt", until.toString()));
            }
        }
        return created;
    }

    /** 같은 마감에는 알림을 한 번만 만든다. ID가 같으면 저장소 유일 키로 막힌다. */
    private int create(String user, String id, String title, String link, Map<String,Object> extra) {
        String recordId = id.length() <= 100 ? id : id.substring(0, 100);
        var data = new LinkedHashMap<String,Object>(Map.of("title", title.length() > 200 ? title.substring(0, 200) : title, "kind", "마감", "link", link, "read", false));
        // action: 알림에서 바로 처리할 대상(UF-126). expiresAt이 지나면 처리하지 않는다
        data.putAll(extra);
        try {
            store.create(user, FeatureType.NOTIFICATION, recordId, data);
            return 1;
        } catch (ApiException e) {
            if (e.errorCode() == ErrorCode.CONFLICT) return 0;
            throw e;
        }
    }

    private Map<?,?> settings(String user) {
        return store.optional(user, FeatureType.SETTING, "notifications").map(row -> row.get("value")).filter(Map.class::isInstance).map(value -> (Map<?,?>) value).orElse(Map.of());
    }
    /** 취업·이직 준비 중이면 지원 일정을 더 일찍(3일 전) 알린다. 그 밖은 하루 전이다. */
    private int defaultLeadDays(String user) {
        Object goal = store.optional(user, FeatureType.SETTING, "career").map(row -> row.get("value")).filter(Map.class::isInstance).map(value -> ((Map<?,?>) value).get("goal")).orElse(null);
        return "job-seeker".equals(goal) || "job-changer".equals(goal) ? 3 : 1;
    }
    private static int choice(Object value, List<Integer> allowed, int fallback) {
        return value instanceof Number number && allowed.contains(number.intValue()) ? number.intValue() : fallback;
    }
}
