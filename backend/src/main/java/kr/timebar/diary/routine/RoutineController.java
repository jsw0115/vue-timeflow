package kr.timebar.diary.routine;

import jakarta.validation.Valid;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.routine.dto.RoutineHistoryGridResponse;
import kr.timebar.diary.routine.dto.RoutineLogEntryResponse;
import kr.timebar.diary.routine.dto.RoutineQuickCreateRequest;
import kr.timebar.diary.routine.dto.RoutineRequest;
import kr.timebar.diary.routine.dto.RoutineResponse;
import kr.timebar.diary.routine.dto.ToggleRoutineLogRequest;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/routines")
public class RoutineController {
    private final RoutineService routineService;

    public RoutineController(RoutineService routineService) {
        this.routineService = routineService;
    }

    @GetMapping
    public ApiResponse<List<RoutineResponse>> list() {
        return ApiResponse.ok(routineService.list(CurrentUser.id()));
    }

    @PostMapping("/quick")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RoutineResponse> quickCreate(@Valid @RequestBody RoutineQuickCreateRequest request) {
        return ApiResponse.ok(routineService.quickCreate(CurrentUser.id(), request), "루틴을 만들었어요.");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RoutineResponse> create(@Valid @RequestBody RoutineRequest request) {
        return ApiResponse.ok(routineService.create(CurrentUser.id(), request), "루틴을 만들었어요.");
    }

    @PutMapping("/{routineId}")
    public ApiResponse<RoutineResponse> update(@PathVariable String routineId, @Valid @RequestBody RoutineRequest request) {
        return ApiResponse.ok(routineService.update(CurrentUser.id(), routineId, request), "수정했어요.");
    }

    @DeleteMapping("/{routineId}")
    public ApiResponse<Void> delete(@PathVariable String routineId) {
        routineService.delete(CurrentUser.id(), routineId);
        return ApiResponse.ok(null, "삭제했어요.");
    }

    @GetMapping("/{routineId}/history")
    public ApiResponse<RoutineHistoryGridResponse> history(@PathVariable String routineId, @RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(routineService.history(CurrentUser.id(), routineId, days));
    }

    @PatchMapping("/{routineId}/history/{date}/toggle")
    public ApiResponse<RoutineLogEntryResponse> toggleHistory(
            @PathVariable String routineId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody(required = false) ToggleRoutineLogRequest request) {
        return ApiResponse.ok(routineService.toggleHistory(CurrentUser.id(), routineId, date, request));
    }

    @DeleteMapping("/{routineId}/history/{date}")
    public ApiResponse<Void> deleteHistory(@PathVariable String routineId, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        routineService.deleteHistory(CurrentUser.id(), routineId, date);
        return ApiResponse.ok(null, "삭제했어요.");
    }
}
