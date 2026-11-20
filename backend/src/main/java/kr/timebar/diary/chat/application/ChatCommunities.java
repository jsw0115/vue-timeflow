// 커뮤니티 이름과 활성 회원만 이 포트로 채팅 경계를 넘는다. 채팅 SQL은 커뮤니티 테이블을 읽지 않는다(PR-10 3b-3, Q-25).
package kr.timebar.diary.chat.application;

import java.util.List;
import java.util.Optional;

public interface ChatCommunities {
    /** 보는 사람에게 보이는 커뮤니티의 이름. 없거나 비회원이 비공개 커뮤니티를 부르면 비어 있다. */
    Optional<String> visibleTitle(String communityId, String viewer);
    /** 커뮤니티 이름. 지워졌으면 비어 있다. */
    Optional<String> title(String communityId);
    /** 지금 활성 회원인 계정 ID. */
    List<String> activeMembers(String communityId);
}
