package kr.timebar.diary.task.checklist;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.task.TaskRepository;
import org.springframework.stereotype.Component;

@Component
public class TaskChecklistAccess {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskChecklistAccess(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public void requireOwned(String ownerId, String taskId) {
        taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, ownerId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        requireActiveOwner(ownerId);
    }

    public void lockOwned(String ownerId, String taskId) {
        // All child mutations use the same lock order: parent task, then checklist or assignees.
        taskRepository.findOwnedForUpdate(taskId, ownerId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        requireActiveOwner(ownerId);
    }

    public UserEntity requireActiveUser(String userId) {
        return userRepository.findById(userId).filter(TaskChecklistAccess::isActive)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_FAILED,
                        "지정할 수 없는 담당자입니다."));
    }

    public static boolean isActive(UserEntity user) {
        return user.isActive() && !Integer.valueOf(0).equals(user.getIsEnabled());
    }

    private void requireActiveOwner(String ownerId) {
        userRepository.findById(ownerId).filter(TaskChecklistAccess::isActive)
                .orElseThrow(() -> new ApiException(ErrorCode.ACCOUNT_DISABLED));
    }
}
