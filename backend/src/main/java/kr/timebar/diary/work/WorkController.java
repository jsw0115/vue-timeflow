// 비공개 업무 기록의 조회와 저장 API를 제공한다.
package kr.timebar.diary.work;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.records.RecordService;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class WorkController {
    private final RecordService records;
    private final WorkService work;
    public WorkController(RecordService records, WorkService work) { this.records = records; this.work = work; }
    @GetMapping("/work/records")
    public ApiResponse<?> workrecordList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.WORK_RECORD, from, to, q, category, page, size));
    }
    @GetMapping("/work/records/{id}")
    public ApiResponse<?> workrecordGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.WORK_RECORD, id)); }
    @PostMapping("/work/records")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> workrecordCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(work.create(CurrentUser.id(), FeatureType.WORK_RECORD, body)); }
    @PutMapping("/work/records/{id}")
    public ApiResponse<?> workrecordUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(work.update(CurrentUser.id(), FeatureType.WORK_RECORD, id, body)); }
    @DeleteMapping("/work/records/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void workrecordDelete(@PathVariable String id, @RequestParam long version) { work.delete(CurrentUser.id(), FeatureType.WORK_RECORD, id, version); }
    @GetMapping("/work/wiki")
    public ApiResponse<?> wikiList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(FeaturePage.of(work.current(CurrentUser.id(), FeatureType.WIKI), from, to, q, category, page, size));
    }
    @GetMapping("/work/wiki/{id}")
    public ApiResponse<?> wikiGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.WIKI, id)); }
    @PostMapping("/work/wiki")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> wikiCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(work.create(CurrentUser.id(), FeatureType.WIKI, body)); }
    @PutMapping("/work/wiki/{id}")
    public ApiResponse<?> wikiUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(work.update(CurrentUser.id(), FeatureType.WIKI, id, body)); }
    @DeleteMapping("/work/wiki/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void wikiDelete(@PathVariable String id, @RequestParam long version) { work.delete(CurrentUser.id(), FeatureType.WIKI, id, version); }
    @GetMapping("/work/wbs/nodes")
    public ApiResponse<?> wbsList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.WBS, from, to, q, category, page, size));
    }
    @GetMapping("/work/wbs/nodes/{id}")
    public ApiResponse<?> wbsGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.WBS, id)); }
    @PostMapping("/work/wbs/nodes")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> wbsCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(work.create(CurrentUser.id(), FeatureType.WBS, body)); }
    @PutMapping("/work/wbs/nodes/{id}")
    public ApiResponse<?> wbsUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(work.update(CurrentUser.id(), FeatureType.WBS, id, body)); }
    @DeleteMapping("/work/wbs/nodes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void wbsDelete(@PathVariable String id, @RequestParam long version) { work.delete(CurrentUser.id(), FeatureType.WBS, id, version); }
    @GetMapping("/work/career/projects")
    public ApiResponse<?> careerList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.CAREER, from, to, q, category, page, size));
    }
    @GetMapping("/work/career/projects/{id}")
    public ApiResponse<?> careerGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.CAREER, id)); }
    @PostMapping("/work/career/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> careerCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(work.create(CurrentUser.id(), FeatureType.CAREER, body)); }
    @PutMapping("/work/career/projects/{id}")
    public ApiResponse<?> careerUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(work.update(CurrentUser.id(), FeatureType.CAREER, id, body)); }
    @DeleteMapping("/work/career/projects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void careerDelete(@PathVariable String id, @RequestParam long version) { work.delete(CurrentUser.id(), FeatureType.CAREER, id, version); }
    @GetMapping("/work/portfolio")
    public ApiResponse<?> portfolioList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.PORTFOLIO, from, to, q, category, page, size));
    }
    @GetMapping("/work/portfolio/{id}")
    public ApiResponse<?> portfolioGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.PORTFOLIO, id)); }
    @PostMapping("/work/portfolio")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> portfolioCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(work.create(CurrentUser.id(), FeatureType.PORTFOLIO, body)); }
    @PutMapping("/work/portfolio/{id}")
    public ApiResponse<?> portfolioUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(work.update(CurrentUser.id(), FeatureType.PORTFOLIO, id, body)); }
    @DeleteMapping("/work/portfolio/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void portfolioDelete(@PathVariable String id, @RequestParam long version) { work.delete(CurrentUser.id(), FeatureType.PORTFOLIO, id, version); }
}
