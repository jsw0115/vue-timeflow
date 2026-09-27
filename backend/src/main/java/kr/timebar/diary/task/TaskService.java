package kr.timebar.diary.task;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.task.dto.TaskRequest;
import kr.timebar.diary.task.dto.TaskResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService {
    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(String userId) {
        return taskRepository.findByUserIdAndDeletedAtIsNullOrderByDueAscCreatedAtAsc(userId).stream()
                .map(TaskResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse detail(String userId, String taskId) {
        return TaskResponse.from(findOwned(userId, taskId));
    }

    @Transactional
    public TaskResponse create(String userId, TaskRequest request) {
        TaskEntity entity = new TaskEntity(userId, request.title(), request.note(), request.priority(),
                request.energyLevel(), request.durationMin() == null ? 30 : request.durationMin(), request.due(),
                request.categoryId(), request.categoryName(), request.categoryColor(), request.categoryIcon());
        return TaskResponse.from(taskRepository.save(entity));
    }

    @Transactional
    public TaskResponse update(String userId, String taskId, TaskRequest request) {
        TaskEntity entity = findOwned(userId, taskId);
        entity.applyUpdate(request.title(), request.note(), request.priority(), request.energyLevel(),
                request.durationMin() == null ? entity.getDurationMin() : request.durationMin(), request.due(),
                request.categoryId(), request.categoryName(), request.categoryColor(), request.categoryIcon());
        return TaskResponse.from(entity);
    }

    @Transactional
    public void delete(String userId, String taskId) {
        findOwned(userId, taskId).softDelete();
    }

    @Transactional
    public TaskResponse toggleStatus(String userId, String taskId) {
        TaskEntity entity = findOwned(userId, taskId);
        entity.toggleStatus();
        return TaskResponse.from(entity);
    }

    @Transactional
    public TaskResponse duplicate(String userId, String taskId) {
        TaskEntity original = findOwned(userId, taskId);
        TaskEntity copy = new TaskEntity(userId, original.getTitle() + " (복제)", original.getNote(), original.getPriority(),
                original.getEnergyLevel(), original.getDurationMin(), original.getDue(),
                original.getCategoryId(), original.getCategoryName(), original.getCategoryColor(), original.getCategoryIcon());
        return TaskResponse.from(taskRepository.save(copy));
    }

    private TaskEntity findOwned(String userId, String taskId) {
        TaskEntity entity = taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "할 일을 찾을 수 없습니다."));
        if (!entity.isOwnedBy(userId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        return entity;
    }
}
