// 커뮤니티 회원이 바뀌는 모든 경로가 채팅방 동기화 이벤트를 내고, 공유 그룹 변경은 내지 않는지 검증한다(PR-10 3b-3, Q-25).
package kr.timebar.diary.social;

import kr.timebar.diary.auth.*;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringJUnitConfig({FeatureTestConfig.class, CommunityMembersEventTest.Recorder.class})
class CommunityMembersEventTest {
    static class Recorder {
        final List<String> ids = new CopyOnWriteArrayList<>();
        @EventListener void on(CommunityMembersChanged event) { ids.add(event.communityId()); }
    }
    @Autowired SocialService social;
    @Autowired UserRepository users;
    @Autowired Recorder recorder;
    String owner, member, applicant;

    @BeforeEach void setup() { owner = account("방장"); member = account("회원"); applicant = account("신청자"); recorder.ids.clear(); }
    private String account(String name) {
        var user = new UserEntity(UUID.randomUUID() + "@example.test", name, "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        return user.getId();
    }
    private List<String> drain() { var copy = List.copyOf(recorder.ids); recorder.ids.clear(); return copy; }

    @Test void everyCommunityMembershipChangePublishesAnEvent() {
        String c = social.createSpace(owner, FeatureType.COMMUNITY, Map.of("title", "러닝", "joinPolicy", "approval", "visibility", "public", "capacity", 10)).get("id").toString();
        assertEquals(List.of(c), drain());
        social.join(member, FeatureType.COMMUNITY, c, Map.of());
        social.decide(owner, c, member, Map.of("approved", true));
        assertEquals(List.of(c, c), drain());
        social.updateSpace(owner, FeatureType.COMMUNITY, c, Map.of("title", "새벽 러닝", "joinPolicy", "approval", "visibility", "public", "capacity", 10, "version", 1));
        assertEquals(List.of(c), drain());
        social.removeMember(owner, FeatureType.COMMUNITY, c, member);
        assertEquals(List.of(c), drain());
        social.deleteSpace(owner, FeatureType.COMMUNITY, c, 2);
        assertEquals(List.of(c), drain());
    }

    @Test void groupMembershipChangesDoNotPublish() {
        String g = social.createSpace(owner, FeatureType.GROUP, Map.of("title", "가족")).get("id").toString();
        social.addMember(owner, FeatureType.GROUP, g, Map.of("userId", member));
        social.join(member, FeatureType.GROUP, g, Map.of());
        assertTrue(recorder.ids.isEmpty());
    }
}
