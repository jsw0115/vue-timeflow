// 친구 초대·차단·그룹·커뮤니티 가입과 게시글 권한을 영속 데이터로 관리한다.
package kr.timebar.diary.social;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.auth.*;
import kr.timebar.diary.common.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class SocialService {
    private final FeatureStore store;
    private final JdbcTemplate jdbc;
    private final UserRepository users;
    public SocialService(FeatureStore store, JdbcTemplate jdbc, UserRepository users) { this.store = store; this.jdbc = jdbc; this.users = users; }

    public List<Map<String,Object>> friends(String user) {
        return jdbc.queryForList("SELECT id,sender_id AS senderId,recipient_id AS recipientId,status,created_at AS createdAt FROM feature_friend WHERE sender_id=? OR recipient_id=? ORDER BY created_at DESC", user, user).stream().map(row -> SqlResponses.fields(row, "id", "senderId", "recipientId", "status", "createdAt")).toList();
    }
    public Map<String,Object> invite(String user, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("userId")); String target = FeatureInput.requiredText(body, "userId"); available(user, target);
        String pair = user.compareTo(target) < 0 ? user + ":" + target : target + ":" + user;
        String id = UlidGenerator.newUlid();
        try { jdbc.update("INSERT INTO feature_friend(id,pair_key,sender_id,recipient_id,status,created_at) VALUES (?,?,?,?,?,?)", id, pair, user, target, "PENDING", Instant.now().toString()); }
        catch (org.springframework.dao.DuplicateKeyException e) { throw new ApiException(ErrorCode.CONFLICT, "이미 친구이거나 초대 중입니다."); }
        notify(target, "공유", "친구 초대가 도착했습니다.", "/share");
        return Map.of("id", id, "senderId", user, "recipientId", target, "status", "PENDING");
    }
    public void friendAction(String user, String id, String action) {
        var row = jdbc.queryForList("SELECT * FROM feature_friend WHERE id=? FOR UPDATE", id).stream().findFirst().orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        String sender = row.get("sender_id").toString(), recipient = row.get("recipient_id").toString();
        if (!user.equals(sender) && !user.equals(recipient)) throw new ApiException(ErrorCode.NOT_FOUND);
        if (action.equals("delete")) { jdbc.update("DELETE FROM feature_friend WHERE id=?", id); return; }
        if (!user.equals(recipient)) throw new ApiException(ErrorCode.FORBIDDEN);
        if (!row.get("status").equals("PENDING")) throw new ApiException(ErrorCode.CONFLICT);
        available(user, sender);
        if (action.equals("accept")) jdbc.update("UPDATE feature_friend SET status='ACCEPTED' WHERE id=?", id);
        else jdbc.update("DELETE FROM feature_friend WHERE id=?", id);
    }
    public List<Map<String,Object>> blocks(String user) { return jdbc.queryForList("SELECT target_id AS userId FROM feature_block WHERE user_id=?", user).stream().map(row -> SqlResponses.fields(row, "userId")).toList(); }
    public void block(String user, String target) {
        account(target); if (user.equals(target)) FeatureInput.fail("자신은 차단할 수 없습니다.");
        if (Boolean.TRUE.equals(jdbc.queryForObject("SELECT COUNT(*)>0 FROM feature_block WHERE user_id=? AND target_id=?", Boolean.class, user, target))) return;
        jdbc.update("INSERT INTO feature_block(user_id,target_id) VALUES (?,?)", user, target);
        jdbc.update("DELETE FROM feature_friend WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?)", user, target, target, user);
        List<String> owned = jdbc.queryForList("SELECT space_id FROM feature_member WHERE space_type='GROUP' AND user_id=? AND role='owner' AND status='ACTIVE'", String.class, user);
        for (String id : owned) jdbc.update("DELETE FROM feature_member WHERE space_type='GROUP' AND space_id=? AND user_id=?", id, target);
    }
    public void unblock(String user, String target) { jdbc.update("DELETE FROM feature_block WHERE user_id=? AND target_id=?", user, target); }

    public List<Map<String,Object>> spaces(String user, FeatureType type) {
        List<Map<String,Object>> result = new ArrayList<>();
        for (var space : store.all(FeatureStore.SYSTEM, type)) {
            String id = space.get("id").toString(); var member = member(type, id, user);
            if (type == FeatureType.GROUP && member.isEmpty()) continue;
            if (type == FeatureType.COMMUNITY && !"public".equals(space.get("visibility")) && member.isEmpty()) continue;
            result.add(describe(user, type, space));
        }
        return result;
    }
    public Map<String,Object> createSpace(String user, FeatureType type, Map<String,Object> body) {
        var data = FeatureInput.validate(type, body);
        var row = store.create(FeatureStore.SYSTEM, type, data);
        String id = row.get("id").toString(); setMember(type, id, user, "owner", "ACTIVE", "");
        return describe(user, type, row);
    }
    public Map<String,Object> space(String user, FeatureType type, String id) {
        var row = store.get(FeatureStore.SYSTEM, type, id);
        if (type == FeatureType.GROUP) require(user, type, id, false);
        else if (!"public".equals(row.get("visibility")) && member(type, id, user).isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND);
        return describe(user, type, row);
    }
    public Map<String,Object> updateSpace(String user, FeatureType type, String id, Map<String,Object> body) {
        store.lock(FeatureStore.SYSTEM, type, id); require(user, type, id, true);
        var data = FeatureInput.validate(type, body);
        if (type == FeatureType.COMMUNITY && ((Number)data.get("capacity")).longValue() < activeCount(type, id)) throw new ApiException(ErrorCode.CONFLICT, "정원은 현재 회원 수 이상이어야 합니다.");
        return describe(user, type, store.replace(FeatureStore.SYSTEM, type, id, FeatureInput.version(body), data));
    }
    public void deleteSpace(String user, FeatureType type, String id, long version) {
        store.lock(FeatureStore.SYSTEM, type, id); require(user, type, id, true);
        store.delete(FeatureStore.SYSTEM, type, id, version);
        jdbc.update("DELETE FROM feature_member WHERE space_type=? AND space_id=?", type.name(), id);
        for (var post : store.all(id, FeatureType.POST)) jdbc.update("DELETE FROM feature_member WHERE space_type='LIKE' AND space_id=?", post.get("id"));
        for (var challenge : store.all(id, FeatureType.CHALLENGE)) {
            jdbc.update("DELETE FROM feature_member WHERE space_type='CHALLENGE' AND space_id=?", challenge.get("id"));
            jdbc.update("DELETE FROM feature_member WHERE space_type='CHECKIN' AND space_id LIKE ?", challenge.get("id") + ":%");
        }
        for (FeatureType child : List.of(FeatureType.POST, FeatureType.COMMENT, FeatureType.CHALLENGE)) store.deleteAll(id, child);
    }
    public List<Map<String,Object>> members(String user, FeatureType type, String id, boolean pending) {
        require(user, type, id, pending);
        return jdbc.queryForList("SELECT user_id AS userId,role,status,message FROM feature_member WHERE space_type=? AND space_id=? AND status=? ORDER BY user_id", type.name(), id, pending ? "PENDING" : "ACTIVE").stream().map(row -> SqlResponses.fields(row, "userId", "role", "status", "message")).toList();
    }
    public void addMember(String user, FeatureType type, String id, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("userId", "role"));
        store.lock(FeatureStore.SYSTEM, type, id); require(user, type, id, true);
        String target = FeatureInput.requiredText(body, "userId"); available(user, target);
        String role = FeatureInput.text(body, "role"); if (role.isEmpty()) role = "viewer";
        if (!Set.of("viewer", "editor").contains(role)) FeatureInput.fail("초대 역할은 viewer/editor입니다.");
        if (member(type, id, target).isPresent()) throw new ApiException(ErrorCode.CONFLICT);
        setMember(type, id, target, role, "INVITED", ""); notify(target, "공유", "그룹 초대가 도착했습니다.", "/share/groups");
    }
    public void removeMember(String user, FeatureType type, String id, String target) {
        store.lock(FeatureStore.SYSTEM, type, id);
        if (!target.equals(user)) require(user, type, id, true); else require(user, type, id, false);
        var member = member(type, id, target).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if ("owner".equals(member.get("role"))) throw new ApiException(ErrorCode.CONFLICT, "소유자는 그룹 삭제로만 탈퇴할 수 있습니다.");
        jdbc.update("DELETE FROM feature_member WHERE space_type=? AND space_id=? AND user_id=?", type.name(), id, target);
    }
    public Map<String,Object> join(String user, FeatureType type, String id, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("message"));
        var space = store.lock(FeatureStore.SYSTEM, type, id);
        var previous = member(type, id, user);
        if (previous.isPresent() && Set.of("ACTIVE", "PENDING").contains(previous.get().get("status"))) return describe(user, type, space);
        boolean invited = previous.isPresent() && previous.get().get("status").equals("INVITED");
        if ((type == FeatureType.GROUP || "private".equals(space.get("visibility"))) && !invited) throw new ApiException(ErrorCode.FORBIDDEN);
        if (type == FeatureType.COMMUNITY) {
            if (activeCount(type, id) >= ((Number)space.get("capacity")).intValue()) throw new ApiException(ErrorCode.CONFLICT, "정원이 찼습니다.");
            String deadline = FeatureInput.text(space, "deadline");
            if (!deadline.isEmpty() && FeatureInput.date(deadline).isBefore(LocalDate.now(ZoneId.of("Asia/Seoul")))) throw new ApiException(ErrorCode.CONFLICT, "모집이 마감되었습니다.");
        }
        String message = FeatureInput.text(body, "message"); if (message.length() > 2000) FeatureInput.fail("가입 메시지는 최대 2000자입니다.");
        String status = type == FeatureType.COMMUNITY && !invited && "approval".equals(space.get("joinPolicy")) ? "PENDING" : "ACTIVE";
        setMember(type, id, user, invited ? previous.get().get("role").toString() : "viewer", status, message);
        return describe(user, type, space);
    }
    public void decide(String user, String id, String target, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("approved", "reason"));
        if (!(body.get("approved") instanceof Boolean)) FeatureInput.fail("approved는 boolean입니다.");
        var space = store.lock(FeatureStore.SYSTEM, FeatureType.COMMUNITY, id); require(user, FeatureType.COMMUNITY, id, true);
        var previous = member(FeatureType.COMMUNITY, id, target).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!"PENDING".equals(previous.get("status"))) throw new ApiException(ErrorCode.CONFLICT);
        String reason = FeatureInput.text(body, "reason"); if (reason.length() > 2000) FeatureInput.fail("사유는 최대 2000자입니다.");
        if (Boolean.TRUE.equals(body.get("approved"))) {
            if (activeCount(FeatureType.COMMUNITY, id) >= ((Number)space.get("capacity")).intValue()) throw new ApiException(ErrorCode.CONFLICT);
            setMember(FeatureType.COMMUNITY, id, target, "viewer", "ACTIVE", reason);
        } else setMember(FeatureType.COMMUNITY, id, target, "viewer", "REJECTED", reason);
        notify(target, "커뮤니티", "가입 요청이 처리되었습니다.", "/community");
    }

    public List<Map<String,Object>> posts(String user, String id, FeatureType type) {
        require(user, FeatureType.COMMUNITY, id, false);
        return store.all(id, type).stream().filter(row -> !blocked(user, Objects.toString(row.get("authorId"), ""))).map(row -> {
            if (type != FeatureType.POST) return row;
            var result = new LinkedHashMap<>(row); String post = row.get("id").toString();
            result.put("likes", jdbc.queryForObject("SELECT COUNT(*) FROM feature_member WHERE space_type='LIKE' AND space_id=?", Long.class, post));
            result.put("liked", member("LIKE", post, user).isPresent());
            result.put("comments", store.all(id, FeatureType.COMMENT).stream().filter(comment -> post.equals(comment.get("postId")) && !blocked(user, Objects.toString(comment.get("authorId"), ""))).count());
            return result;
        }).toList();
    }
    public Map<String,Object> createPost(String user, String id, FeatureType type, Map<String,Object> body) {
        store.lock(FeatureStore.SYSTEM, FeatureType.COMMUNITY, id); require(user, FeatureType.COMMUNITY, id, false);
        var data = FeatureInput.validate(type, body);
        data.put("authorId", user); data.put("name", account(user).getNickname());
        return store.create(id, type, data);
    }
    public Map<String,Object> updatePost(String user, String id, String post, Map<String,Object> body) {
        require(user, FeatureType.COMMUNITY, id, false); var old = store.get(id, FeatureType.POST, post);
        if (!user.equals(old.get("authorId"))) throw new ApiException(ErrorCode.FORBIDDEN);
        var data = FeatureInput.validate(FeatureType.POST, body); data.put("authorId", user); data.put("name", account(user).getNickname());
        return store.replace(id, FeatureType.POST, post, FeatureInput.version(body), data);
    }
    public void deletePost(String user, String id, String post, long version) {
        require(user, FeatureType.COMMUNITY, id, false); var old = store.lock(id, FeatureType.POST, post);
        if (!user.equals(old.get("authorId"))) require(user, FeatureType.COMMUNITY, id, true);
        store.delete(id, FeatureType.POST, post, version);
        jdbc.update("DELETE FROM feature_member WHERE space_type='LIKE' AND space_id=?", post);
        for (var comment : store.all(id, FeatureType.COMMENT)) if (post.equals(comment.get("postId"))) store.delete(id, FeatureType.COMMENT, comment.get("id").toString(), ((Number)comment.get("version")).longValue());
    }
    public List<Map<String,Object>> comments(String user, String id, String post) {
        require(user, FeatureType.COMMUNITY, id, false); var parent = store.get(id, FeatureType.POST, post);
        if (blocked(user, parent.get("authorId").toString())) throw new ApiException(ErrorCode.NOT_FOUND);
        return posts(user, id, FeatureType.COMMENT).stream().filter(row -> post.equals(row.get("postId"))).toList();
    }
    public Map<String,Object> comment(String user, String id, String post, Map<String,Object> body) {
        store.lock(id, FeatureType.POST, post); require(user, FeatureType.COMMUNITY, id, false);
        var data = FeatureInput.validate(FeatureType.COMMENT, body); data.put("postId", post); data.put("authorId", user); data.put("name", account(user).getNickname());
        return store.create(id, FeatureType.COMMENT, data);
    }
    public void like(String user, String id, String post, boolean liked) {
        store.lock(id, FeatureType.POST, post); require(user, FeatureType.COMMUNITY, id, false);
        if (liked) setMember("LIKE", post, user, "viewer", "ACTIVE", "");
        else jdbc.update("DELETE FROM feature_member WHERE space_type='LIKE' AND space_id=? AND user_id=?", post, user);
    }
    public Map<String,Object> challenge(String user, String id, Map<String,Object> body) {
        store.lock(FeatureStore.SYSTEM, FeatureType.COMMUNITY, id); require(user, FeatureType.COMMUNITY, id, false);
        var data = FeatureInput.validate(FeatureType.CHALLENGE, body); data.put("authorId", user);
        return store.create(id, FeatureType.CHALLENGE, data);
    }
    public void challengeJoin(String user, String id, String challenge) {
        require(user, FeatureType.COMMUNITY, id, false); store.lock(id, FeatureType.CHALLENGE, challenge);
        setMember("CHALLENGE", challenge, user, "viewer", "ACTIVE", "");
    }
    public void checkin(String user, String id, String challenge, String date) {
        require(user, FeatureType.COMMUNITY, id, false); var item = store.lock(id, FeatureType.CHALLENGE, challenge);
        var joined = member("CHALLENGE", challenge, user); if (joined.isEmpty()) throw new ApiException(ErrorCode.FORBIDDEN);
        LocalDate day = FeatureInput.date(date), start = FeatureInput.date(item.get("startDate").toString());
        if (day.isBefore(start) || !day.isBefore(start.plusDays(((Number)item.get("days")).longValue())) || day.isAfter(LocalDate.now(ZoneId.of("Asia/Seoul")))) FeatureInput.fail("챌린지 기간과 인증 날짜를 확인해주세요.");
        setMember("CHECKIN", challenge + ":" + date, user, "viewer", "ACTIVE", "");
    }
    public List<Map<String,Object>> ranking(String user, String id, String challenge) {
        require(user, FeatureType.COMMUNITY, id, false); store.get(id, FeatureType.CHALLENGE, challenge);
        // 업무 시간·경력·개인 기록 없이 챌린지 인증 횟수만 집계한다.
        return jdbc.queryForList("SELECT user_id AS userId,COUNT(*) AS doneDays FROM feature_member WHERE space_type='CHECKIN' AND space_id LIKE ? GROUP BY user_id ORDER BY COUNT(*) DESC,user_id", challenge + ":%").stream().filter(row -> !blocked(user, row.get("userId").toString())).map(row -> SqlResponses.fields(row, "userId", "doneDays")).toList();
    }

    public void require(String user, FeatureType type, String id, boolean owner) {
        store.get(FeatureStore.SYSTEM, type, id);
        var member = member(type, id, user).orElseThrow(() -> new ApiException(ErrorCode.FORBIDDEN));
        if (!"ACTIVE".equals(member.get("status")) || owner && !"owner".equals(member.get("role"))) throw new ApiException(ErrorCode.FORBIDDEN);
    }
    public boolean blocked(String user, String target) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT COUNT(*)>0 FROM feature_block WHERE (user_id=? AND target_id=?) OR (user_id=? AND target_id=?)", Boolean.class, user, target, target, user));
    }
    private void available(String user, String target) { if (user.equals(target)) FeatureInput.fail("자신을 초대할 수 없습니다."); account(target); if (blocked(user, target)) throw new ApiException(ErrorCode.FORBIDDEN); }
    private UserEntity account(String user) { return users.findById(user).filter(UserEntity::isActive).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND)); }
    private Optional<Map<String,Object>> member(FeatureType type, String id, String user) { return member(type.name(), id, user); }
    private Optional<Map<String,Object>> member(String type, String id, String user) { return jdbc.queryForList("SELECT * FROM feature_member WHERE space_type=? AND space_id=? AND user_id=?", type, id, user).stream().findFirst(); }
    private void setMember(FeatureType type, String id, String user, String role, String status, String message) { setMember(type.name(), id, user, role, status, message); }
    private void setMember(String type, String id, String user, String role, String status, String message) {
        if (member(type, id, user).isEmpty()) jdbc.update("INSERT INTO feature_member(space_type,space_id,user_id,role,status,message,updated_at) VALUES (?,?,?,?,?,?,?)", type, id, user, role, status, message, Instant.now().toString());
        else jdbc.update("UPDATE feature_member SET role=?,status=?,message=?,updated_at=? WHERE space_type=? AND space_id=? AND user_id=?", role, status, message, Instant.now().toString(), type, id, user);
    }
    private int activeCount(FeatureType type, String id) { return jdbc.queryForObject("SELECT COUNT(*) FROM feature_member WHERE space_type=? AND space_id=? AND status='ACTIVE'", Integer.class, type.name(), id); }
    private Map<String,Object> describe(String user, FeatureType type, Map<String,Object> row) {
        var result = new LinkedHashMap<>(row); String id = row.get("id").toString(); var membership = member(type, id, user);
        result.put("members", activeCount(type, id)); result.put("membership", membership.map(m -> m.get("status")).orElse("NONE")); result.put("role", membership.map(m -> m.get("role")).orElse("none"));
        return result;
    }
    private void notify(String user, String kind, String title, String link) { store.create(user, FeatureType.NOTIFICATION, Map.of("title", title, "kind", kind, "link", link, "read", false)); }
}
