// 기능별 JSON 입력의 형식과 날짜·금액·계층·보드 제약을 검증한다.
package kr.timebar.diary.feature;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

public final class FeatureInput {
    private static final Set<String> BOOLEANS = Set.of("pinned", "actionable", "open", "favorite", "read", "live", "published", "popup", "paused", "notify", "completed", "openRecords");
    private static final Set<String> NUMBERS = Set.of("amount", "duration", "alarm", "leaveDays", "expense", "md", "progress", "years", "capacity", "reminderMinutes", "days", "minMinutes");
    private static final Set<String> ARRAYS = Set.of("tags", "notifyDays", "blocks", "columns", "cards", "achievements", "attendeeIds", "itemIds", "skillTags", "links", "activityIds");
    /** 20000자까지 받는 긴 글 필드. 포트폴리오의 문제·과정·성과·개인 기여(PR-26)를 더했다. */
    private static final Set<String> LONG_TEXTS = Set.of("body", "handover", "problem", "process", "outcome", "contribution", "duties");
    /** 포트폴리오 항목 하나에 이을 수 있는 커리어 활동 수. 원문에 없는 제안값이다. */
    public static final int PORTFOLIO_ACTIVITY_LIMIT = 20;
    private static final Set<String> DATES = Set.of("date", "startDate", "endDate", "from", "to", "deadline", "appliedDate", "interviewDate");
    /** 커리어 활동 유형. 회사 업무·인턴·아르바이트·프리랜서·개인 프로젝트·학습·커뮤니티 활동(docs/design 04 FD-85). */
    public static final List<String> ACTIVITY_TYPES = List.of("work", "intern", "part-time", "freelance", "project", "study", "community");
    /** 지원 상태. 관심·준비 중·지원 완료·서류 통과·면접 예정·최종 합격·불합격·보류·철회(docs/design 04 FD-88). 상태 전이 제한은 문서에 정해지지 않아 두지 않는다. */
    public static final List<String> APPLICATION_STATUSES = List.of("interested", "preparing", "applied", "screening-passed", "interview", "accepted", "rejected", "on-hold", "withdrawn");
    private static final int URL_LIMIT = 2000;
    private static final int LINK_COUNT = 10;

    private FeatureInput() { }

    public static Map<String, Object> validate(FeatureType type, Map<String, Object> input) {
        if (input == null) fail("요청 본문이 필요합니다.");
        Map<String, Object> body = new LinkedHashMap<>(input);
        body.remove("version");
        for (String key : body.keySet()) {
            if (!type.fields().contains(key)) fail("허용되지 않은 필드입니다. " + key);
        }
        for (String key : type.required()) {
            if (body.get(key) == null || body.get(key) instanceof String value && value.isBlank()) fail(key + " 필드가 필요합니다.");
        }
        for (var entry : body.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            if (value == null) continue;
            if (key.equals("value")) { bounded(value, 0); continue; }
            if (key.equals("recurrence") || key.equals("goal") || (key.equals("days") || key.equals("pausedRanges")) && type == FeatureType.ROUTINE_RECORD) { bounded(value, 0); continue; }
            if (BOOLEANS.contains(key)) { if (!(value instanceof Boolean)) fail(key + "는 boolean이어야 합니다."); }
            else if (NUMBERS.contains(key)) { number(body, key, -1000000000000d, 1000000000000d, false); }
            else if (ARRAYS.contains(key)) { if (!(value instanceof List<?> list) || list.size() > 500) fail(key + "는 최대 500개 배열입니다."); }
            else {
                if (!(value instanceof String)) fail(key + "는 문자열이어야 합니다.");
                String text = (String) value;
                if (text.length() > (LONG_TEXTS.contains(key) ? 20000 : key.equals("postingUrl") ? URL_LIMIT : 200)) fail(key + " 길이가 너무 깁니다.");
                if (key.equals("title") || key.equals("name")) body.put(key, text.trim());
                if (DATES.contains(key) && !text.isEmpty()) date(text);
                if (key.equals("startTime") || key.equals("endTime")) time(text);
                if (key.equals("startedAt") || key.equals("endedAt")) instant(text);
                if (key.equals("email") && !text.isEmpty() && !text.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) fail("이메일을 확인해주세요.");
            }
        }
        for (String key : List.of("tags", "achievements", "skillTags")) {
            if (body.get(key) instanceof List<?> list && list.stream().anyMatch(v -> !(v instanceof String s) || s.length() > 200)) fail(key + "는 문자열 배열입니다.");
        }
        if (body.get("notifyDays") instanceof List<?> days) for (Object day : days) number(Map.of("day", day), "day", 0, 365, true);
        switch (type) {
            case PORTFOLIO_LINK -> { if (((List<?>)body.get("itemIds")).isEmpty() || ((List<?>)body.get("itemIds")).stream().anyMatch(value -> !(value instanceof String s) || s.isBlank() || s.length() > 100)) fail("선택한 포트폴리오 ID가 필요합니다."); }
            case SCHEDULE -> {
                LocalDateTime start = date(text(body, "startDate")).atTime(time(text(body, "startTime")));
                LocalDateTime end = date(text(body, "endDate")).atTime(time(text(body, "endTime")));
                if (!end.isAfter(start) || java.time.temporal.ChronoUnit.DAYS.between(start, end) > 366) fail("일정 종료는 시작 이후, 최대 366일입니다.");
                if (body.get("attendeeIds") instanceof List<?> list && list.stream().anyMatch(v -> !(v instanceof String s) || s.length() > 36 || s.isBlank())) fail("참석자는 계정 ID 문자열 배열입니다.");
                RecurrenceRule.validate(body.get("recurrence"), text(body, "startDate"), true);
                RecurrenceRule.checkOverrideTimes(body.get("recurrence"), text(body, "startDate"), text(body, "endDate"), text(body, "startTime"), text(body, "endTime"));
            }
            case ROUTINE_RECORD -> {
                time(requiredText(body, "time")); number(body, "duration", 1, 1440, true);
                if (!(body.get("days") instanceof List<?> days) || days.isEmpty()) fail("반복 요일이 필요합니다.");
                for (Object day : (List<?>)body.get("days")) number(Map.of("day", day), "day", 0, 6, true);
                var goal = object(body.get("goal")); keys(goal, Set.of("count", "unit")); number(goal, "count", 1, 9999, true); requiredText(goal, "unit");
                if (body.get("reminderMinutes") != null) number(body, "reminderMinutes", 0, 1440, true);
                RecurrenceRule.validate(body.get("recurrence"), text(body, "startDate"));
            }
            // Q-07: 기분은 코드 5개만 받는다. 화면 문구는 좋음·평온·피곤·속상함·뿌듯함이고, 예전 이모지·한국어 값은 화면이 읽을 때 코드로 바꾼다
            case DIARY -> { if (body.get("mood") != null) choice(body, "mood", "good", "calm", "tired", "upset", "proud"); }
            case MONEY -> {
                choice(body, "type", "in", "out");
                double amount = number(body, "amount", -1000000000000d, 1000000000000d, true);
                if (amount == 0 || (body.get("type").equals("in") ? amount < 0 : amount > 0)) fail("수입은 양수, 지출은 음수 금액을 입력해주세요.");
            }
            case FOCUS -> {
                choice(body, "mode", "pomodoro", "stopwatch", "free");
                number(body, "duration", 1, 1440, true);
                if (body.get("endedAt") != null && !instant(body.get("endedAt").toString()).isAfter(instant(body.get("startedAt").toString()))) fail("종료는 시작 이후여야 합니다.");
            }
            case EVENT_TEMPLATE -> { number(body, "duration", 1, 1440, true); if (body.get("alarm") != null) number(body, "alarm", 0, 10080, true); }
            case PLANNER_TEMPLATE -> validateBlocks(body);
            case BOARD -> validateBoard(body);
            case WORK_RECORD -> validateWork(body);
            case WBS -> {
                number(body, "md", 0, 100000, false); number(body, "progress", 0, 100, false);
                if (!text(body, "startDate").isEmpty() || !text(body, "endDate").isEmpty()) range(text(body, "startDate"), text(body, "endDate"));
            }
            case RESUME -> { if (body.get("years") != null) number(body, "years", 0, 100, true); }
            case COMMUNITY -> { choice(body, "joinPolicy", "open", "approval"); choice(body, "visibility", "public", "private"); number(body, "capacity", 2, 500, true); }
            case CHALLENGE -> validateChallenge(body);
            case CAREER_ACTIVITY -> validateActivity(body);
            case PORTFOLIO -> validatePortfolio(body);
            case CAREER -> validateCareer(body);
            case JOB_APPLICATION -> {
                choice(body, "status", APPLICATION_STATUSES.toArray(String[]::new));
                if (!text(body, "postingUrl").isEmpty()) webUrl(text(body, "postingUrl"));
            }
            case NOTICE -> { if (!text(body, "from").isEmpty() && !text(body, "to").isEmpty()) range(text(body, "from"), text(body, "to")); }
            default -> { }
        }
        return body;
    }

    /** 인증 방식(직접·실제 기록), 최소 기록 시간, 인증 시간대, 기록 공개 여부를 확인한다(PR-10 3b, Q-26). */
    private static void validateChallenge(Map<String, Object> body) {
        number(body, "days", 3, 100, true);
        if (text(body, "verify").isEmpty()) body.put("verify", "self");
        choice(body, "verify", "self", "record");
        boolean record = "record".equals(body.get("verify"));
        if (Boolean.TRUE.equals(body.get("openRecords")) && !record) fail("기록 공개 챌린지는 실제 기록으로 인증해야 합니다.");
        if (record) number(body, "minMinutes", 1, 600, true);
        else if (body.get("minMinutes") != null) fail("최소 기록 시간은 기록 확인 챌린지에만 정합니다.");
        String from = text(body, "windowStart"), to = text(body, "windowEnd");
        if (from.isEmpty() != to.isEmpty()) fail("인증 시간대는 시작과 끝을 함께 정합니다.");
        if (from.isEmpty()) return;
        if (!record) fail("인증 시간대는 기록 확인 챌린지에만 정합니다.");
        if (!time(from).isBefore(time(to))) fail("인증 시간대의 끝은 시작보다 늦어야 합니다. 자정을 넘는 시간대는 정할 수 없습니다.");
    }

    /**
     * 커리어 활동은 기본 비공개다. 공유 기능이 아직 없어 private만 받는다(docs/design 09 §3).
     * 근거 링크는 http/https 주소만 저장하고 서버가 그 주소를 호출하지 않는다(docs/design 07 §1-4).
     */
    /** 경력 고용 형태(REQ-F25, design 04 FD-86). 화면 이름은 정규직·계약직·인턴·아르바이트·프리랜서·기타다. */
    public static final List<String> EMPLOYMENT_TYPES = List.of("full-time", "contract", "intern", "part-time", "freelance", "other");

    /**
     * 경력 상세(PR-24): 고용 형태·재직 상태는 허용값만, 종료일은 시작일 이후, 재직 중이면 종료일이 없고 종료면 종료일이 있다.
     * 예전 기록의 자유 기간(period)은 그대로 받는다.
     */
    private static void validateCareer(Map<String, Object> body) {
        if (body.get("employmentType") != null) choice(body, "employmentType", EMPLOYMENT_TYPES.toArray(String[]::new));
        if (body.get("employmentStatus") != null) choice(body, "employmentStatus", "current", "ended");
        if (!text(body, "startDate").isEmpty() && !text(body, "endDate").isEmpty()) range(text(body, "startDate"), text(body, "endDate"));
        if ("current".equals(body.get("employmentStatus")) && !text(body, "endDate").isEmpty()) fail("재직 중인 경력은 종료일을 비워 주세요.");
        if ("ended".equals(body.get("employmentStatus")) && text(body, "endDate").isEmpty()) fail("종료한 경력은 종료일이 필요해요.");
    }

    /** 포트폴리오 항목(PR-26): 결과물 링크는 활동과 같은 규칙(http·https, 10개), 근거 활동 ID는 문자열 20개까지. 소유 확인은 WorkService가 한다. */
    private static void validatePortfolio(Map<String, Object> body) {
        validateLinks(body);
        if (body.get("activityIds") instanceof List<?> ids) {
            if (ids.size() > PORTFOLIO_ACTIVITY_LIMIT) fail("근거 활동은 최대 " + PORTFOLIO_ACTIVITY_LIMIT + "개입니다.");
            for (Object id : ids) if (!(id instanceof String text) || text.isBlank() || text.length() > 100) fail("activityIds는 활동 ID 문자열 배열입니다.");
        }
    }

    private static void validateLinks(Map<String, Object> body) {
        if (body.get("links") instanceof List<?> links) {
            if (links.size() > LINK_COUNT) fail("근거 링크는 최대 " + LINK_COUNT + "개입니다.");
            for (Object link : links) {
                if (!(link instanceof String url)) { fail("links는 문자열 배열입니다."); return; }
                if (url.length() > URL_LIMIT) fail("링크 길이가 너무 깁니다.");
                webUrl(url);
            }
        }
    }

    private static void validateActivity(Map<String, Object> body) {
        choice(body, "activityType", ACTIVITY_TYPES.toArray(String[]::new));
        if (!text(body, "endDate").isEmpty()) range(text(body, "date"), text(body, "endDate"));
        if (text(body, "visibility").isEmpty()) body.put("visibility", "private");
        choice(body, "visibility", "private");
        validateLinks(body);
    }

    /** http·https 절대 주소만 받는다. javascript: 같은 스킴과 호스트 없는 주소를 거부한다. */
    public static void webUrl(String value) {
        try {
            var uri = new java.net.URI(value.trim());
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (!Set.of("http", "https").contains(scheme) || uri.getHost() == null || uri.getHost().isBlank()) throw new IllegalArgumentException();
        } catch (java.net.URISyntaxException | IllegalArgumentException e) { fail("링크는 http 또는 https 주소여야 합니다."); }
    }

    private static void validateBlocks(Map<String, Object> body) {
        List<?> blocks = (List<?>) body.get("blocks");
        if (blocks.isEmpty()) fail("블록이 필요합니다.");
        for (Object item : blocks) {
            Map<String, Object> block = object(item);
            keys(block, Set.of("time", "title", "duration"));
            requiredText(block, "title"); time(requiredText(block, "time"));
            if (block.get("duration") != null) number(block, "duration", 1, 1440, true);
        }
    }

    private static void validateBoard(Map<String, Object> body) {
        Set<String> columns = new HashSet<>(), cards = new HashSet<>();
        for (Object item : (List<?>) body.get("columns")) {
            Map<String, Object> column = object(item);
            keys(column, Set.of("id", "title", "wip"));
            if (!columns.add(requiredText(column, "id"))) fail("중복 컬럼입니다.");
            requiredText(column, "title"); number(column, "wip", 0, 500, true);
        }
        if (columns.isEmpty()) fail("컬럼이 필요합니다.");
        for (Object item : (List<?>) body.get("cards")) {
            Map<String, Object> card = object(item);
            keys(card, Set.of("id", "columnId", "title", "assignee", "due", "priority", "labels", "checklist", "plannerBlock", "order"));
            if (!cards.add(requiredText(card, "id")) || !columns.contains(requiredText(card, "columnId"))) fail("카드 ID 또는 컬럼을 확인해주세요.");
            requiredText(card, "title"); choice(card, "priority", "low", "normal", "high");
            number(card, "order", 0, 10000, true);
            if (!text(card, "due").isEmpty()) date(text(card, "due"));
            if (card.get("labels") != null && (!(card.get("labels") instanceof List<?> labels) || labels.stream().anyMatch(v -> !(v instanceof String)))) fail("labels는 문자열 배열입니다.");
            if (card.get("checklist") != null) {
                if (!(card.get("checklist") instanceof List<?>)) fail("checklist는 배열입니다.");
                for (Object entry : (List<?>) card.get("checklist")) {
                    Map<String, Object> check = object(entry); keys(check, Set.of("text", "done")); requiredText(check, "text");
                    if (!(check.get("done") instanceof Boolean)) fail("체크 완료 상태가 필요합니다.");
                }
            }
        }
        // WIP는 프런트엔드와 동일하게 경고용 제한으로 저장하며 초과 이동을 막지 않는다.
        bounded(body, 0);
    }

    private static void validateWork(Map<String, Object> body) {
        choice(body, "type", "연차", "반차", "외근", "출장", "이직");
        LocalDate start = date(text(body, "startDate")), end = date(text(body, "endDate"));
        LocalDateTime from = start.atTime(time(text(body, "startTime"))), to = end.atTime(time(text(body, "endTime")));
        if (!to.isAfter(from)) fail("종료 일시는 시작 이후여야 합니다.");
        switch (text(body, "type")) {
            case "연차" -> { double days = number(body, "leaveDays", 0.5, 365, false); if (days * 2 != Math.floor(days * 2)) fail("연차는 0.5일 단위입니다."); }
            case "반차" -> { if (!start.equals(end)) fail("반차 날짜는 같아야 합니다."); choice(body, "half", "오전", "오후"); body.put("leaveDays", 0.5); }
            case "외근" -> requiredText(body, "location");
            case "출장" -> { requiredText(body, "location"); number(body, "expense", 0, 100000000, false); }
            case "이직" -> { requiredText(body, "toCompany"); requiredText(body, "role"); }
            default -> { }
        }
    }

    public static long version(Map<String, Object> body) { return (long) number(body, "version", 1, Long.MAX_VALUE, true); }
    public static double number(Map<String, Object> body, String key, double min, double max, boolean integer) {
        Object raw = body.get(key);
        if (!(raw instanceof Number)) { fail(key + "는 숫자여야 합니다."); }
        double value = ((Number) raw).doubleValue();
        if (!Double.isFinite(value) || value < min || value > max || integer && value != Math.floor(value)) fail(key + " 범위를 확인해주세요.");
        return value;
    }
    public static String text(Map<String, Object> body, String key) { return body.get(key) instanceof String text ? text : ""; }
    public static String requiredText(Map<String, Object> body, String key) {
        String text = text(body, key).trim(); if (text.isEmpty() || text.length() > 200) fail(key + "를 입력해주세요."); return text;
    }
    public static void choice(Map<String, Object> body, String key, String... allowed) {
        if (!Arrays.asList(allowed).contains(text(body, key))) fail(key + " 값을 확인해주세요.");
    }
    public static LocalDate date(String value) {
        try { if (!value.matches("\\d{4}-\\d{2}-\\d{2}")) throw new IllegalArgumentException(); return LocalDate.parse(value); }
        catch (RuntimeException e) { throw new ApiException(ErrorCode.VALIDATION_FAILED, "날짜는 유효한 YYYY-MM-DD 형식이어야 합니다."); }
    }
    public static LocalTime time(String value) {
        try { if (!value.matches("(?:[01]\\d|2[0-3]):[0-5]\\d")) throw new IllegalArgumentException(); return LocalTime.parse(value); }
        catch (RuntimeException e) { throw new ApiException(ErrorCode.VALIDATION_FAILED, "시간은 HH:mm 형식이어야 합니다."); }
    }
    public static Instant instant(String value) {
        try { return Instant.parse(value); } catch (RuntimeException e) { throw new ApiException(ErrorCode.VALIDATION_FAILED, "UTC ISO 8601 시각이 필요합니다."); }
    }
    public static void range(String from, String to) { if (date(to).isBefore(date(from))) fail("종료 날짜를 확인해주세요."); }
    @SuppressWarnings("unchecked")
    public static Map<String, Object> object(Object value) {
        if (!(value instanceof Map<?, ?>)) fail("JSON 객체가 필요합니다."); return (Map<String, Object>) value;
    }
    public static void keys(Map<String, Object> body, Set<String> fields) {
        if (!fields.containsAll(body.keySet())) fail("허용되지 않은 필드가 있습니다.");
    }
    public static void bounded(Object value, int depth) {
        if (depth > 8) fail("JSON 깊이는 최대 8입니다.");
        if (value instanceof Map<?, ?> map) {
            if (map.size() > 100) fail("객체 필드 수가 너무 많습니다.");
            for (var entry : map.entrySet()) {
                if (!(entry.getKey() instanceof String key) || key.length() > 100) fail("필드 이름을 확인해주세요.");
                String key = entry.getKey().toString().toLowerCase(Locale.ROOT);
                if (Set.of("apikey", "api-key", "password", "secret", "cardnumber", "accesstoken", "refreshtoken").contains(key)) fail("인증·결제 비밀정보는 설정에 저장할 수 없습니다.");
                bounded(entry.getValue(), depth + 1);
            }
        } else if (value instanceof List<?> list) {
            if (list.size() > 500) fail("배열 크기가 너무 큽니다.");
            list.forEach(item -> bounded(item, depth + 1));
        } else if (value instanceof String text && text.length() > 20000) fail("문자열 길이가 너무 깁니다.");
        else if (value instanceof Number number && !Double.isFinite(number.doubleValue())) fail("숫자를 확인해주세요.");
    }
    public static void fail(String message) { throw new ApiException(ErrorCode.VALIDATION_FAILED, message); }
}
