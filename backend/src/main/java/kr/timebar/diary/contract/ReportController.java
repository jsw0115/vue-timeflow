// 업무 리포트의 초안 생성과 사용자별 저장 및 하위 리포트 조회를 제공한다.
package kr.timebar.diary.contract;
import kr.timebar.diary.feature.*;
import kr.timebar.diary.records.InsightService;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final FeatureStore store;
    private final InsightService insight;
    public ReportController(FeatureStore store, InsightService insight) { this.store = store; this.insight = insight; }
    @GetMapping("/time-blocks")
    public ApiResponse<?> blocks(@RequestParam String date, @RequestParam(required=false) String categoryName) { return ApiResponse.ok(insight.timeBlocks(CurrentUser.id(), date, categoryName)); }
    @PostMapping("/draft")
    public ApiResponse<?> draft(@RequestBody Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("date", "category"));
        String date = FeatureInput.requiredText(body, "date");
        var blocks = insight.timeBlocks(CurrentUser.id(), date, FeatureInput.text(body, "category").isEmpty() ? null : FeatureInput.text(body, "category"));
        String text = blocks.stream().map(row -> "- " + row.get("title") + " (" + row.get("minutes") + "분)").collect(java.util.stream.Collectors.joining("\n"));
        return ApiResponse.ok(Map.of("title", date + " 업무 리포트", "date", date, "body", text, "generator", "rule", "timeBlocks", blocks));
    }
    @GetMapping("/{reportKey}")
    public ApiResponse<?> get(@PathVariable String reportKey) { return ApiResponse.ok(store.get(CurrentUser.id(), FeatureType.REPORT, reportKey)); }
    @PostMapping("/{reportKey}")
    public ApiResponse<?> save(@PathVariable String reportKey, @RequestBody Map<String,Object> body) {
        if (!reportKey.matches("[A-Za-z0-9_-]{1,100}")) FeatureInput.fail("리포트 키를 확인해주세요.");
        var data = FeatureInput.validate(FeatureType.REPORT, body);
        if (store.optional(CurrentUser.id(), FeatureType.REPORT, reportKey).isEmpty()) return ApiResponse.ok(store.create(CurrentUser.id(), FeatureType.REPORT, reportKey, data));
        return ApiResponse.ok(store.replace(CurrentUser.id(), FeatureType.REPORT, reportKey, FeatureInput.version(body), data));
    }
    @GetMapping("/{reportKey}/sub-reports")
    public ApiResponse<?> children(@PathVariable String reportKey) {
        store.get(CurrentUser.id(), FeatureType.REPORT, reportKey);
        return ApiResponse.ok(store.all(CurrentUser.id(), FeatureType.REPORT).stream().filter(row -> reportKey.equals(row.get("parentId"))).toList());
    }
}
