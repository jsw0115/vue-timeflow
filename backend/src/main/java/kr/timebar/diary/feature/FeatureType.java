// 프런트엔드 기록별 허용 필드와 서버 입력 계약을 정의한다.
package kr.timebar.diary.feature;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum FeatureType {
    DIARY("title body date mood tags", "title date"),
    SCHEDULE("title body category startDate endDate startTime endTime color attendeeIds recurrence", "title startDate endDate startTime endTime"),
    ROUTINE_RECORD("title body category startDate time duration days goal notify reminderMinutes paused recurrence", "title startDate time duration days goal"),
    ROUTINE_COMPLETION("date completed routineId", "date completed routineId"),
    MEMO("title body date color actionable tags", "title"),
    DDAY("title body date category pinned notifyDays", "title date"),
    MONEY("title body date amount type category", "title date amount type"),
    REVIEW("body date", "body date"),
    FOCUS("title date category mode duration startedAt endedAt", "title date mode duration startedAt"),
    EVENT_TEMPLATE("title color category duration repeat alarm", "title duration"),
    PLANNER_TEMPLATE("title color blocks", "title blocks"),
    BOARD("columns cards", "columns cards"),
    WORK_RECORD("title body type owner projectId status startDate endDate startTime endTime half leaveDays location partner transport expense fromCompany toCompany role handover", "title type owner startDate endDate startTime endTime"),
    WBS("title body parentId md progress owner open startDate endDate", "title md progress"),
    WIKI("title body space parentId pinned", "title space"),
    CAREER("title period role company stack achievements", "title role"),
    RESUME("name headline years skills education", "name"),
    PORTFOLIO("title body kind", "title kind"),
    PORTFOLIO_LINK("itemIds", "itemIds"),
    CONTACT("name relation email favorite", "name"),
    NOTIFICATION("title kind link read", "title kind link"),
    REPORT("title body date category parentId", "title date"),
    TICKET("title body category", "title body"),
    CONTENT("title body kind where live", "title body kind"),
    NOTICE("title body from to published popup", "title body"),
    AUDIT("action target actor detail", "action target actor"),
    MODERATION("communityId postId reason", "communityId postId reason"),
    GROUP("title description", "title"),
    COMMUNITY("title desc emoji category joinPolicy visibility capacity deadline", "title joinPolicy visibility capacity"),
    POST("title body", "body"),
    COMMENT("body", "body"),
    CHALLENGE("title desc startDate days", "title startDate days"),
    SETTING("value", "value");

    private final Set<String> fields;
    private final Set<String> required;

    FeatureType(String fields, String required) {
        this.fields = split(fields);
        this.required = split(required);
    }

    public Set<String> fields() { return fields; }
    public Set<String> required() { return required; }

    private static Set<String> split(String value) {
        return Arrays.stream(value.split(" ")).collect(Collectors.toUnmodifiableSet());
    }
}
