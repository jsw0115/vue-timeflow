package kr.timebar.diary.task.checklist;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import kr.timebar.diary.task.checklist.dto.ChecklistItemResponse;
import kr.timebar.diary.task.checklist.dto.CreateChecklistItemRequest;
import kr.timebar.diary.task.checklist.dto.SetChecklistCompletionRequest;
import kr.timebar.diary.task.checklist.dto.UpdateChecklistItemRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Task checklist")
@RestController
@RequestMapping("/api/tasks/{taskId}/checklist-items")
public class TaskChecklistController {

    private final TaskChecklistService checklistService;

    public TaskChecklistController(TaskChecklistService checklistService) {
        this.checklistService = checklistService;
    }

    @GetMapping
    public ApiResponse<List<ChecklistItemResponse>> list(@PathVariable String taskId) {
        return ApiResponse.ok(checklistService.list(CurrentUser.id(), taskId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ChecklistItemResponse> create(@PathVariable String taskId,
            @Valid @RequestBody CreateChecklistItemRequest request) {
        return ApiResponse.ok(checklistService.create(CurrentUser.id(), taskId, request));
    }

    @PutMapping("/{itemId}")
    public ApiResponse<ChecklistItemResponse> update(@PathVariable String taskId, @PathVariable String itemId,
            @Valid @RequestBody UpdateChecklistItemRequest request) {
        return ApiResponse.ok(checklistService.update(CurrentUser.id(), taskId, itemId, request));
    }

    @PutMapping("/{itemId}/completion")
    public ApiResponse<ChecklistItemResponse> setCompletion(@PathVariable String taskId,
            @PathVariable String itemId, @Valid @RequestBody SetChecklistCompletionRequest request) {
        return ApiResponse.ok(checklistService.setCompletion(CurrentUser.id(), taskId, itemId, request));
    }

    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String taskId, @PathVariable String itemId, @RequestParam long version) {
        checklistService.delete(CurrentUser.id(), taskId, itemId, version);
    }
}
