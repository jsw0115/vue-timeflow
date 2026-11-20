// 커뮤니티 활성 회원이나 이름이 바뀌었음을 알린다. 채팅이 켜져 있으면 같은 트랜잭션에서 커뮤니티 채팅방 멤버를 맞춘다(PR-10 3b-3, Q-25).
package kr.timebar.diary.social;

public record CommunityMembersChanged(String communityId) { }
