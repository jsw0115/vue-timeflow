package kr.timebar.diary.chat.application;

import kr.timebar.diary.chat.domain.ChatModels.*;
import kr.timebar.diary.chat.domain.ChatTags;
import kr.timebar.diary.chat.domain.ChatSearch;
import kr.timebar.diary.chat.infrastructure.jdbc.ChatRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.UlidGenerator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@ConditionalOnProperty(name = "app.chat.enabled", havingValue = "true")
public class ChatService {
    private final ChatRepository repo;
    private final ChatIdentity identity;
    public ChatService(ChatRepository repo, ChatIdentity identity) { this.repo=repo; this.identity=identity; }
    public void active(String user) { identity.requireActive(user); }
    @Transactional(readOnly=true) public Page<InboxItem> search(String user,String query,String room,String before,int size) {
        active(user);
        if(query==null||query.isBlank()||query.length()>100 || before!=null && !before.matches("[0-9A-HJKMNP-TV-Z]{26}")) throw new ApiException(ErrorCode.VALIDATION_FAILED);
        if(room!=null) repo.requireMember(room,user);
        return repo.search(user,ChatSearch.normalize(query.strip()),room,before,limit(size));
    }
    @Transactional(readOnly=true) public List<Person> visiblePeople(String user,List<String> ids) {
        active(user);
        if(ids.size()>100) throw new ApiException(ErrorCode.VALIDATION_FAILED);
        return repo.visiblePeople(user,ids);
    }
    public Person lookup(String user, String email) {
        active(user);
        return identity.findByEmail(email).filter(p -> !p.id().equals(user)).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND,"대화할 사용자를 찾지 못했습니다."));
    }
    @Transactional public Room create(String user, String kind, String name, List<String> others) {
        active(user);
        var ids = new TreeSet<>(others);
        if (ids.size()!=others.size() || ids.contains(user) || ids.isEmpty() || ids.size()>19 || !("DM".equals(kind)||"GROUP".equals(kind)) || ("DM".equals(kind)&&ids.size()!=1))
            throw new ApiException(ErrorCode.VALIDATION_FAILED,"참여자를 확인해주세요. 개인 대화는 상대 한 명, 그룹은 전체 20명까지입니다.");
        if ("GROUP".equals(kind) && (name==null||name.isBlank()||name.strip().length()>80)) throw new ApiException(ErrorCode.VALIDATION_FAILED,"그룹 이름을 입력해주세요.");
        ids.add(user);
        // Lock identities in a stable order, serializing concurrent DM creation.
        for (var id : ids) repo.syncPerson(identity.requireActive(id));
        String direct = "DM".equals(kind) ? String.join(":",ids) : null;
        if (direct!=null) {
            var existing=repo.jdbc().queryForList("SELECT id FROM chat_room WHERE direct_key=?",String.class,direct);
            if (!existing.isEmpty()) return repo.room(existing.get(0),user);
        }
        String id=UlidGenerator.newUlid();
        repo.jdbc().update("INSERT INTO chat_room(id,kind,name,owner_id,direct_key) VALUES (?,?,?,?,?)",id,kind,"GROUP".equals(kind)?name.strip():null,user,direct);
        for (var member : ids) repo.jdbc().update("INSERT INTO chat_member(room_id,user_id) VALUES (?,?)",id,member);
        repo.signal(id,"ROOM");
        return repo.room(id,user);
    }
    @Transactional(readOnly=true) public Page<Room> rooms(String user,String before,int limit) {
        active(user);
        int size=limit(limit);
        var ids=repo.roomIds(user,before,size+1);
        boolean more=ids.size()>size;
        var page=ids.subList(0,Math.min(size,ids.size()));
        return new Page<>(page.stream().map(id->repo.room(id,user)).toList(),more?page.get(page.size()-1):null,more);
    }
    @Transactional(readOnly=true) public Room room(String user,String id) { active(user); return repo.room(id,user); }
    @Transactional(readOnly=true) public Page<Message> messages(String user,String room,Long before,Long after,int limit,String tag) {
        active(user); repo.requireMember(room,user);
        if (before!=null && after!=null || before!=null && before<1 || after!=null && after<0) throw new ApiException(ErrorCode.VALIDATION_FAILED);
        int size=limit(limit);
        var rows=repo.messages(room,before,after,size+1,tag==null?null:ChatTags.normalize(tag));
        boolean more=rows.size()>size;
        var page=rows.subList(0,Math.min(size,rows.size()));
        String cursor=more?page.get(page.size()-1).sequence():null;
        // REST always presents messages in chronological order, cursor follows the query direction.
        var ordered=new ArrayList<>(page);
        if(after==null) Collections.reverse(ordered);
        return new Page<>(ordered,cursor,more);
    }
    @Transactional public Message send(String user,String room,String clientId,String body,List<String> mentionIds) {
        active(user);
        try { if(!UUID.fromString(clientId).toString().equals(clientId)) throw new IllegalArgumentException(); }
        catch(Exception e) { throw new ApiException(ErrorCode.VALIDATION_FAILED,"메시지 요청 ID가 올바르지 않습니다."); }
        if(body==null||body.isBlank()||body.length()>4000) throw new ApiException(ErrorCode.VALIDATION_FAILED,"메시지를 1~4,000자로 입력해주세요.");
        var locked=repo.lockRoom(room,user);
        var mentions=new TreeSet<>(mentionIds==null?List.<String>of():mentionIds);
        if(mentions.size()>19||mentions.contains(user)) throw new ApiException(ErrorCode.VALIDATION_FAILED,"다른 참여자를 19명까지 멘션할 수 있습니다.");
        var existing=repo.retry(room,user,clientId);
        if(existing.isPresent()) {
            if(!existing.get().body().equals(body.strip())||!new TreeSet<>(existing.get().mentionUserIds()).equals(mentions)) throw new ApiException(ErrorCode.CONFLICT,"같은 요청 ID로 다른 메시지를 보낼 수 없습니다.");
            return existing.get();
        }
        for(String member:mentions) { identity.requireActive(member);repo.requireMember(room,member); }
        var tags=ChatTags.extract(body);
        long seq=((Number)locked.get("last_sequence")).longValue()+1;
        repo.jdbc().update("INSERT INTO chat_message(id,room_id,sequence_no,sender_id,client_message_id,body) VALUES (?,?,?,?,?,?)",UlidGenerator.newUlid(),room,seq,user,clientId,body.strip());
        repo.jdbc().update("UPDATE chat_room SET last_sequence=?,updated_at=UTC_TIMESTAMP(6) WHERE id=?",seq,room);
        repo.annotate(repo.retry(room,user,clientId).orElseThrow(),tags,mentions);
        repo.signal(room,"MESSAGE");
        return repo.retry(room,user,clientId).orElseThrow();
    }
    @Transactional public ReadState read(String user,String room,long sequence) {
        active(user);
        long last=((Number)repo.lockRoom(room,user).get("last_sequence")).longValue();
        if(sequence<0||sequence>last) throw new ApiException(ErrorCode.VALIDATION_FAILED,"읽음 위치가 대화 범위를 벗어났습니다.");
        long previous=repo.jdbc().queryForObject("SELECT last_read_sequence FROM chat_member WHERE room_id=? AND user_id=?",Long.class,room,user);
        if(sequence>previous) {
            repo.jdbc().update("UPDATE chat_member SET last_read_sequence=? WHERE room_id=? AND user_id=?",sequence,room,user);
            repo.signal(room,"READ");
        }
        return new ReadState(room,Long.toString(Math.max(sequence,previous)));
    }
    @Transactional public void transfer(String user,String room,String nextOwner) {
        active(user);
        var locked=repo.lockRoom(room,user);
        if(!"GROUP".equals(locked.get("kind"))||!user.equals(locked.get("owner_id"))) throw new ApiException(ErrorCode.FORBIDDEN);
        identity.requireActive(nextOwner); repo.requireMember(room,nextOwner);
        repo.jdbc().update("UPDATE chat_room SET owner_id=? WHERE id=?",nextOwner,room);
        repo.signal(room,"ROOM");
    }
    @Transactional public void leave(String user,String room) {
        active(user);
        var locked=repo.lockRoom(room,user);
        if(!"GROUP".equals(locked.get("kind"))) throw new ApiException(ErrorCode.CONFLICT,"개인 대화에서는 나가기를 지원하지 않습니다.");
        if(user.equals(locked.get("owner_id"))&&repo.members(room).size()>1) throw new ApiException(ErrorCode.CONFLICT,"다른 참여자에게 방장을 넘긴 뒤 나갈 수 있습니다.");
        repo.jdbc().update("UPDATE chat_member SET left_at=UTC_TIMESTAMP(6) WHERE room_id=? AND user_id=?",room,user);
        repo.signal(room,"ROOM");
    }
    private int limit(int requested) {
        if(requested<1||requested>100) throw new ApiException(ErrorCode.VALIDATION_FAILED,"조회 개수는 1~100입니다.");
        return requested;
    }
    @Transactional(readOnly=true) public Page<InboxItem> mentions(String user,String before,boolean unread,int limit) {
        active(user);return repo.inbox(user,before,unread,null,limit(limit),true);
    }
    @Transactional(readOnly=true) public Page<InboxItem> tagged(String user,String tag,String before,int limit) {
        active(user);return repo.inbox(user,before,false,ChatTags.normalize(tag),limit(limit),false);
    }
    @Transactional(readOnly=true) public Page<TagCount> tags(String user,String after,int limit) {
        active(user);return repo.tags(user,after,limit(limit));
    }
    @Transactional public void readMention(String user,String messageId) {
        active(user);
        var rooms=repo.jdbc().queryForList("SELECT room_id FROM chat_mention WHERE message_id=? AND user_id=?",String.class,messageId,user);
        if(rooms.isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND);
        repo.lockRoom(rooms.get(0),user);
        repo.jdbc().update("UPDATE chat_mention SET read_at=COALESCE(read_at,UTC_TIMESTAMP(6)) WHERE message_id=? AND user_id=?",messageId,user);
    }
}
