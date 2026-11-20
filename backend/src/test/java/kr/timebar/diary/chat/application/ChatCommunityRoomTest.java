// 커뮤니티 채팅방이 커뮤니티 활성 회원과 같은 멤버를 갖고, 채팅에서 직접 나가거나 방장을 넘길 수 없는지 검증한다(PR-10 3b-3, Q-25).
package kr.timebar.diary.chat.application;

import kr.timebar.diary.chat.domain.ChatModels.Person;
import kr.timebar.diary.chat.infrastructure.jdbc.ChatRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatCommunityRoomTest {
    ChatRepository repo = mock(ChatRepository.class);
    ChatIdentity identity = mock(ChatIdentity.class);
    ChatCommunities communities = mock(ChatCommunities.class);
    ChatService service = new ChatService(repo, identity, communities);

    @BeforeEach void setup() {
        when(identity.requireActive(anyString())).thenAnswer(call -> new Person(call.getArgument(0), "이름"));
    }
    private ErrorCode error(Runnable action) { return assertThrows(ApiException.class, action::run).errorCode(); }
    @SuppressWarnings("unchecked") private ArgumentCaptor<Set<String>> members() { return ArgumentCaptor.forClass(Set.class); }

    /** 볼 수 없는 커뮤니티는 404, 회원이 아니면 403이고 채팅방을 만들지 않는다. */
    @Test void hiddenCommunityIs404AndOutsiderIs403() {
        when(communities.visibleTitle("hidden", "viewer")).thenReturn(Optional.empty());
        assertEquals(ErrorCode.NOT_FOUND, error(() -> service.communityRoom("viewer", "hidden")));
        when(communities.visibleTitle("open", "viewer")).thenReturn(Optional.of("아침 러닝"));
        when(communities.activeMembers("open")).thenReturn(List.of("owner"));
        assertEquals(ErrorCode.FORBIDDEN, error(() -> service.communityRoom("viewer", "open")));
        verify(repo, never()).createCommunityRoom(any(), any(), any(), any());
        verify(repo, never()).syncCommunityMembers(any(), any(), any());
    }

    /** 회원이 처음 열면 채팅방을 한 번 만들고, 쓸 수 있는 활성 회원만 멤버로 맞춘다. 80자를 넘는 이름은 자른다. */
    @Test void memberOpensRoomThatIsCreatedOnceAndSyncedWithActiveMembers() {
        String title = "가".repeat(90);
        when(communities.visibleTitle("c1", "a")).thenReturn(Optional.of(title));
        when(communities.title("c1")).thenReturn(Optional.of(title));
        when(communities.activeMembers("c1")).thenReturn(List.of("a", "b", "gone"));
        when(identity.requireActive("gone")).thenThrow(new ApiException(ErrorCode.FORBIDDEN));
        when(repo.communityRoom("c1")).thenReturn(Optional.empty());
        when(repo.createCommunityRoom(anyString(), anyString(), eq("a"), eq("c1"))).thenReturn(true);
        service.communityRoom("a", "c1");
        var name = ArgumentCaptor.forClass(String.class);
        verify(repo).createCommunityRoom(anyString(), name.capture(), eq("a"), eq("c1"));
        assertEquals(80, name.getValue().length());
        var synced = members();
        verify(repo).syncCommunityMembers(anyString(), eq(name.getValue()), synced.capture());
        assertEquals(Set.of("a", "b"), synced.getValue());
    }

    /** 동시에 열어 다른 요청이 먼저 만들었으면 그 채팅방을 쓴다. */
    @Test void concurrentCreationUsesTheExistingRoom() {
        when(communities.visibleTitle("c1", "a")).thenReturn(Optional.of("러닝"));
        when(communities.title("c1")).thenReturn(Optional.of("러닝"));
        when(communities.activeMembers("c1")).thenReturn(List.of("a"));
        when(repo.communityRoom("c1")).thenReturn(Optional.empty(), Optional.of("first"));
        when(repo.createCommunityRoom(anyString(), anyString(), anyString(), anyString())).thenReturn(false);
        service.communityRoom("a", "c1");
        verify(repo).syncCommunityMembers(eq("first"), eq("러닝"), any());
        verify(repo).room("first", "a");
    }

    /** 회원 변경 이벤트는 이미 있는 채팅방만 맞춘다. 커뮤니티가 지워졌으면 모두 내보낸다. */
    @Test void membershipChangeSyncsOnlyExistingRooms() {
        when(repo.communityRoom("none")).thenReturn(Optional.empty());
        service.syncCommunity("none");
        verify(repo, never()).syncCommunityMembers(any(), any(), any());
        when(repo.communityRoom("deleted")).thenReturn(Optional.of("r2"));
        when(communities.title("deleted")).thenReturn(Optional.empty());
        when(communities.activeMembers("deleted")).thenReturn(List.of());
        service.syncCommunity("deleted");
        verify(repo).syncCommunityMembers("r2", null, Set.of());
    }

    /** 커뮤니티 채팅방은 커뮤니티를 나갈 때 함께 나가므로 채팅에서 직접 나가거나 방장을 넘길 수 없다. */
    @Test void communityRoomCannotBeLeftOrTransferredFromChat() {
        when(repo.lockRoom("r1", "a")).thenReturn(Map.of("kind", "GROUP", "owner_id", "a", "community_id", "c1"));
        assertEquals(ErrorCode.CONFLICT, error(() -> service.leave("a", "r1")));
        assertEquals(ErrorCode.CONFLICT, error(() -> service.transfer("a", "r1", "b")));
    }
}
