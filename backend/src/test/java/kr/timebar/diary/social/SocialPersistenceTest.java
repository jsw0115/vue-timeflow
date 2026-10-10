// 실제 DB에서 초대·차단·가입 승인·게시글·챌린지 권한을 검증한다.
package kr.timebar.diary.social;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.auth.*;
import kr.timebar.diary.common.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class SocialPersistenceTest {
    @Autowired SocialService social;
    @Autowired UserRepository users;
    @Autowired FeatureStore store;
    String alice, bob, stranger;
    @BeforeEach void setup() {
        alice = account("alice"); bob = account("bob"); stranger = account("stranger");
    }
    private String account(String name) {
        var user = new UserEntity(name + "@example.test", name, "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(user.getId())).thenReturn(Optional.of(user)); return user.getId();
    }
    @Test void onlyInviteRecipientCanAcceptAndBlockingRemovesFriendship() {
        String id = social.invite(alice, Map.of("userId", bob)).get("id").toString();
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> social.friendAction(alice, id, "accept")).errorCode());
        social.friendAction(bob, id, "accept"); assertEquals("ACCEPTED", social.friends(alice).get(0).get("status"));
        social.block(bob, alice); assertTrue(social.friends(alice).isEmpty());
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> social.invite(alice, Map.of("userId", bob))).errorCode());
        assertFalse(store.all(bob, FeatureType.NOTIFICATION).isEmpty());
    }
    @Test void duplicateInvitationIsConflictAndCannotSpoofSenderOrRole() {
        social.invite(alice, Map.of("userId", bob));
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class, () -> social.invite(bob, Map.of("userId", alice))).errorCode());
        assertThrows(ApiException.class, () -> social.invite(alice, Map.of("userId", bob, "senderId", stranger)));
    }
    @Test void groupMembershipRequiresInvitationAcceptanceAndOnlyOwnerCanManage() {
        String id = social.createSpace(alice, FeatureType.GROUP, Map.of("title", "그룹")).get("id").toString();
        assertThrows(ApiException.class, () -> social.space(stranger, FeatureType.GROUP, id));
        assertThrows(ApiException.class, () -> social.join(bob, FeatureType.GROUP, id, Map.of()));
        social.addMember(alice, FeatureType.GROUP, id, Map.of("userId", bob, "role", "editor"));
        assertThrows(ApiException.class, () -> social.members(bob, FeatureType.GROUP, id, false));
        social.join(bob, FeatureType.GROUP, id, Map.of()); assertEquals(2, social.members(bob, FeatureType.GROUP, id, false).size());
        assertThrows(ApiException.class, () -> social.addMember(bob, FeatureType.GROUP, id, Map.of("userId", stranger)));
        assertThrows(ApiException.class, () -> social.removeMember(alice, FeatureType.GROUP, id, alice));
        social.block(alice, bob); assertEquals(1, social.members(alice, FeatureType.GROUP, id, false).size());
    }
    @Test void approvalProtectsPostsAndCapacityAndPrivateMetadata() {
        String id = community("approval", "public", 2);
        social.join(bob, FeatureType.COMMUNITY, id, Map.of("message", "가입 희망"));
        assertEquals(1, social.members(alice, FeatureType.COMMUNITY, id, true).size());
        assertThrows(ApiException.class, () -> social.createPost(bob, id, FeatureType.POST, Map.of("body", "가입 전 글")));
        assertThrows(ApiException.class, () -> social.decide(bob, id, bob, Map.of("approved", true)));
        social.decide(alice, id, bob, Map.of("approved", true));
        assertThrows(ApiException.class, () -> social.join(stranger, FeatureType.COMMUNITY, id, Map.of()));
        String privateId = community("open", "private", 10);
        assertThrows(ApiException.class, () -> social.space(bob, FeatureType.COMMUNITY, privateId));
        assertTrue(social.spaces(bob, FeatureType.COMMUNITY).stream().noneMatch(row -> privateId.equals(row.get("id"))));
    }
    @Test void postsUseAuthenticatedAuthorAndOnlyAuthorOrOwnerCanDelete() {
        String id = community("open", "public", 10); social.join(bob, FeatureType.COMMUNITY, id, Map.of());
        var post = social.createPost(bob, id, FeatureType.POST, Map.of("body", "첫 글")); String postId = post.get("id").toString();
        assertEquals(bob, post.get("authorId"));
        assertThrows(ApiException.class, () -> social.createPost(bob, id, FeatureType.POST, Map.of("body", "위조", "authorId", alice)));
        assertThrows(ApiException.class, () -> social.updatePost(alice, id, postId, Map.of("body", "수정", "version", 1)));
        social.comment(alice, id, postId, Map.of("body", "댓글"));
        social.like(alice, id, postId, true); social.like(alice, id, postId, true);
        var details = social.posts(alice, id, FeatureType.POST).get(0);
        assertEquals(1L, details.get("likes")); assertEquals(1L, details.get("comments")); assertEquals(true, details.get("liked"));
        social.deletePost(alice, id, postId, 1); assertTrue(store.all(id, FeatureType.POST).isEmpty()); assertTrue(store.all(id, FeatureType.COMMENT).isEmpty());
    }
    @Test void challengeCheckinsAreIdempotentAndDoNotExposePrivateWorkData() {
        String id = community("open", "public", 10); social.join(bob, FeatureType.COMMUNITY, id, Map.of());
        String today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Seoul")).toString();
        String challenge = social.challenge(alice, id, Map.of("title", "챌린지", "startDate", today, "days", 7)).get("id").toString();
        assertThrows(ApiException.class, () -> social.checkin(bob, id, challenge, today));
        social.challengeJoin(bob, id, challenge); social.checkin(bob, id, challenge, today); social.checkin(bob, id, challenge, today);
        var row = social.ranking(alice, id, challenge).get(0); assertEquals(bob, row.get("userId")); assertEquals(1L, row.get("doneDays"));
        assertFalse(row.containsKey("work")); assertThrows(ApiException.class, () -> social.ranking(stranger, id, challenge));
    }
    private String community(String policy, String visibility, int capacity) { return social.createSpace(alice, FeatureType.COMMUNITY, Map.of("title", "커뮤니티", "joinPolicy", policy, "visibility", visibility, "capacity", capacity)).get("id").toString(); }
}
