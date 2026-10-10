// 홈과 통계 화면에 실제 데이터 집계 결과를 제공한다.
package kr.timebar.diary.contract;
import kr.timebar.diary.records.InsightService;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.time.*;
@RestController
@RequestMapping("/api")
public class InsightController {
    private final InsightService service;
    public InsightController(InsightService service) { this.service = service; }
    @GetMapping("/home/summary")
    public ApiResponse<?> home(@RequestParam(required=false) String date) { return ApiResponse.ok(service.summary(CurrentUser.id(), date)); }
    @GetMapping("/stat/dashboard")
    public ApiResponse<?> dashboard(@RequestParam(defaultValue="month") String range, @RequestParam(required=false) String date) {
        LocalDate day = date == null ? LocalDate.now(ZoneId.of("Asia/Seoul")) : FeatureInput.date(date);
        LocalDate start = switch (range) {
            case "day" -> day;
            case "week" -> day.minusDays(day.getDayOfWeek().getValue()-1);
            case "month" -> day.withDayOfMonth(1);
            case "year" -> day.withDayOfYear(1);
            default -> throw new IllegalArgumentException("range는 day/week/month/year입니다.");
        };
        LocalDate end = switch (range) { case "day" -> start; case "week" -> start.plusDays(6); case "month" -> start.plusMonths(1).minusDays(1); default -> start.plusYears(1).minusDays(1); };
        return ApiResponse.ok(service.stats(CurrentUser.id(), start.toString(), end.toString()));
    }
    @GetMapping("/stat/category")
    public ApiResponse<?> categories(@RequestParam(required=false) String from, @RequestParam(required=false) String to) { return ApiResponse.ok(service.stats(CurrentUser.id(), from, to).get("categories")); }
    @GetMapping("/stat/plan-actual")
    public ApiResponse<?> compare(@RequestParam(required=false) String from, @RequestParam(required=false) String to) { return ApiResponse.ok(service.stats(CurrentUser.id(), from, to)); }
    @GetMapping("/stat/focus")
    public ApiResponse<?> focus(@RequestParam(required=false) String from, @RequestParam(required=false) String to) { return ApiResponse.ok(service.stats(CurrentUser.id(), from, to)); }
}
