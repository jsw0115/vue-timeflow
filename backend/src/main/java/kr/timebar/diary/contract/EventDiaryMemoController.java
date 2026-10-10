// 기존 날짜별 다이어리 계약을 개인 기록 서비스에 연결한다.
package kr.timebar.diary.contract;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.records.RecordService;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/api/diary")
public class EventDiaryMemoController {
    private final RecordService records;
    public EventDiaryMemoController(RecordService records) { this.records = records; }
    @GetMapping("/calendar")
    public ApiResponse<?> calendar(@RequestParam int year, @RequestParam int month) { return ApiResponse.ok(records.calendar(CurrentUser.id(), year, month)); }
    @GetMapping("/{date}")
    public ApiResponse<?> diary(@PathVariable String date) {
        FeatureInput.date(date);
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.DIARY, date, date, null, null, 0, 100));
    }
    @PostMapping("/{date}")
    public ApiResponse<?> save(@PathVariable String date, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.saveDate(CurrentUser.id(), FeatureType.DIARY, date, body)); }
    @DeleteMapping("/{date}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String date, @RequestParam long version) { FeatureInput.date(date); records.delete(CurrentUser.id(), FeatureType.DIARY, date, version); }
}
