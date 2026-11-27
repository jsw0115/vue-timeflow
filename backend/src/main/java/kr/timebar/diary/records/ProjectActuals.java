// 업무 보고서 초안(PR-19 UF-138, Q-35): 실제 기록을 WBS 최상위 작업(프로젝트)에 잇고, 고른 기간·프로젝트의 실제 시간·완료 작업·남은 작업을 모은다.
// 초안은 계산만 하고 저장·발송하지 않는다. 저장은 화면이 /api/reports/{key}에 따로 하며 원본 기록은 바꾸지 않는다.
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional
public class ProjectActuals {
    /** 한 번에 고를 수 있는 기간(일정 최대 기간과 같은 366일). */
    public static final int MAX_DAYS = 366;
    private final FeatureStore store;
    private final RecordLinks links;
    private final JdbcTemplate jdbc;
    private final DayPolicy days;
    public ProjectActuals(FeatureStore store, RecordLinks links, JdbcTemplate jdbc, DayPolicy days) { this.store = store; this.links = links; this.jdbc = jdbc; this.days = days; }

    /** 이 계정의 최상위 WBS 작업만 프로젝트다. 없거나 다른 계정 것이면 404, 하위 작업이면 400이다. */
    private Map<String, Object> project(String owner, String projectId) {
        var row = store.optional(owner, FeatureType.WBS, projectId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!Objects.toString(row.get("parentId"), "").isBlank()) FeatureInput.fail("최상위 WBS 작업만 프로젝트로 고를 수 있어요.");
        return row;
    }
    private record Range(LocalDate from, LocalDate to, Instant start, Instant end) { }
    private Range range(String owner, String from, String to) {
        LocalDate a, b;
        try { a = LocalDate.parse(from); b = LocalDate.parse(to); } catch (RuntimeException e) { FeatureInput.fail("기간은 YYYY-MM-DD 날짜로 보내 주세요."); return null; }
        if (b.isBefore(a)) FeatureInput.fail("끝 날짜는 시작 날짜와 같거나 뒤여야 해요.");
        if (ChronoUnit.DAYS.between(a, b) + 1 > MAX_DAYS) FeatureInput.fail("기간은 " + MAX_DAYS + "일까지 고를 수 있어요.");
        var clock = days.of(owner);
        return new Range(a, b, clock.start(a), clock.end(b));
    }
    /** 이 실제 기록이 이어진 프로젝트 ID. 없으면 빈 값이다. */
    private Optional<String> linkedProject(String owner, String actualId) {
        return jdbc.queryForList("SELECT target_id FROM record_link WHERE owner_id=? AND source_kind=? AND source_id=? AND target_kind=?", String.class, owner, RecordLinks.ACTUAL, actualId, RecordLinks.WBS).stream().findFirst();
    }
    private static boolean overlaps(Map<String, Object> row, Range r) {
        if (!"COMPLETED".equals(row.get("state"))) return false;
        Instant start = Instant.parse(row.get("startedAt").toString()), end = Instant.parse(row.get("endedAt").toString());
        return start.isBefore(r.end()) && end.isAfter(r.start());
    }
    private static Map<String, Object> session(Map<String, Object> row, Range r) {
        var out = new LinkedHashMap<String, Object>();
        out.put("id", row.get("id")); out.put("title", Objects.toString(row.get("title"), ""));
        out.put("startedAt", row.get("startedAt")); out.put("endedAt", row.get("endedAt"));
        // 기간 밖으로 걸친 부분과 일시정지는 빼고 센다(통계와 같은 규칙)
        out.put("minutes", RecordingTime.seconds(row, r.start(), r.end()) / 60);
        return out;
    }

    /** 기간에 겹친 끝낸 실제 기록과 각 기록이 이어진 프로젝트. 화면이 이 프로젝트에 넣을 기록을 고르는 목록이다. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> candidates(String owner, String projectId, String from, String to) {
        project(owner, projectId);
        var r = range(owner, from, to);
        var result = new ArrayList<Map<String, Object>>();
        for (var row : store.all(owner, FeatureType.ACTUAL_SESSION)) {
            if (!overlaps(row, r)) continue;
            var item = session(row, r);
            var linked = linkedProject(owner, row.get("id").toString());
            item.put("linkedProjectId", linked.orElse(null));
            item.put("linked", linked.map(projectId::equals).orElse(false));
            linked.filter(id -> !id.equals(projectId)).flatMap(id -> links.title(owner, RecordLinks.WBS, id)).ifPresent(title -> item.put("linkedProjectTitle", title));
            result.add(item);
        }
        result.sort(Comparator.comparing(item -> item.get("startedAt").toString()));
        return result;
    }

    /** 실제 기록 하나는 프로젝트 하나에만 넣는다. 다른 프로젝트에 이어져 있었으면 이 프로젝트로 옮긴다. 끝낸 기록만 받는다. */
    public Map<String, Object> link(String owner, String projectId, Map<String, Object> body) {
        if (body == null) FeatureInput.fail("요청 본문이 필요합니다.");
        FeatureInput.keys(body, Set.of("actualId"));
        String actualId = FeatureInput.requiredText(body, "actualId");
        project(owner, projectId);
        var actual = store.optional(owner, FeatureType.ACTUAL_SESSION, actualId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!"COMPLETED".equals(actual.get("state"))) FeatureInput.fail("끝낸 실제 기록만 프로젝트에 넣을 수 있어요.");
        jdbc.update("DELETE FROM record_link WHERE owner_id=? AND source_kind=? AND source_id=? AND target_kind=?", owner, RecordLinks.ACTUAL, actualId, RecordLinks.WBS);
        links.link(owner, RecordLinks.ACTUAL, actualId, RecordLinks.WBS, projectId);
        return Map.of("actualId", actualId, "projectId", projectId);
    }

    public void unlink(String owner, String projectId, String actualId) {
        project(owner, projectId);
        jdbc.update("DELETE FROM record_link WHERE owner_id=? AND source_kind=? AND source_id=? AND target_kind=? AND target_id=?", owner, RecordLinks.ACTUAL, actualId, RecordLinks.WBS, projectId);
    }

    /**
     * 초안 재료: 이 프로젝트에 이어진 기간 안 실제 기록과 합계, 프로젝트 아래 진척 100% 작업(완료)과 100% 미만 작업(남은 일).
     * 개인 다이어리·이어지지 않은 기록은 넣지 않는다. 아무것도 저장하지 않는다.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> draft(String owner, String projectId, String from, String to) {
        var projectRow = project(owner, projectId);
        var r = range(owner, from, to);
        var linkedIds = new HashSet<>(jdbc.queryForList("SELECT source_id FROM record_link WHERE owner_id=? AND source_kind=? AND target_kind=? AND target_id=?", String.class, owner, RecordLinks.ACTUAL, RecordLinks.WBS, projectId));
        var sessions = new ArrayList<Map<String, Object>>();
        long total = 0;
        for (var row : store.all(owner, FeatureType.ACTUAL_SESSION)) {
            if (!linkedIds.contains(row.get("id").toString()) || !overlaps(row, r)) continue;
            var item = session(row, r); sessions.add(item); total += (Long) item.get("minutes");
        }
        sessions.sort(Comparator.comparing(item -> item.get("startedAt").toString()));
        var done = new ArrayList<Map<String, Object>>(); var remaining = new ArrayList<Map<String, Object>>();
        var nodes = store.all(owner, FeatureType.WBS);
        for (var node : descendants(nodes, projectId)) {
            var item = new LinkedHashMap<String, Object>();
            item.put("id", node.get("id")); item.put("title", Objects.toString(node.get("title"), ""));
            int progress = node.get("progress") instanceof Number n ? n.intValue() : 0;
            item.put("progress", progress);
            (progress >= 100 ? done : remaining).add(item);
        }
        var result = new LinkedHashMap<String, Object>();
        result.put("projectId", projectId); result.put("projectTitle", Objects.toString(projectRow.get("title"), ""));
        result.put("from", r.from().toString()); result.put("to", r.to().toString());
        result.put("actualMinutes", total); result.put("sessions", sessions); result.put("done", done); result.put("remaining", remaining);
        return result;
    }

    /** 프로젝트 아래 모든 하위 작업(프로젝트 자신은 빼고). 순환 참조가 있어도 한 번씩만 돈다. */
    private static List<Map<String, Object>> descendants(List<Map<String, Object>> nodes, String rootId) {
        var result = new ArrayList<Map<String, Object>>(); var seen = new HashSet<String>(); var queue = new ArrayDeque<String>(List.of(rootId)); seen.add(rootId);
        while (!queue.isEmpty()) {
            String parent = queue.poll();
            for (var node : nodes) {
                String id = node.get("id").toString();
                if (parent.equals(Objects.toString(node.get("parentId"), "")) && seen.add(id)) { result.add(node); queue.add(id); }
            }
        }
        return result;
    }
}
