// 공유 화면이 이름을 보이고 초대를 거절·확인할 수 있도록 서버가 주는 값을 검증한다(PR-10 2단계, TS-38).
package kr.timebar.diary.social;

import kr.timebar.diary.auth.*;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(FeatureTestConfig.class)
class ShareScreenServerTest {
    @Autowired SocialService social;
    @Autowired UserRepository users;
    String alice, bob, carol;

    @BeforeEach void setup() { alice = account("앨리스"); bob = account("밥"); carol = account("캐럴"); }
    private String account(String name) {
        var user = new UserEntity(UUID.randomUUID() + "@example.test", name, "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        return user.getId();
    }

    /** 친구 행에는 상대방 ID와 이름이 있다. 보낸 사람·받은 사람 어느 쪽에서 봐도 상대방이다. */
    @Test void friendRowsNameTheOtherPerson() {
        social.invite(alice, Map.of("userId", bob));
        var mine = social.friends(alice).get(0);
        assertEquals(bob, mine.get("friendId"));
        assertEquals("밥", mine.get("friendName"));
        var theirs = social.friends(bob).get(0);
        assertEquals(alice, theirs.get("friendId"));
        assertEquals("앨리스", theirs.get("friendName"));
    }

    /** 차단 목록과 멤버 목록에도 이름이 있다. */
    @Test void blocksAndMembersCarryNicknames() {
        social.block(alice, carol);
        assertEquals("캐럴", social.blocks(alice).get(0).get("nickname"));
        String g = social.createSpace(alice, FeatureType.GROUP, Map.of("title", "가족")).get("id").toString();
        social.addMember(alice, FeatureType.GROUP, g, Map.of("userId", bob));
        social.join(bob, FeatureType.GROUP, g, Map.of());
        var names = social.members(alice, FeatureType.GROUP, g, false).stream().map(row -> row.get("nickname")).toList();
        assertEquals(Set.of("앨리스", "밥"), new HashSet<>(names));
    }

    /** 방장은 아직 수락하지 않은 초대를 볼 수 있고, 멤버는 볼 수 없다. */
    @Test void ownerSeesInvitedMembers() {
        String g = social.createSpace(alice, FeatureType.GROUP, Map.of("title", "스터디")).get("id").toString();
        social.addMember(alice, FeatureType.GROUP, g, Map.of("userId", bob));
        social.addMember(alice, FeatureType.GROUP, g, Map.of("userId", carol));
        social.join(carol, FeatureType.GROUP, g, Map.of());
        var invited = social.invited(alice, FeatureType.GROUP, g);
        assertEquals(List.of(bob), invited.stream().map(row -> row.get("userId")).toList());
        assertEquals("밥", invited.get(0).get("nickname"));
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> social.invited(carol, FeatureType.GROUP, g)).errorCode());
    }

    /** 초대받은 사람은 수락하지 않고 거절할 수 있다. 거절하면 그룹 목록에서 사라진다. */
    @Test void invitedPersonCanDecline() {
        String g = social.createSpace(alice, FeatureType.GROUP, Map.of("title", "여행")).get("id").toString();
        social.addMember(alice, FeatureType.GROUP, g, Map.of("userId", bob));
        assertEquals("INVITED", social.spaces(bob, FeatureType.GROUP).get(0).get("membership"));
        social.removeMember(bob, FeatureType.GROUP, g, bob);
        assertTrue(social.spaces(bob, FeatureType.GROUP).isEmpty());
        assertTrue(social.invited(alice, FeatureType.GROUP, g).isEmpty());
        // 초대받지 않은 사람은 여전히 남의 그룹 멤버를 지울 수 없다
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> social.removeMember(carol, FeatureType.GROUP, g, alice)).errorCode());
    }
}
