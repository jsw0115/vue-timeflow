// 커뮤니티 가입 승인·회원·게시글·댓글·챌린지 API를 제공한다.
package kr.timebar.diary.social;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.*;

@RestController
@RequestMapping("/api/communities")
public class CommunityController {
    private final SocialService service;
    public CommunityController(SocialService service) { this.service = service; }
    @GetMapping
    public ApiResponse<?> list(@RequestParam(required=false) String q, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) { return ApiResponse.ok(FeaturePage.of(service.spaces(CurrentUser.id(), FeatureType.COMMUNITY), null, null, q, null, page, size)); }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> create(@RequestBody Map<String,Object> body) { return ApiResponse.ok(service.createSpace(CurrentUser.id(), FeatureType.COMMUNITY, body)); }
    @GetMapping("/{id}")
    public ApiResponse<?> get(@PathVariable String id) { return ApiResponse.ok(service.space(CurrentUser.id(), FeatureType.COMMUNITY, id)); }
    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.updateSpace(CurrentUser.id(), FeatureType.COMMUNITY, id, body)); }
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @RequestParam long version) { service.deleteSpace(CurrentUser.id(), FeatureType.COMMUNITY, id, version); }
    @PostMapping("/{id}/join")
    public ApiResponse<?> join(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.join(CurrentUser.id(), FeatureType.COMMUNITY, id, body)); }
    @GetMapping("/{id}/members")
    public ApiResponse<?> members(@PathVariable String id) { return ApiResponse.ok(service.members(CurrentUser.id(), FeatureType.COMMUNITY, id, false)); }
    @PostMapping("/{id}/members")
    public ApiResponse<?> invite(@PathVariable String id, @RequestBody Map<String,Object> body) { service.addMember(CurrentUser.id(), FeatureType.COMMUNITY, id, body); return ApiResponse.ok(null); }
    @DeleteMapping("/{id}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable String id, @PathVariable String userId) { service.removeMember(CurrentUser.id(), FeatureType.COMMUNITY, id, userId); }
    @GetMapping("/{id}/join-requests")
    public ApiResponse<?> requests(@PathVariable String id) { return ApiResponse.ok(service.members(CurrentUser.id(), FeatureType.COMMUNITY, id, true)); }
    @PutMapping("/{id}/join-requests/{userId}")
    public ApiResponse<?> decide(@PathVariable String id, @PathVariable String userId, @RequestBody Map<String,Object> body) { service.decide(CurrentUser.id(), id, userId, body); return ApiResponse.ok(null); }
    @GetMapping("/{id}/posts")
    public ApiResponse<?> posts(@PathVariable String id, @RequestParam(required=false) String q, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) { return ApiResponse.ok(FeaturePage.of(service.posts(CurrentUser.id(), id, FeatureType.POST), null, null, q, null, page, size)); }
    @PostMapping("/{id}/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> post(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.createPost(CurrentUser.id(), id, FeatureType.POST, body)); }
    @PutMapping("/{id}/posts/{postId}")
    public ApiResponse<?> edit(@PathVariable String id, @PathVariable String postId, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.updatePost(CurrentUser.id(), id, postId, body)); }
    @DeleteMapping("/{id}/posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(@PathVariable String id, @PathVariable String postId, @RequestParam long version) { service.deletePost(CurrentUser.id(), id, postId, version); }
    @GetMapping("/{id}/posts/{postId}/comments")
    public ApiResponse<?> comments(@PathVariable String id, @PathVariable String postId) { return ApiResponse.ok(service.comments(CurrentUser.id(), id, postId)); }
    @PostMapping("/{id}/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> comment(@PathVariable String id, @PathVariable String postId, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.comment(CurrentUser.id(), id, postId, body)); }
    @PutMapping("/{id}/posts/{postId}/like")
    public ApiResponse<?> like(@PathVariable String id, @PathVariable String postId, @RequestBody Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("liked")); if (!(body.get("liked") instanceof Boolean)) FeatureInput.fail("liked는 boolean입니다.");
        service.like(CurrentUser.id(), id, postId, Boolean.TRUE.equals(body.get("liked"))); return ApiResponse.ok(null);
    }
    @GetMapping("/{id}/challenges")
    public ApiResponse<?> challenges(@PathVariable String id) { return ApiResponse.ok(service.posts(CurrentUser.id(), id, FeatureType.CHALLENGE)); }
    @PostMapping("/{id}/challenges")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> challenge(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.challenge(CurrentUser.id(), id, body)); }
    @PostMapping("/{id}/challenges/{challengeId}/join")
    public ApiResponse<?> challengeJoin(@PathVariable String id, @PathVariable String challengeId) { service.challengeJoin(CurrentUser.id(), id, challengeId); return ApiResponse.ok(null); }
    @PutMapping("/{id}/challenges/{challengeId}/checkins/{date}")
    public ApiResponse<?> checkin(@PathVariable String id, @PathVariable String challengeId, @PathVariable String date) { service.checkin(CurrentUser.id(), id, challengeId, date); return ApiResponse.ok(null); }
    @GetMapping("/{id}/challenges/{challengeId}/ranking")
    public ApiResponse<?> ranking(@PathVariable String id, @PathVariable String challengeId) { return ApiResponse.ok(service.ranking(CurrentUser.id(), id, challengeId)); }
}
