package kr.timebar.diary.task.checklist;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.auth.UserRole;
import kr.timebar.diary.auth.UserStatus;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.task.TaskEntity;
import kr.timebar.diary.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class TaskChecklistAccessTest {

    private TaskRepository tasks;
    private UserRepository users;
    private TaskChecklistAccess access;

    @BeforeEach
    void setUp() {
        tasks = mock(TaskRepository.class);
        users = mock(UserRepository.class);
        access = new TaskChecklistAccess(tasks, users);
    }

    @Test
    void inaccessibleAndDeletedTasksHaveSameNotFoundResult() {
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class,
                () -> access.requireOwned("other", "private")).errorCode());
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class,
                () -> access.lockOwned("owner", "deleted")).errorCode());
        verify(tasks).findByIdAndUserIdAndDeletedAtIsNull("private", "other");
        verify(tasks).findOwnedForUpdate("deleted", "owner");
        verifyNoInteractions(users);
    }

    @Test
    void disabledOwnerIsRejectedEvenWhenJwtStillExists() {
        UserEntity user = new UserEntity("owner@example.test", "owner", "hash", UserRole.USER, UserStatus.ACTIVE);
        ReflectionTestUtils.setField(user, "isEnabled", 0);
        when(tasks.findOwnedForUpdate("task", user.getId())).thenReturn(Optional.of(mock(TaskEntity.class)));
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        assertEquals(ErrorCode.ACCOUNT_DISABLED, assertThrows(ApiException.class,
                () -> access.lockOwned(user.getId(), "task")).errorCode());
    }

    @Test
    void missingAndDisabledCandidateHaveSameValidationFailure() {
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class,
                () -> access.requireActiveUser("unknown")).errorCode());
        UserEntity user = new UserEntity("user@example.test", "user", "hash", UserRole.USER, UserStatus.ACTIVE);
        ReflectionTestUtils.setField(user, "deletedAt", java.time.LocalDateTime.now());
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class,
                () -> access.requireActiveUser(user.getId())).errorCode());
    }
}
