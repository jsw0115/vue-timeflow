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
        if (request.version() != null && request.version() != 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "새 할 일의 버전은 생략하거나 0이어야 합니다.");
        }
        TaskEntity entity = new TaskEntity(userId, request.title(), request.note(), request.priority(),
                request.energyLevel(), request.durationMin() == null ? 30 : request.durationMin(), request.due(),
                request.categoryId(), request.categoryName(), request.categoryColor(), request.categoryIcon());
        return TaskResponse.from(taskRepository.saveAndFlush(entity));
    }

    @Transactional
    public TaskResponse update(String userId, String taskId, TaskRequest request) {
        TaskEntity entity = lockOwned(userId, taskId);
        requireVersion(request.version(), entity);
        entity.applyUpdate(request.title(), request.note(), request.priority(), request.energyLevel(),
                request.durationMin() == null ? entity.getDurationMin() : request.durationMin(), request.due(),
                request.categoryId(), request.categoryName(), request.categoryColor(), request.categoryIcon());
        taskRepository.flush();
        return TaskResponse.from(entity);
    }

    @Transactional
    public void delete(String userId, String taskId, Long version) {
        // Checklist changes lock the same parent, so deletion cannot race an item insertion.
        TaskEntity entity = lockOwned(userId, taskId);
        requireVersion(version, entity);
        entity.softDelete();
        taskRepository.flush();
    }

    @Transactional
    public TaskResponse toggleStatus(String userId, String taskId, Long version) {
        TaskEntity entity = lockOwned(userId, taskId);
        requireVersion(version, entity);
        entity.toggleStatus();
        taskRepository.flush();
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

    /** 조회한 공개 버전이 없거나 1보다 작으면 400, 현재 버전과 다르면 409다. 다른 곳에서 바꾼 내용을 덮어쓰지 않는다. */
    private void requireVersion(Long version, TaskEntity entity) {
        if (version == null || version < 1) throw new ApiException(ErrorCode.VALIDATION_FAILED, "조회한 할 일의 버전이 필요합니다.");
        if (version != entity.getPublicVersion()) throw new ApiException(ErrorCode.CONFLICT, "할 일이 다른 곳에서 변경되었습니다. 다시 조회해주세요.");
    }

    private TaskEntity lockOwned(String userId, String taskId) {
        return taskRepository.findOwnedForUpdate(taskId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "할 일을 찾을 수 없습니다."));
    }
}
