package kr.timebar.diary.task.checklist;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.task.checklist.dto.TaskAssigneeResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TaskAssigneeService {

    private static final int MAX_ASSIGNEES = 50;

    private final TaskChecklistAccess access;
    private final TaskAssigneeRepository assigneeRepository;
    private final TaskChecklistItemRepository itemRepository;
    private final UserRepository userRepository;

    public TaskAssigneeService(TaskChecklistAccess access, TaskAssigneeRepository assigneeRepository,
            TaskChecklistItemRepository itemRepository, UserRepository userRepository) {
        this.access = access;
        this.assigneeRepository = assigneeRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
    }

    public List<TaskAssigneeResponse> list(String ownerId, String taskId) {
        access.requireOwned(ownerId, taskId);
        List<String> userIds = new ArrayList<>();
        userIds.add(ownerId);
        assigneeRepository.findByTaskIdOrderByUserIdAsc(taskId)
                .forEach(assignee -> userIds.add(assignee.getUserId()));
        // A single bulk lookup avoids one user query for every checklist candidate.
        return userRepository.findAllById(userIds).stream().filter(TaskChecklistAccess::isActive)
                .sorted(Comparator.comparing(UserEntity::getId))
                .map(TaskAssigneeResponse::from).toList();
    }

    @Transactional
    public TaskAssigneeResponse add(String ownerId, String taskId, String userId) {
        access.lockOwned(ownerId, taskId);
        UserEntity user = access.requireActiveUser(userId);
        if (ownerId.equals(userId) || assigneeRepository.existsByTaskIdAndUserId(taskId, userId)) {
            return TaskAssigneeResponse.from(user);
        }
        if (assigneeRepository.countByTaskId(taskId) >= MAX_ASSIGNEES) {
            throw new ApiException(ErrorCode.CONFLICT, "담당자 후보는 최대 50명까지 등록할 수 있습니다.");
        }
        assigneeRepository.saveAndFlush(new TaskAssigneeEntity(taskId, userId));
        return TaskAssigneeResponse.from(user);
    }

    @Transactional
    public void remove(String ownerId, String taskId, String userId) {
        access.lockOwned(ownerId, taskId);
        if (ownerId.equals(userId)) {
            throw new ApiException(ErrorCode.CONFLICT, "할 일 소유자는 담당자 후보에서 해제할 수 없습니다.");
        }
        if (itemRepository.existsByTaskIdAndAssigneeId(taskId, userId)) {
            throw new ApiException(ErrorCode.CONFLICT, "배정된 항목의 담당자를 먼저 변경해주세요.");
        }
        assigneeRepository.findByTaskIdAndUserId(taskId, userId).ifPresent(assigneeRepository::delete);
        assigneeRepository.flush();
    }
}
