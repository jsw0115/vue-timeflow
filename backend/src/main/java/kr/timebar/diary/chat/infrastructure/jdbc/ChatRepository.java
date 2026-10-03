package kr.timebar.diary.chat.infrastructure.jdbc;

import kr.timebar.diary.chat.domain.ChatModels.*;
import kr.timebar.diary.chat.domain.ChatSearch;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "app.chat.enabled", havingValue = "true")
public class ChatRepository {
    private final JdbcTemplate jdbc;
    public ChatRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public JdbcTemplate jdbc() { return jdbc; }
    private static Instant instant(ResultSet rs, String column) throws SQLException {
        return rs.getTimestamp(column).toLocalDateTime().toInstant(ZoneOffset.UTC);
    }
    private static final RowMapper<Message> MESSAGE = (rs, i) -> new Message(rs.getString("id"), rs.getString("room_id"),
            rs.getString("sequence_no"), rs.getString("sender_id"), rs.getString("nickname"),
            rs.getString("client_message_id"), rs.getString("body"), instant(rs, "created_at"),List.of(),List.of());
    private static final String MESSAGES = "SELECT m.*, u.nickname FROM chat_message m JOIN chat_user u ON u.user_id=m.sender_id ";
    public void syncPerson(Person person) {
        jdbc.update("INSERT INTO chat_user(user_id,nickname) VALUES (?,?) ON DUPLICATE KEY UPDATE nickname=?,updated_at=UTC_TIMESTAMP(6)",
                person.id(), person.nickname(), person.nickname());
    }
    public boolean isMember(String room, String user) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM chat_member WHERE room_id=? AND user_id=? AND left_at IS NULL)", Boolean.class, room, user));
    }
    public void requireMember(String room, String user) {
        if (!isMember(room, user)) throw new ApiException(ErrorCode.NOT_FOUND, "대화를 찾을 수 없거나 참여 권한이 없습니다.");
    }
    public Map<String,Object> lockRoom(String room, String user) {
        requireMember(room, user);
        var rows = jdbc.queryForList("SELECT * FROM chat_room WHERE id=? FOR UPDATE", room);
        if (rows.isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND);
        var membership = jdbc.queryForList("SELECT user_id FROM chat_member WHERE room_id=? AND user_id=? AND left_at IS NULL FOR UPDATE",room,user);
        if (membership.isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND);
        return rows.get(0);
    }
    public List<Member> members(String room) {
        return jdbc.query("SELECT m.user_id,u.nickname,m.last_read_sequence FROM chat_member m JOIN chat_user u ON u.user_id=m.user_id WHERE m.room_id=? AND m.left_at IS NULL ORDER BY m.user_id",
                (rs,i) -> new Member(rs.getString(1),rs.getString(2),rs.getString(3)), room);
    }
    public Room room(String id, String viewer) {
        requireMember(id, viewer);
        var members = members(id);
        var last = jdbc.query(MESSAGES + "WHERE m.room_id=? ORDER BY m.sequence_no DESC LIMIT 1", MESSAGE, id);
        long unread = jdbc.queryForObject("SELECT COUNT(*) FROM chat_message WHERE room_id=? AND sender_id<>? AND sequence_no>(SELECT last_read_sequence FROM chat_member WHERE room_id=? AND user_id=?)", Long.class,id,viewer,id,viewer);
        return jdbc.queryForObject("SELECT * FROM chat_room WHERE id=?", (rs,i) -> new Room(rs.getString("id"),rs.getString("kind"),
                "DM".equals(rs.getString("kind")) ? members.stream().filter(m -> !m.userId().equals(viewer)).map(Member::nickname).findFirst().orElse("개인 대화") : rs.getString("name"),
                rs.getString("owner_id"),rs.getString("last_sequence"),unread,last.isEmpty()?null:last.get(0),members,instant(rs,"updated_at")), id);
    }
    public List<String> roomIds(String viewer, String before, int limit) {
        return jdbc.queryForList("SELECT room_id FROM chat_member WHERE user_id=? AND left_at IS NULL AND (? IS NULL OR room_id<?) ORDER BY room_id DESC LIMIT ?", String.class,viewer,before,before,limit);
    }
    public Optional<Message> retry(String room, String sender, String clientId) {
        return jdbc.query(MESSAGES + "WHERE m.room_id=? AND m.sender_id=? AND m.client_message_id=?", MESSAGE,room,sender,clientId).stream().findFirst().map(this::decorate);
    }
    public List<Message> messages(String room, Long before, Long after, int limit, String tag) {
        return jdbc.query(MESSAGES + "WHERE m.room_id=? AND (? IS NULL OR m.sequence_no<?) AND (? IS NULL OR m.sequence_no>?) AND (? IS NULL OR EXISTS(SELECT 1 FROM chat_message_tag mt JOIN chat_tag t ON t.id=mt.tag_id WHERE mt.message_id=m.id AND t.name=?)) ORDER BY m.sequence_no "
                + (after == null ? "DESC" : "ASC") + " LIMIT ?", MESSAGE,room,before,before,after,after,tag,tag,limit).stream().map(this::decorate).toList();
    }
    private Message decorate(Message message) {
        var tags=jdbc.queryForList("SELECT t.name FROM chat_message_tag mt JOIN chat_tag t ON t.id=mt.tag_id WHERE mt.message_id=? ORDER BY t.name",String.class,message.id());
        var mentions=jdbc.queryForList("SELECT user_id FROM chat_mention WHERE message_id=? ORDER BY user_id",String.class,message.id());
        return new Message(message.id(),message.roomId(),message.sequence(),message.senderId(),message.senderName(),message.clientMessageId(),message.body(),message.createdAt(),tags,mentions);
    }
    public void annotate(Message message,List<String> tags,Collection<String> mentions) {
        indexMessage(message.id(), message.body());
        for(String tag:tags) {
            jdbc.update("INSERT INTO chat_tag(name) VALUES (?) ON DUPLICATE KEY UPDATE name=?",tag,tag);
            jdbc.update("INSERT INTO chat_message_tag(message_id,tag_id) SELECT ?,id FROM chat_tag WHERE name=?",message.id(),tag);
        }
        for(String user:mentions) jdbc.update("INSERT INTO chat_mention(room_id,message_id,user_id) VALUES (?,?,?)",message.roomId(),message.id(),user);
    }
    public Page<InboxItem> inbox(String user,String before,boolean unread,String tag,int limit,boolean mentions) {
        String join=mentions?"JOIN chat_mention n ON n.message_id=m.id AND n.user_id=? ":"JOIN chat_message_tag mt ON mt.message_id=m.id JOIN chat_tag t ON t.id=mt.tag_id AND t.name=? ";
        var items=jdbc.query(MESSAGES+join+"JOIN chat_room r ON r.id=m.room_id JOIN chat_member cm ON cm.room_id=m.room_id AND cm.user_id=? AND cm.left_at IS NULL WHERE (? IS NULL OR m.id<?) "
                +(mentions&&unread?"AND n.read_at IS NULL ":"")+"ORDER BY m.id DESC LIMIT ?",
                (rs,i)->new InboxItem(MESSAGE.mapRow(rs,i),"",false),mentions?user:tag,user,before,before,limit+1);
        boolean more=items.size()>limit;
        var page=items.subList(0,Math.min(limit,items.size()));
        var results=page.stream().map(item->new InboxItem(decorate(item.message()),room(item.message().roomId(),user).name(),mentions && Boolean.TRUE.equals(jdbc.queryForObject("SELECT read_at IS NOT NULL FROM chat_mention WHERE message_id=? AND user_id=?",Boolean.class,item.message().id(),user)))).toList();
        return new Page<>(results,more?page.get(page.size()-1).message().id():null,more);
    }
    public Page<TagCount> tags(String user,String after,int limit) {
        var items=jdbc.query("SELECT t.name,COUNT(*) AS cnt FROM chat_tag t JOIN chat_message_tag mt ON mt.tag_id=t.id JOIN chat_message m ON m.id=mt.message_id JOIN chat_member cm ON cm.room_id=m.room_id AND cm.user_id=? AND cm.left_at IS NULL WHERE (? IS NULL OR t.name>?) GROUP BY t.id,t.name ORDER BY t.name LIMIT ?",(rs,i)->new TagCount(rs.getString(1),rs.getLong(2)),user,after,after,limit+1);
        boolean more=items.size()>limit;
        var page=items.subList(0,Math.min(limit,items.size()));
        return new Page<>(page,more?page.get(page.size()-1).name():null,more);
    }
    public void signal(String room, String type) {
        jdbc.update("INSERT INTO chat_outbox(room_id,event_type) VALUES (?,?)",room,type);
    }
    public void indexMessage(String id, String body) {
        // Idempotent across application instances; all writes share the caller's transaction.
        jdbc.update("INSERT IGNORE INTO chat_search_document(message_id,normalized_body) VALUES (?,?)",id,ChatSearch.normalize(body));
        var grams = ChatSearch.grams(body);
        jdbc.batchUpdate("INSERT IGNORE INTO chat_search_gram(gram,message_id) VALUES (?,?)", grams, 500, (ps, gram) -> { ps.setString(1, gram); ps.setString(2, id); });
    }
    public Page<InboxItem> search(String user,String query,String roomId,String before,int limit) {
        var grams = ChatSearch.queryGrams(query);
        var args = new java.util.ArrayList<Object>(); args.add(grams.get(0)); args.add(user);
        var sql = new StringBuilder(MESSAGES + "JOIN chat_search_gram g ON g.message_id=m.id AND g.gram=? JOIN chat_search_document d ON d.message_id=m.id JOIN chat_member cm ON cm.room_id=m.room_id AND cm.user_id=? AND cm.left_at IS NULL ");
        sql.append("WHERE LOCATE(?,d.normalized_body)>0 "); args.add(query);
        if(roomId!=null) { sql.append("AND m.room_id=? "); args.add(roomId); }
        if(before!=null) { sql.append("AND m.id<? "); args.add(before); }
        for(int i=1;i<grams.size();i++) { sql.append("AND EXISTS(SELECT 1 FROM chat_search_gram probe WHERE probe.gram=? AND probe.message_id=m.id) "); args.add(grams.get(i)); }
        sql.append("ORDER BY m.id DESC LIMIT ?"); args.add(limit+1);
        var rows=jdbc.query(sql.toString(),MESSAGE,args.toArray());
        boolean more=rows.size()>limit;
        var page=rows.subList(0,Math.min(limit,rows.size()));
        // Resolve each room once per result page, rather than computing unread counts per hit.
        var names = new java.util.HashMap<String,String>();
        var results = page.stream().map(message -> new InboxItem(decorate(message),names.computeIfAbsent(message.roomId(),id -> jdbc.queryForObject("SELECT COALESCE(name,'개인 대화') FROM chat_room WHERE id=?",String.class,id)),false)).toList();
        return new Page<>(results,more?page.get(page.size()-1).id():null,more);
    }
    public List<Person> visiblePeople(String viewer,List<String> ids) {
        if(ids.isEmpty()) return List.of();
        String placeholders=String.join(",",java.util.Collections.nCopies(ids.size(),"?"));
        var args=new java.util.ArrayList<Object>(); args.add(viewer); args.addAll(ids);
        return jdbc.query("SELECT DISTINCT p.user_id,u.nickname FROM chat_member self JOIN chat_member p ON p.room_id=self.room_id AND p.left_at IS NULL JOIN chat_user u ON u.user_id=p.user_id WHERE self.user_id=? AND self.left_at IS NULL AND p.user_id IN ("+placeholders+")",(rs,i)->new Person(rs.getString(1),rs.getString(2)),args.toArray());
    }
}
