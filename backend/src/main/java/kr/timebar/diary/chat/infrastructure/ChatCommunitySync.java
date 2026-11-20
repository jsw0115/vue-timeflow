// 커뮤니티 회원 변경을 같은 트랜잭션 안에서 채팅방 멤버에 반영하고, 서버가 뜰 때 모든 커뮤니티 채팅방을 다시 맞춘다(PR-10 3b-3, Q-25).
package kr.timebar.diary.chat.infrastructure;

import kr.timebar.diary.chat.application.ChatService;
import kr.timebar.diary.chat.infrastructure.jdbc.ChatRepository;
import kr.timebar.diary.social.CommunityMembersChanged;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.chat.enabled", havingValue = "true")
public class ChatCommunitySync {
    private final ChatService chat;
    private final ChatRepository repo;
    public ChatCommunitySync(ChatService chat, ChatRepository repo) { this.chat = chat; this.repo = repo; }

    /** 동기 리스너라 커뮤니티 가입·탈퇴·내보내기와 같은 트랜잭션에서 채팅방 멤버가 바뀐다. 내보낸 회원은 커밋과 함께 채팅방에서 빠진다. */
    @EventListener public void on(CommunityMembersChanged event) { chat.syncCommunity(event.communityId()); }

    /** 채팅이 꺼져 있던 동안 바뀐 회원을 맞춘다. */
    @EventListener(ApplicationReadyEvent.class) public void reconcileAll() { for (String id : repo.communityIds()) chat.syncCommunity(id); }
}
