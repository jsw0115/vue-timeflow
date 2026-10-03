package kr.timebar.diary.planner.preferences;

import jakarta.validation.Valid;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/planner/preferences")
public class PlannerPreferenceController {
    private final PlannerPreferenceService preferenceService;

    public PlannerPreferenceController(PlannerPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    public ApiResponse<PlannerPreferenceResponse> get() {
        return ApiResponse.ok(preferenceService.get(CurrentUser.id()));
    }

    @PutMapping
    public ApiResponse<PlannerPreferenceResponse> update(@Valid @RequestBody PlannerPreferenceRequest request) {
        return ApiResponse.ok(preferenceService.update(CurrentUser.id(), request));
    }
}
