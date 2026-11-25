// 프런트엔드 기록별 허용 필드와 서버 입력 계약을 정의한다.
package kr.timebar.diary.feature;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum FeatureType {
    DIARY("title body date mood tags", "title date"),
    SCHEDULE("title body category startDate endDate startTime endTime color attendeeIds recurrence", "title startDate endDate startTime endTime"),
    ROUTINE_RECORD("title body category startDate time duration days goal notify reminderMinutes paused pausedFrom pausedRanges recurrence", "title startDate time duration days goal"),
    ROUTINE_COMPLETION("date completed routineId", "date completed routineId"),
    MEMO("title body date color actionable tags", "title"),
    DDAY("title body date category pinned notifyDays", "title date"),
    MONEY("title body date amount type category", "title date amount type"),
    REVIEW("body date", "body date"),
    FOCUS("title date category mode duration startedAt endedAt", "title date mode duration startedAt"),
    ACTUAL_SESSION("title startedAt endedAt timeZone state elapsedSeconds finishKey sourceKind sourceId mode targetMinutes pauses", "title startedAt timeZone state"),
    BACKUP_JOB("value", "value"),
    EVENT_TEMPLATE("title color category duration repeat alarm", "title duration"),
    PLANNER_TEMPLATE("title color blocks", "title blocks"),
    BOARD("columns cards", "columns cards"),
    WORK_RECORD("title body type owner projectId status startDate endDate startTime endTime half leaveDays location partner transport expense fromCompany toCompany role handover", "title type owner startDate endDate startTime endTime"),
    WBS("title body parentId md progress owner open startDate endDate", "title md progress"),
    WIKI("title body space parentId pinned", "title space"),
    CAREER("title period role company stack achievements employmentType department startDate endDate employmentStatus duties", "title role"),
    RESUME("name headline years skills education", "name"),
    // 자기소개서(PR-25, 09 Q-41): 개편안 문서 유형 표의 지원 동기·직무 역량·문제 해결·협업·성장 경험. 계정에 하나이고 회사별 제출본은 문서 버전으로 남긴다
    COVER_LETTER("title motivation competency problemSolving collaboration growth", "title"),
    // 포트폴리오 항목(PR-26): 개편안 4.3·문서 유형 표의 소개(body)·문제·역할·기술·과정·성과·개인 기여·결과물 링크와 근거(커리어 활동·경력) 연결
    PORTFOLIO("title body kind role stack problem process outcome contribution links activityIds experienceId", "title kind"),
    PORTFOLIO_LINK("itemIds", "itemIds"),
    // 커리어 활동 원장(docs/design 04 FD-85 후보). 기존 경력(CAREER)을 experienceId로 참조하고 원천 기록을 복제하지 않는다
    CAREER_ACTIVITY("title body activityType date endDate experienceId role skillTags achievements links visibility tags", "title activityType date"),
    // 취업·이직 지원 관리(docs/design 04 FD-88 후보). 공고 자동 수집·자동 지원은 하지 않는다
    JOB_APPLICATION("title company postingUrl employmentType workType salaryRange deadline appliedDate interviewDate status body", "title company status"),
    // 이력서·경력기술서·포트폴리오의 고정 버전(PR-25, docs/design 06 career_document_version). 서버가 지금 저장된 내용을 복사해 만들고 고치지 않는다
    DOC_VERSION("document number label note content", "document number content"),
    CONTACT("name relation email favorite accountId accountNickname", "name"),
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
    CHALLENGE("title desc startDate days verify minMinutes windowStart windowEnd openRecords", "title startDate days"),
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
