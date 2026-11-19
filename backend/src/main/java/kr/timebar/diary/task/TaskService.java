package kr.timebar.diary.task;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.IdempotencyKeys;
import kr.timebar.diary.records.RecordLinks;
import kr.timebar.diary.task.dto.TaskRequest;
import kr.timebar.diary.task.dto.TaskResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final IdempotencyKeys idempotency;
    private final RecordLinks links;

    public TaskService(TaskRepository taskRepository, IdempotencyKeys idempotency, RecordLinks links) {
        this.taskRepository = taskRepository;
        this.idempotency = idempotency;
        this.links = links;
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

    /** 멱등 키가 있으면 같은 키로 다시 온 요청에 처음 만든 할 일을 돌려준다(로컬 자료 이전, Q-13). */
    @Transactional
    public TaskResponse create(String userId, TaskRequest request, String idempotencyKey) {
        return idempotency.create(userId, idempotencyKey, request, () -> create(userId, request), TaskResponse::id, id -> detail(userId, id));
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

    /** 멱등 키가 있으면 응답을 잃어 다시 보낸 같은 수정에 처음 결과의 할 일을 돌려준다(PR-12). 키는 할 일 ID와 함께 해시한다. */
    @Transactional
    public TaskResponse update(String userId, String taskId, TaskRequest request, String idempotencyKey) {
        var body = new java.util.LinkedHashMap<String, Object>(); body.put("id", taskId); body.put("request", request);
        return idempotency.apply(userId, idempotencyKey, body, 200, () -> update(userId, taskId, request), TaskResponse::id, id -> detail(userId, id));
    }

    @Transactional
    public void delete(String userId, String taskId, Long version) {
        // Checklist changes lock the same parent, so deletion cannot race an item insertion.
        TaskEntity entity = lockOwned(userId, taskId);
        requireVersion(version, entity);
        entity.softDelete();
        taskRepository.flush();
        // 할 일을 지우면 연결만 끊고, 할 일에서 만든 일정·실제 기록은 남긴다(UF-93)
        links.forget(userId, RecordLinks.TASK, taskId);
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
