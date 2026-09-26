package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "Home, Statistics & Focus") @RestController @RequestMapping("/api")
public class InsightController {
    @GetMapping("/home/summary") public ApiResponse<?> home(@RequestParam(required=false) String date) { return ContractResponses.stub("GET /home/summary"); }
    @GetMapping("/stat/dashboard") public ApiResponse<?> dashboard(@RequestParam String range, @RequestParam(required=false) String date) { return ContractResponses.stub("GET /stat/dashboard"); }
    @GetMapping("/stat/category") public ApiResponse<?> category(@RequestParam String range, @RequestParam(required=false) String from, @RequestParam(required=false) String to) { return ContractResponses.stub("GET /stat/category"); }
    @GetMapping("/stat/plan-actual") public ApiResponse<?> planActual(@RequestParam String range, @RequestParam(required=false) String from, @RequestParam(required=false) String to) { return ContractResponses.stub("GET /stat/plan-actual"); }
    @GetMapping("/stat/focus") public ApiResponse<?> focusStats(@RequestParam(required=false) String from, @RequestParam(required=false) String to) { return ContractResponses.stub("GET /stat/focus"); }
    @GetMapping("/focus/sessions") public ApiResponse<?> sessions(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String categoryId) { return ContractResponses.stub("GET /focus/sessions"); }
    @PostMapping("/focus/sessions") public ApiResponse<?> createSession(@RequestBody Map<String, Object> body) { return ContractResponses.stub("POST /focus/sessions"); }
    @PutMapping("/focus/sessions/{id}") public ApiResponse<?> updateSession(@PathVariable String id, @RequestBody Map<String, Object> body) { return ContractResponses.stub("PUT /focus/sessions/{id}"); }
    @DeleteMapping("/focus/sessions/{id}") public ApiResponse<?> deleteSession(@PathVariable String id) { return ContractResponses.stub("DELETE /focus/sessions/{id}"); }
}
