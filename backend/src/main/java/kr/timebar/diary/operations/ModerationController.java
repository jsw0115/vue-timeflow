// 커뮤니티 신고 접수와 관리자 신고 처리를 권한에 맞게 제공한다.
package kr.timebar.diary.operations;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.social.SocialService;
import kr.timebar.diary.security.CurrentUser;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ModerationController {
    private final FeatureStore store;
    private final SocialService social;
    private final AdminService admin;
    public ModerationController(FeatureStore store, SocialService social, AdminService admin) { this.store = store; this.social = social; this.admin = admin; }
    @PostMapping("/communities/{id}/posts/{postId}/report")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> report(@PathVariable String id, @PathVariable String postId, @RequestBody Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("reason")); social.require(CurrentUser.id(), FeatureType.COMMUNITY, id, false); store.get(id, FeatureType.POST, postId);
        var data = FeatureInput.validate(FeatureType.MODERATION, Map.of("communityId", id, "postId", postId, "reason", FeatureInput.requiredText(body, "reason")));
        return ApiResponse.ok(store.create(CurrentUser.id(), FeatureType.MODERATION, data));
    }
    @GetMapping("/admin/moderation")
    public ApiResponse<?> list() { return ApiResponse.ok(admin.moderation()); }
    @PutMapping("/admin/moderation/{id}")
    public ApiResponse<?> decide(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(admin.moderate(id, body)); }
}
