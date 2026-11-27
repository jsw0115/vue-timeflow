// 업무 보고서 초안 API(PR-19 UF-138): 프로젝트(최상위 WBS 작업)에 실제 기록 잇기·빼기와 기간 초안 재료 조회. 저장·발송은 하지 않는다.
package kr.timebar.diary.contract;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.records.ProjectActuals;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/work/projects/{projectId}")
public class ProjectReportController {
    private final ProjectActuals actuals;
    public ProjectReportController(ProjectActuals actuals) { this.actuals = actuals; }

    @GetMapping("/actuals")
    public ApiResponse<?> candidates(@PathVariable String projectId, @RequestParam String from, @RequestParam String to) { return ApiResponse.ok(actuals.candidates(CurrentUser.id(), projectId, from, to)); }
    @PostMapping("/actuals")
    public ApiResponse<?> link(@PathVariable String projectId, @RequestBody(required = false) Map<String, Object> body) { return ApiResponse.ok(actuals.link(CurrentUser.id(), projectId, body)); }
    @DeleteMapping("/actuals/{actualId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlink(@PathVariable String projectId, @PathVariable String actualId) { actuals.unlink(CurrentUser.id(), projectId, actualId); }
    @GetMapping("/report-draft")
    public ApiResponse<?> draft(@PathVariable String projectId, @RequestParam String from, @RequestParam String to) { return ApiResponse.ok(actuals.draft(CurrentUser.id(), projectId, from, to)); }
}
