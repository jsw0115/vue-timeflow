package kr.timebar.diary.planner;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.event.dto.EventResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/planner")
public class PlannerViewController {
    private final PlannerAggregationService plannerAggregationService;

    public PlannerViewController(PlannerAggregationService plannerAggregationService) {
        this.plannerAggregationService = plannerAggregationService;
    }

    @GetMapping("/daily")
    public ApiResponse<PlannerViewResponse> daily(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.ok(plannerAggregationService.daily(CurrentUser.id(), date));
    }

    @GetMapping("/weekly")
    public ApiResponse<PlannerViewResponse> weekly(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start) {
        return ApiResponse.ok(plannerAggregationService.weekly(CurrentUser.id(), start));
    }

    @GetMapping("/monthly")
    public ApiResponse<PlannerViewResponse> monthly(@RequestParam int year, @RequestParam int month) {
        return ApiResponse.ok(plannerAggregationService.monthly(CurrentUser.id(), year, month));
    }

    @GetMapping("/yearly")
    public ApiResponse<PlannerViewResponse> yearly(@RequestParam int year) {
        return ApiResponse.ok(plannerAggregationService.yearly(CurrentUser.id(), year));
    }

    @GetMapping("/upcoming")
    public ApiResponse<List<EventResponse>> upcoming(@RequestParam(defaultValue = "7") int days) {
        return ApiResponse.ok(plannerAggregationService.upcoming(CurrentUser.id(), days));
    }
}
