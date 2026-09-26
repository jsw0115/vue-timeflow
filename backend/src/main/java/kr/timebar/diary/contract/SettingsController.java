package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "Settings") @RestController @RequestMapping("/api/settings")
public class SettingsController {
    @GetMapping public ApiResponse<?> get() { return ContractResponses.stub("GET /settings"); }
    @PostMapping public ApiResponse<?> save(@RequestBody Map<String, Object> body) { return ContractResponses.stub("POST /settings"); }
    @GetMapping("/categories") public ApiResponse<?> categories() { return ContractResponses.stub("GET /settings/categories"); }
    @PostMapping("/categories") public ApiResponse<?> saveCategories(@RequestBody Map<String, Object> body) { return ContractResponses.stub("POST /settings/categories"); }
    @GetMapping("/notifications") public ApiResponse<?> notifications() { return ContractResponses.stub("GET /settings/notifications"); }
    @PostMapping("/notifications") public ApiResponse<?> saveNotifications(@RequestBody Map<String, Object> body) { return ContractResponses.stub("POST /settings/notifications"); }
    @GetMapping("/share-visibility") public ApiResponse<?> visibility() { return ContractResponses.stub("GET /settings/share-visibility"); }
    @PostMapping("/share-visibility") public ApiResponse<?> saveVisibility(@RequestBody Map<String, Object> body) { return ContractResponses.stub("POST /settings/share-visibility"); }
    @GetMapping("/theme-sticker") public ApiResponse<?> theme() { return ContractResponses.stub("GET /settings/theme-sticker"); }
    @PostMapping("/theme-sticker") public ApiResponse<?> saveTheme(@RequestBody Map<String, Object> body) { return ContractResponses.stub("POST /settings/theme-sticker"); }
}
