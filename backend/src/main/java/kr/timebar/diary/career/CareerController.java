// 커리어 활동 원장과 취업·이직 지원 관리의 계정별 조회·저장 API를 제공한다. 생성은 Idempotency-Key로 같은 요청을 한 번만 만든다.
package kr.timebar.diary.career;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.records.RecordService;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/career")
public class CareerController {
    private final RecordService records;
    private final CareerService career;
    public CareerController(RecordService records, CareerService career) { this.records = records; this.career = career; }
    @GetMapping("/activities")
    public ApiResponse<?> activityList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.CAREER_ACTIVITY, from, to, q, category, page, size));
    }
    @GetMapping("/activities/{id}")
    public ApiResponse<?> activityGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.CAREER_ACTIVITY, id)); }
    @PostMapping("/activities")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> activityCreate(@RequestHeader(value="Idempotency-Key", required=false) String key, @RequestBody Map<String,Object> body) { return ApiResponse.ok(career.create(CurrentUser.id(), FeatureType.CAREER_ACTIVITY, body, key)); }
    @PutMapping("/activities/{id}")
    public ApiResponse<?> activityUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(career.update(CurrentUser.id(), FeatureType.CAREER_ACTIVITY, id, body)); }
    @DeleteMapping("/activities/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activityDelete(@PathVariable String id, @RequestParam long version) { career.delete(CurrentUser.id(), FeatureType.CAREER_ACTIVITY, id, version); }
    @GetMapping("/applications")
    public ApiResponse<?> applicationList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.JOB_APPLICATION, from, to, q, category, page, size));
    }
    @GetMapping("/applications/{id}")
    public ApiResponse<?> applicationGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.JOB_APPLICATION, id)); }
    @PostMapping("/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> applicationCreate(@RequestHeader(value="Idempotency-Key", required=false) String key, @RequestBody Map<String,Object> body) { return ApiResponse.ok(career.create(CurrentUser.id(), FeatureType.JOB_APPLICATION, body, key)); }
    @PutMapping("/applications/{id}")
    public ApiResponse<?> applicationUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(career.update(CurrentUser.id(), FeatureType.JOB_APPLICATION, id, body)); }
    @DeleteMapping("/applications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void applicationDelete(@PathVariable String id, @RequestParam long version) { career.delete(CurrentUser.id(), FeatureType.JOB_APPLICATION, id, version); }
}
