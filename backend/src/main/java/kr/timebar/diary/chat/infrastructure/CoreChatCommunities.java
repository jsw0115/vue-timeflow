// 커뮤니티 서비스(SocialService)로 커뮤니티 이름과 활성 회원을 읽어 채팅에 넘긴다(PR-10 3b-3, Q-25).
package kr.timebar.diary.chat.infrastructure;

import kr.timebar.diary.chat.application.ChatCommunities;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.social.SocialService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "app.chat.enabled", havingValue = "true")
public class CoreChatCommunities implements ChatCommunities {
    private final SocialService social;
    public CoreChatCommunities(SocialService social) { this.social = social; }
    @Override public Optional<String> visibleTitle(String communityId, String viewer) {
        try { return Optional.of(Objects.toString(social.space(viewer, FeatureType.COMMUNITY, communityId).get("title"), "")); }
        catch (ApiException e) { if (e.errorCode() == ErrorCode.NOT_FOUND) return Optional.empty(); throw e; }
    }
    @Override public Optional<String> title(String communityId) { return social.title(FeatureType.COMMUNITY, communityId); }
    @Override public List<String> activeMembers(String communityId) { return social.activeMembers(FeatureType.COMMUNITY, communityId); }
}
