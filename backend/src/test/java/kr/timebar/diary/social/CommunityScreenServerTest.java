// 커뮤니티 화면이 쓰는 서버 규칙(신청 취소, 공개 정보와 회원 전용 글 구분, 가입 요청 이름)을 검증한다(PR-10 3단계, TS-39).
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
class CommunityScreenServerTest {
    @Autowired SocialService social;
    @Autowired UserRepository users;
    String owner, applicant, outsider;

    @BeforeEach void setup() { owner = account("방장"); applicant = account("신청자"); outsider = account("외부인"); }
    private String account(String name) {
        var user = new UserEntity(UUID.randomUUID() + "@example.test", name, "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        return user.getId();
    }
    private String community(String visibility, String joinPolicy) {
        return social.createSpace(owner, FeatureType.COMMUNITY, Map.of("title", "아침 러닝", "joinPolicy", joinPolicy, "visibility", visibility, "capacity", 10)).get("id").toString();
    }

    /** 승인제 커뮤니티에 낸 가입 신청은 본인이 취소할 수 있다. 취소하면 요청함에서 빠진다. */
    @Test void applicantCanCancelPendingRequest() {
        String c = community("public", "approval");
        assertEquals("PENDING", social.join(applicant, FeatureType.COMMUNITY, c, Map.of("message", "함께 달리고 싶어요")).get("membership"));
        var requests = social.members(owner, FeatureType.COMMUNITY, c, true);
        assertEquals("신청자", requests.get(0).get("nickname"));
        assertEquals("함께 달리고 싶어요", requests.get(0).get("message"));
        social.removeMember(applicant, FeatureType.COMMUNITY, c, applicant);
        assertTrue(social.members(owner, FeatureType.COMMUNITY, c, true).isEmpty());
        assertEquals("NONE", social.space(applicant, FeatureType.COMMUNITY, c).get("membership"));
    }

    /** 공개 커뮤니티의 소개는 비회원도 보지만, 글은 회원만 본다. */
    @Test void publicInfoIsOpenButPostsAreMembersOnly() {
        String c = community("public", "open");
        social.createPost(owner, c, FeatureType.POST, Map.of("body", "오늘 5km"));
        assertEquals("아침 러닝", social.space(outsider, FeatureType.COMMUNITY, c).get("title"));
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> social.posts(outsider, c, FeatureType.POST)).errorCode());
        social.join(outsider, FeatureType.COMMUNITY, c, Map.of());
        assertEquals(1, social.posts(outsider, c, FeatureType.POST).size());
    }

    /** 비공개 커뮤니티는 비회원 목록에 없고, ID로 불러도 없는 ID와 같은 404다(UT-196). */
    @Test void privateCommunityIsHiddenFromOutsiders() {
        String c = community("private", "approval");
        assertTrue(social.spaces(outsider, FeatureType.COMMUNITY).stream().noneMatch(row -> c.equals(row.get("id"))));
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> social.space(outsider, FeatureType.COMMUNITY, c)).errorCode());
    }

    /** 신청이 아닌 회원 상태(활성 아님)에서 남의 신청을 지우는 일은 여전히 막는다. */
    @Test void othersCannotRemoveAPendingRequest() {
        String c = community("public", "approval");
        social.join(applicant, FeatureType.COMMUNITY, c, Map.of());
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> social.removeMember(outsider, FeatureType.COMMUNITY, c, applicant)).errorCode());
    }
}
