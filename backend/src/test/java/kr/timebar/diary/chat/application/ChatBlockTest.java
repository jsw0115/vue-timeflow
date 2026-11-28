// 차단 관계면 채팅 상대 찾기는 404, 새 개인·그룹 대화는 403, 기존 개인 대화의 새 메시지는 403인지 검증한다.
package kr.timebar.diary.chat.application;

import kr.timebar.diary.chat.domain.ChatModels.Person;
import kr.timebar.diary.chat.infrastructure.jdbc.ChatRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatBlockTest {
    ChatRepository repo = mock(ChatRepository.class);
    ChatIdentity identity = mock(ChatIdentity.class);
    ChatService service = new ChatService(repo, identity, mock(ChatCommunities.class));

    @BeforeEach void setup() {
        when(identity.requireActive(anyString())).thenAnswer(call -> new Person(call.getArgument(0), "이름"));
        when(identity.blocked(anyString(), anyString())).thenAnswer(call -> Set.of(call.getArgument(0), call.getArgument(1)).equals(Set.of("a", "blocked")));
    }
    private ErrorCode error(Runnable action) { return assertThrows(ApiException.class, action::run).errorCode(); }

    /** 차단한 쪽과 차단당한 쪽 모두 서로를 이메일로 찾지 못한다. 차단 관계가 없는 사용자는 찾는다. */
    @Test void lookupOfABlockedUserIsNotFound() {
        when(identity.findByEmail("blocked@example.test")).thenReturn(Optional.of(new Person("blocked", "차단")));
        when(identity.findByEmail("a@example.test")).thenReturn(Optional.of(new Person("a", "나")));
        when(identity.findByEmail("friend@example.test")).thenReturn(Optional.of(new Person("friend", "친구")));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> service.lookup("a", "blocked@example.test")));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> service.lookup("blocked", "a@example.test")));
        assertEquals("friend", service.lookup("a", "friend@example.test").id());
    }

    /** 차단 관계인 사용자가 있으면 개인 대화와 그룹 대화를 만들지 않는다. */
    @Test void newDirectOrGroupRoomWithABlockedUserIsRefused() {
        assertEquals(ErrorCode.FORBIDDEN, error(() -> service.create("a", "DM", null, List.of("blocked"))));
        assertEquals(ErrorCode.FORBIDDEN, error(() -> service.create("blocked", "DM", null, List.of("a"))));
        assertEquals(ErrorCode.FORBIDDEN, error(() -> service.create("a", "GROUP", "모임", List.of("friend", "blocked"))));
        verify(repo, never()).syncPerson(any());
        verify(repo, never()).jdbc();
    }

    /** 이미 있는 개인 대화도 차단한 뒤에는 새 메시지를 저장하거나 알리지 않는다. */
    @Test void sendingInAnExistingDirectRoomAfterABlockIsRefused() {
        when(repo.lockRoom("dm", "a")).thenReturn(Map.of("kind", "DM", "direct_key", "a:blocked", "last_sequence", 3L));
        assertEquals(ErrorCode.FORBIDDEN, error(() -> service.send("a", "dm", UUID.randomUUID().toString(), "안녕", List.of())));
        verify(repo, never()).jdbc();
        verify(repo, never()).signal(any(), any());
    }
}
