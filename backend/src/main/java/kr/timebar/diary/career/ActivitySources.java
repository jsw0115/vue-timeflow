// 커리어 활동의 근거 원본(일정·실제 기록·WBS 작업) 연결(PR-24, IM-15 4단계). 기존 record_link를 쓰고, 지워진 원본은 깨진 출처로 남겨 보인다.
package kr.timebar.diary.career;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.records.RecordLinks;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional
public class ActivitySources {
    /** 활동에 붙일 수 있는 근거 종류. 할 일은 시간 원천이 아니라 넣지 않는다(docs/design 04: 일정·기록이 시간 원천, WBS가 프로젝트 근거). */
    public static final List<String> KINDS = List.of(RecordLinks.SCHEDULE, RecordLinks.ACTUAL, RecordLinks.WBS);
    public static final int MAX_SOURCES = 50;
    private final RecordLinks links;
    private final JdbcTemplate jdbc;
    public ActivitySources(RecordLinks links, JdbcTemplate jdbc) { this.links = links; this.jdbc = jdbc; }

    /** 활동의 근거 목록. 원본이 지워졌거나 다른 계정 것이면 title 없이 broken=true로 보인다. 활동이 이 계정 것이 아니면 404다. */
    @Transactional(readOnly = true)
    public List<Map<String,Object>> list(String owner, String activityId) {
        links.requireTitle(owner, RecordLinks.ACTIVITY, activityId);
        var result = new ArrayList<Map<String,Object>>();
        for (var row : jdbc.queryForList("SELECT target_kind,target_id FROM record_link WHERE owner_id=? AND source_kind=? AND source_id=? ORDER BY created_at,target_id", owner, RecordLinks.ACTIVITY, activityId)) {
            String kind = Objects.toString(row.get("target_kind"), ""), id = Objects.toString(row.get("target_id"), "");
            var item = new LinkedHashMap<String,Object>(); item.put("kind", kind); item.put("id", id);
            links.title(owner, kind, id).ifPresentOrElse(title -> { item.put("title", title); item.put("broken", false); }, () -> item.put("broken", true));
            result.add(item);
        }
        return result;
    }

    /** 이 계정의 활동과 원본만 잇는다. 같은 연결은 한 번만 남고, 활동마다 50개까지다. */
    public List<Map<String,Object>> add(String owner, String activityId, Map<String,Object> body) {
        if (body == null) FeatureInput.fail("요청 본문이 필요합니다.");
        FeatureInput.keys(body, Set.of("kind", "id"));
        String kind = FeatureInput.requiredText(body, "kind"), id = FeatureInput.requiredText(body, "id");
        if (!KINDS.contains(kind)) FeatureInput.fail("근거 종류는 schedule·actual·wbs 중 하나입니다.");
        links.requireTitle(owner, RecordLinks.ACTIVITY, activityId);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM record_link WHERE owner_id=? AND source_kind=? AND source_id=?", Integer.class, owner, RecordLinks.ACTIVITY, activityId);
        boolean exists = Boolean.TRUE.equals(jdbc.queryForObject("SELECT COUNT(*)>0 FROM record_link WHERE owner_id=? AND source_kind=? AND source_id=? AND target_kind=? AND target_id=?", Boolean.class, owner, RecordLinks.ACTIVITY, activityId, kind, id));
        if (!exists && count != null && count >= MAX_SOURCES) throw new ApiException(ErrorCode.CONFLICT, "근거는 활동마다 " + MAX_SOURCES + "개까지 연결할 수 있어요.");
        links.link(owner, RecordLinks.ACTIVITY, activityId, kind, id);
        return list(owner, activityId);
    }

    /** 연결 하나를 끊는다. 깨진 출처도 끊을 수 있다. 원본은 지우지 않는다. */
    public List<Map<String,Object>> remove(String owner, String activityId, String kind, String id) {
        links.requireTitle(owner, RecordLinks.ACTIVITY, activityId);
        jdbc.update("DELETE FROM record_link WHERE owner_id=? AND source_kind=? AND source_id=? AND target_kind=? AND target_id=?", owner, RecordLinks.ACTIVITY, activityId, kind, id);
        return list(owner, activityId);
    }
}
