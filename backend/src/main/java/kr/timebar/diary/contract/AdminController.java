// 관리자 사용자 관리와 운영 기능의 권한 검사를 적용한 API를 제공한다.
package kr.timebar.diary.contract;
import kr.timebar.diary.operations.AdminService;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService service;
    public AdminController(AdminService service) { this.service = service; }
    @GetMapping("/users")
    public ApiResponse<?> users(@RequestParam(required=false) String q, @RequestParam(required=false) String role, @RequestParam(required=false) String status, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) { return ApiResponse.ok(service.users(q, role, status, page, size)); }
    @GetMapping("/users/{id}")
    public ApiResponse<?> user(@PathVariable String id) { return ApiResponse.ok(service.getUser(id)); }
    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> createUser(@RequestBody Map<String,Object> body) { return ApiResponse.ok(service.createUser(body)); }
    @PutMapping("/users/{id}")
    public ApiResponse<?> updateUser(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.updateUser(id, body)); }
    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable String id) { service.deleteUser(id); }
    @PostMapping("/users/{id}/force-logout")
    public ApiResponse<?> logout(@PathVariable String id) { service.logout(id); return ApiResponse.ok(null); }
    @GetMapping("/tickets")
    public ApiResponse<?> tickets() { return ApiResponse.ok(service.tickets()); }
    @PutMapping("/tickets/{id}")
    public ApiResponse<?> reply(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.reply(id, body)); }
    @GetMapping("/stats")
    public ApiResponse<?> metrics() { return ApiResponse.ok(service.metrics()); }
    @GetMapping("/monitoring")
    public ApiResponse<?> monitoring() { return ApiResponse.ok(service.monitoring()); }
    @GetMapping("/settings")
    public ApiResponse<?> settings() { return ApiResponse.ok(service.settings()); }
    @PutMapping("/settings")
    public ApiResponse<?> saveSettings(@RequestBody Map<String,Object> body) { return ApiResponse.ok(service.settings(body)); }
    @GetMapping("/audit")
    public ApiResponse<?> audit(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q) { return ApiResponse.ok(service.list(FeatureType.AUDIT, page, size, q)); }
    @GetMapping("/content")
    public ApiResponse<?> contentList(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q) { return ApiResponse.ok(service.list(FeatureType.CONTENT, page, size, q)); }
    @PostMapping("/content")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> contentCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(service.create(FeatureType.CONTENT, body)); }
    @PutMapping("/content/{id}")
    public ApiResponse<?> contentUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.update(FeatureType.CONTENT, id, body)); }
    @DeleteMapping("/content/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void contentDelete(@PathVariable String id, @RequestParam long version) { service.delete(FeatureType.CONTENT, id, version); }
    @GetMapping("/notices")
    public ApiResponse<?> noticesList(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q) { return ApiResponse.ok(service.list(FeatureType.NOTICE, page, size, q)); }
    @PostMapping("/notices")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> noticesCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(service.create(FeatureType.NOTICE, body)); }
    @PutMapping("/notices/{id}")
    public ApiResponse<?> noticesUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(service.update(FeatureType.NOTICE, id, body)); }
    @DeleteMapping("/notices/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void noticesDelete(@PathVariable String id, @RequestParam long version) { service.delete(FeatureType.NOTICE, id, version); }
}
