package kr.timebar.diary.task;

import jakarta.validation.Valid;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import kr.timebar.diary.task.dto.TaskRequest;
import kr.timebar.diary.task.dto.TaskResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ApiResponse<List<TaskResponse>> list() {
        return ApiResponse.ok(taskService.list(CurrentUser.id()));
    }

    @GetMapping("/{taskId}")
    public ApiResponse<TaskResponse> detail(@PathVariable String taskId) {
        return ApiResponse.ok(taskService.detail(CurrentUser.id(), taskId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TaskResponse> create(@Valid @RequestBody TaskRequest request) {
        return ApiResponse.ok(taskService.create(CurrentUser.id(), request), "할 일을 만들었어요.");
    }

    @PutMapping("/{taskId}")
    public ApiResponse<TaskResponse> update(@PathVariable String taskId, @Valid @RequestBody TaskRequest request) {
        return ApiResponse.ok(taskService.update(CurrentUser.id(), taskId, request), "수정했어요.");
    }

    @DeleteMapping("/{taskId}")
    public ApiResponse<Void> delete(@PathVariable String taskId) {
        taskService.delete(CurrentUser.id(), taskId);
        return ApiResponse.ok(null, "삭제했어요.");
    }

    @PatchMapping("/{taskId}/status")
    public ApiResponse<TaskResponse> toggleStatus(@PathVariable String taskId) {
        return ApiResponse.ok(taskService.toggleStatus(CurrentUser.id(), taskId));
    }

    @PostMapping("/{taskId}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TaskResponse> duplicate(@PathVariable String taskId) {
        return ApiResponse.ok(taskService.duplicate(CurrentUser.id(), taskId), "할 일을 복제했어요.");
    }
}
