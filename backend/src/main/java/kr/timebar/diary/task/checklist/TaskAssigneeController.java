package kr.timebar.diary.task.checklist;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import kr.timebar.diary.task.checklist.dto.TaskAssigneeResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Task assignees")
@RestController
@RequestMapping("/api/tasks/{taskId}/assignees")
public class TaskAssigneeController {

    private final TaskAssigneeService assigneeService;

    public TaskAssigneeController(TaskAssigneeService assigneeService) {
        this.assigneeService = assigneeService;
    }

    @GetMapping
    public ApiResponse<List<TaskAssigneeResponse>> list(@PathVariable String taskId) {
        return ApiResponse.ok(assigneeService.list(CurrentUser.id(), taskId));
    }

    @PutMapping("/{userId}")
    public ApiResponse<TaskAssigneeResponse> add(@PathVariable String taskId, @PathVariable String userId) {
        return ApiResponse.ok(assigneeService.add(CurrentUser.id(), taskId, userId));
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable String taskId, @PathVariable String userId) {
        assigneeService.remove(CurrentUser.id(), taskId, userId);
    }
}
