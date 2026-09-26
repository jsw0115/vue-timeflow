package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "Share, Admin & Reports") @RestController @RequestMapping("/api")
public class ShareAdminReportController {
    @GetMapping("/share/friends") public ApiResponse<?> friends() { return ContractResponses.stub("GET /share/friends"); }
    @PostMapping("/share/friends/invite") public ApiResponse<?> invite(@RequestBody Map<String,Object> body) { return ContractResponses.stub("POST /share/friends/invite"); }
    @PostMapping("/share/friends/{id}/accept") public ApiResponse<?> accept(@PathVariable String id) { return ContractResponses.stub("POST /share/friends/{id}/accept"); }
    @PostMapping("/share/friends/{id}/reject") public ApiResponse<?> reject(@PathVariable String id) { return ContractResponses.stub("POST /share/friends/{id}/reject"); }
    @DeleteMapping("/share/friends/{id}") public ApiResponse<?> deleteFriend(@PathVariable String id) { return ContractResponses.stub("DELETE /share/friends/{id}"); }
    @GetMapping("/share/groups") public ApiResponse<?> groups() { return ContractResponses.stub("GET /share/groups"); }
    @PostMapping("/share/groups") public ApiResponse<?> createGroup(@RequestBody Map<String,Object> body) { return ContractResponses.stub("POST /share/groups"); }
    @GetMapping("/share/groups/{id}") public ApiResponse<?> group(@PathVariable String id) { return ContractResponses.stub("GET /share/groups/{id}"); }
    @PutMapping("/share/groups/{id}") public ApiResponse<?> updateGroup(@PathVariable String id, @RequestBody Map<String,Object> body) { return ContractResponses.stub("PUT /share/groups/{id}"); }
    @DeleteMapping("/share/groups/{id}") public ApiResponse<?> deleteGroup(@PathVariable String id) { return ContractResponses.stub("DELETE /share/groups/{id}"); }
    @GetMapping("/share/groups/{id}/members") public ApiResponse<?> members(@PathVariable String id) { return ContractResponses.stub("GET /share/groups/{id}/members"); }
    @PostMapping("/share/groups/{id}/members") public ApiResponse<?> addMember(@PathVariable String id, @RequestBody Map<String,Object> body) { return ContractResponses.stub("POST /share/groups/{id}/members"); }
    @DeleteMapping("/share/groups/{id}/members/{memberId}") public ApiResponse<?> deleteMember(@PathVariable String id, @PathVariable String memberId) { return ContractResponses.stub("DELETE /share/groups/{id}/members/{memberId}"); }
    @GetMapping("/admin/users") public ApiResponse<?> users(@RequestParam(required=false) String q, @RequestParam(required=false) String role, @RequestParam(required=false) String status, @RequestParam(required=false) Integer page, @RequestParam(required=false) Integer size) { return ContractResponses.stub("GET /admin/users"); }
    @GetMapping("/admin/users/{id}") public ApiResponse<?> user(@PathVariable String id) { return ContractResponses.stub("GET /admin/users/{id}"); }
    @PostMapping("/admin/users") public ApiResponse<?> createUser(@RequestBody Map<String,Object> body) { return ContractResponses.stub("POST /admin/users"); }
    @PutMapping("/admin/users/{id}") public ApiResponse<?> updateUser(@PathVariable String id, @RequestBody Map<String,Object> body) { return ContractResponses.stub("PUT /admin/users/{id}"); }
    @DeleteMapping("/admin/users/{id}") public ApiResponse<?> deleteUser(@PathVariable String id) { return ContractResponses.stub("DELETE /admin/users/{id}"); }
    @GetMapping("/reports/time-blocks") public ApiResponse<?> reportTimeBlocks(@RequestParam String date, @RequestParam(required=false) String categoryName) { return ContractResponses.stub("GET /reports/time-blocks"); }
    @PostMapping("/reports/draft") public ApiResponse<?> reportDraft(@RequestBody Map<String,Object> body) { return ContractResponses.stub("POST /reports/draft"); }
    @GetMapping("/reports/{reportKey}") public ApiResponse<?> report(@PathVariable String reportKey) { return ContractResponses.stub("GET /reports/{reportKey}"); }
    @PostMapping("/reports/{reportKey}") public ApiResponse<?> saveReport(@PathVariable String reportKey, @RequestBody Map<String,Object> body) { return ContractResponses.stub("POST /reports/{reportKey}"); }
    @GetMapping("/reports/{reportKey}/sub-reports") public ApiResponse<?> subReports(@PathVariable String reportKey) { return ContractResponses.stub("GET /reports/{reportKey}/sub-reports"); }
}
