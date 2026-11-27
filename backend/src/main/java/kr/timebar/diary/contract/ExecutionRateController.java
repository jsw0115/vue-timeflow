// 계획 실행률 API(PR-19 UF-136, Q-40). 날짜별·기간 합계의 계획 분·실행 분(겹친 분)·실제 활동 총량과 실행률을 준다.
package kr.timebar.diary.contract;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.records.ExecutionRate;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stat")
public class ExecutionRateController {
    private final ExecutionRate rates;
    public ExecutionRateController(ExecutionRate rates) { this.rates = rates; }

    @GetMapping("/execution")
    public ApiResponse<?> execution(@RequestParam String from, @RequestParam String to) { return ApiResponse.ok(rates.range(CurrentUser.id(), from, to)); }
}
