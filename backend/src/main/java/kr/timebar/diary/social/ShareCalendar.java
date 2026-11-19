// 공유 그룹 멤버가 고른 범위로 서로의 일정을 보여 준다. 미리보기와 실제 응답이 같은 함수를 쓴다(PR-10, UF-111·UF-112).
package kr.timebar.diary.social;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.records.ScheduleService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional
public class ShareCalendar {
    /** none: 공유 안 함, busy: 바쁜 시간만, title: 제목 포함, detail: 상세 포함(내용·분류·색). */
    public static final List<String> LEVELS = List.of("none", "busy", "title", "detail");
    private final SocialService social;
    private final ScheduleService schedules;
    private final JdbcTemplate jdbc;
    private final UserRepository users;

    public ShareCalendar(SocialService social, ScheduleService schedules, JdbcTemplate jdbc, UserRepository users) {
        this.social = social; this.schedules = schedules; this.jdbc = jdbc; this.users = users;
    }

    /** 이 그룹에 내 일정을 보이는 범위를 바꾼다. "공유 안 함"이 철회다(UF-113). 활성 멤버만 바꿀 수 있다. */
    public Map<String,Object> setLevel(String user, String groupId, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("level"));
        FeatureInput.choice(body, "level", LEVELS.toArray(String[]::new));
        social.require(user, FeatureType.GROUP, groupId, false);
        jdbc.update("UPDATE feature_member SET share_level=? WHERE space_type='GROUP' AND space_id=? AND user_id=?", body.get("level"), groupId, user);
        return Map.of("groupId", groupId, "level", body.get("level"));
    }

    /**
     * 그룹 캘린더. 보는 사람을 뺀 활성 멤버 중 범위가 "공유 안 함"이 아닌 사람의 일정 회차를 그 범위만큼만 담는다(UF-112).
     * 바쁜 시간만이면 응답에 제목·내용이 없다. 어느 범위든 일정 ID는 담지 않는다. 서로 차단한 사람의 일정은 빠진다.
     */
    @Transactional(readOnly = true)
    public List<Map<String,Object>> schedules(String viewer, String groupId, String from, String to) {
        social.require(viewer, FeatureType.GROUP, groupId, false);
        var result = new ArrayList<Map<String,Object>>();
        for (var member : jdbc.queryForList("SELECT user_id, share_level FROM feature_member WHERE space_type='GROUP' AND space_id=? AND status='ACTIVE' AND share_level<>'none' ORDER BY user_id", groupId)) {
            String owner = Objects.toString(member.get("user_id")), level = Objects.toString(member.get("share_level"));
            if (owner.equals(viewer) || social.blocked(viewer, owner)) continue;
            String name = users.findById(owner).map(UserEntity::getNickname).orElse("");
            for (var occurrence : schedules.occurrences(owner, from, to)) result.add(project(owner, name, level, occurrence));
        }
        result.sort(Comparator.comparing((Map<String,Object> row) -> row.get("startDate").toString()).thenComparing(row -> row.get("startTime").toString()));
        return result;
    }

    /** 상대방 시점 미리보기. 고른 멤버가 그룹 캘린더에서 실제로 받는 응답 중 내 일정만 돌려준다(UF-111). 그 사람이 활성 멤버가 아니면 404다. */
    @Transactional(readOnly = true)
    public List<Map<String,Object>> preview(String user, String groupId, String viewerId, String from, String to) {
        social.require(user, FeatureType.GROUP, groupId, false);
        Integer active = jdbc.queryForObject("SELECT COUNT(*) FROM feature_member WHERE space_type='GROUP' AND space_id=? AND user_id=? AND status='ACTIVE'", Integer.class, groupId, viewerId);
        if (viewerId.equals(user) || active == null || active == 0) throw new ApiException(ErrorCode.NOT_FOUND);
        return schedules(viewerId, groupId, from, to).stream().filter(row -> user.equals(row.get("ownerId"))).toList();
    }

    private static Map<String,Object> project(String owner, String name, String level, Map<String,Object> occurrence) {
        var row = new LinkedHashMap<String,Object>();
        row.put("ownerId", owner); row.put("ownerName", name); row.put("level", level);
        for (String key : List.of("startDate", "endDate", "startTime", "endTime")) row.put(key, occurrence.get(key));
        if (!"busy".equals(level)) row.put("title", occurrence.get("title"));
        if ("detail".equals(level)) for (String key : List.of("body", "category", "color")) row.put(key, occurrence.getOrDefault(key, ""));
        return row;
    }
}
