// 친구·차단·공유 그룹의 서버 권한과 상태 변경 API를 제공한다.
package kr.timebar.diary.contract;
import kr.timebar.diary.social.SocialService;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;
@RestController
@RequestMapping("/api/share")
public class ShareController {
    private final SocialService service;
    public ShareController(SocialService service) { this.service = service; }
    @GetMapping("/friends")
    public ApiResponse<?> friends() { return ApiResponse.ok(service.friends(CurrentUser.id())); }
    @PostMapping("/friends/invite")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> invite(@RequestBody Map<String,Object> body) { return ApiResponse.ok(service.invite(CurrentUser.id(), body)); }
    @PostMapping("/friends/{id}/accept")
    public ApiResponse<?> accept(@PathVariable String id) { service.friendAction(CurrentUser.id(), id, "accept"); return ApiResponse.ok(null); }
    @PostMapping("/friends/{id}/reject")
    public ApiResponse<?> reject(@PathVariable String id) { service.friendAction(CurrentUser.id(), id, "reject"); return ApiResponse.ok(null); }
    @DeleteMapping("/friends/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFriend(@PathVariable String id) { service.friendAction(CurrentUser.id(), id, "delete"); }
    @GetMapping("/blocks")
    public ApiResponse<?> blocks() { return ApiResponse.ok(service.blocks(CurrentUser.id())); }
    @PutMapping("/blocks/{userId}")
    public ApiResponse<?> block(@PathVariable String userId) { service.block(CurrentUser.id(), userId); return ApiResponse.ok(null); }
    @DeleteMapping("/blocks/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblock(@PathVariable String userId) { service.unblock(CurrentUser.id(), userId); }
    @GetMapping("/groups")
    public ApiResponse<?> groups() { return ApiResponse.ok(service.spaces(CurrentUser.id(), FeatureType.GROUP)); }
    @PostMapping("/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> createGroup(@RequestBody Map<String,Object> body) { return ApiResponse.ok(service.createSpace(CurrentUser.id(), FeatureType.GROUP, body)); }
    @GetMapping("/groups/{id}")
    public ApiResponse<?> group(@PathVariable String id) { return ApiResponse.ok(service.space(CurrentUser.id(), FeatureType.GROUP, id)); }
    @PutMapping("/groups/{id}")
    public ApiResponse<?> updateGroup(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.updateSpace(CurrentUser.id(), FeatureType.GROUP, id, body)); }
    @DeleteMapping("/groups/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroup(@PathVariable String id, @RequestParam long version) { service.deleteSpace(CurrentUser.id(), FeatureType.GROUP, id, version); }
    @GetMapping("/groups/{id}/members")
    public ApiResponse<?> members(@PathVariable String id) { return ApiResponse.ok(service.members(CurrentUser.id(), FeatureType.GROUP, id, false)); }
    @PostMapping("/groups/{id}/members")
    public ApiResponse<?> addMember(@PathVariable String id, @RequestBody Map<String,Object> body) { service.addMember(CurrentUser.id(), FeatureType.GROUP, id, body); return ApiResponse.ok(null); }
    @DeleteMapping("/groups/{id}/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMember(@PathVariable String id, @PathVariable String memberId) { service.removeMember(CurrentUser.id(), FeatureType.GROUP, id, memberId); }
    @PostMapping("/groups/{id}/join")
    public ApiResponse<?> join(@PathVariable String id) { return ApiResponse.ok(service.join(CurrentUser.id(), FeatureType.GROUP, id, Map.of())); }
}
