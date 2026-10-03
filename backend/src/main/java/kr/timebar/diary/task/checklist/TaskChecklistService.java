package kr.timebar.diary.task.checklist;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.task.checklist.dto.ChecklistItemResponse;
import kr.timebar.diary.task.checklist.dto.CreateChecklistItemRequest;
import kr.timebar.diary.task.checklist.dto.SetChecklistCompletionRequest;
import kr.timebar.diary.task.checklist.dto.UpdateChecklistItemRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class TaskChecklistService {

    private static final int MAX_ITEMS = 100;

    private final TaskChecklistAccess access;
    private final TaskChecklistItemRepository itemRepository;
    private final TaskAssigneeRepository assigneeRepository;

    public TaskChecklistService(TaskChecklistAccess access, TaskChecklistItemRepository itemRepository,
            TaskAssigneeRepository assigneeRepository) {
        this.access = access;
        this.itemRepository = itemRepository;
        this.assigneeRepository = assigneeRepository;
    }

    public List<ChecklistItemResponse> list(String ownerId, String taskId) {
        access.requireOwned(ownerId, taskId);
        return itemRepository.findByTaskIdOrderByCreatedAtAscIdAsc(taskId).stream()
                .map(ChecklistItemResponse::from).toList();
    }

    @Transactional
    public ChecklistItemResponse create(String ownerId, String taskId, CreateChecklistItemRequest request) {
        access.lockOwned(ownerId, taskId);
        if (itemRepository.countByTaskId(taskId) >= MAX_ITEMS) {
            throw new ApiException(ErrorCode.CONFLICT, "체크리스트는 최대 100개까지 작성할 수 있습니다.");
        }
        String title = validateTitle(request.title());
        validateAssignee(ownerId, taskId, request.assigneeId());
        TaskChecklistItemEntity item = new TaskChecklistItemEntity(taskId, title, request.assigneeId());
        return ChecklistItemResponse.from(itemRepository.saveAndFlush(item));
    }

    @Transactional
    public ChecklistItemResponse update(String ownerId, String taskId, String itemId,
            UpdateChecklistItemRequest request) {
        access.lockOwned(ownerId, taskId);
        TaskChecklistItemEntity item = findCurrentItem(taskId, itemId, request.version());
        String title = validateTitle(request.title());
        validateAssignee(ownerId, taskId, request.assigneeId());
        item.updateDetails(title, request.assigneeId());
        itemRepository.flush();
        return ChecklistItemResponse.from(item);
    }

    @Transactional
    public ChecklistItemResponse setCompletion(String ownerId, String taskId, String itemId,
            SetChecklistCompletionRequest request) {
        access.lockOwned(ownerId, taskId);
        TaskChecklistItemEntity item = findCurrentItem(taskId, itemId, request.version());
        if (request.completed() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED);
        }
        item.setCompletion(request.completed());
        itemRepository.flush();
        return ChecklistItemResponse.from(item);
    }

    @Transactional
    public void delete(String ownerId, String taskId, String itemId, long version) {
        access.lockOwned(ownerId, taskId);
        itemRepository.delete(findCurrentItem(taskId, itemId, version));
        itemRepository.flush();
    }

    private TaskChecklistItemEntity findCurrentItem(String taskId, String itemId, Long version) {
        if (version == null || version < 1) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "항목 버전을 지정해주세요.");
        }
        TaskChecklistItemEntity item = itemRepository.findByIdAndTaskId(itemId, taskId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (item.getPublicVersion() != version) {
            throw new ApiException(ErrorCode.CONFLICT, "항목이 변경되었습니다. 다시 조회해주세요.");
        }
        return item;
    }

    private String validateTitle(String title) {
        if (title == null || title.isBlank() || title.length() > 200) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "항목 제목은 1~200자로 작성해주세요.");
        }
        return title.strip();
    }

    private void validateAssignee(String ownerId, String taskId, String assigneeId) {
        if (assigneeId == null) {
            return;
        }
        if (!ownerId.equals(assigneeId) && !assigneeRepository.existsByTaskIdAndUserId(taskId, assigneeId)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "먼저 담당자 후보를 등록해주세요.");
        }
        access.requireActiveUser(assigneeId);
    }
}
