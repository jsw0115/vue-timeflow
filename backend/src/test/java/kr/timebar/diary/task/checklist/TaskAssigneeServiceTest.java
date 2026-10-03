package kr.timebar.diary.task.checklist;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.auth.UserRole;
import kr.timebar.diary.auth.UserStatus;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class TaskAssigneeServiceTest {

    private TaskChecklistAccess access;
    private TaskAssigneeRepository assignees;
    private TaskChecklistItemRepository items;
    private UserRepository users;
    private TaskAssigneeService service;
    private UserEntity owner;
    private UserEntity candidate;

    @BeforeEach
    void setUp() {
        access = mock(TaskChecklistAccess.class);
        assignees = mock(TaskAssigneeRepository.class);
        items = mock(TaskChecklistItemRepository.class);
        users = mock(UserRepository.class);
        owner = user("owner");
        candidate = user("candidate");
        service = new TaskAssigneeService(access, assignees, items, users);
    }

    @Test
    void ownershipFailurePreventsListingOrAddingCandidates() {
        doThrow(new ApiException(ErrorCode.NOT_FOUND)).when(access).requireOwned(owner.getId(), "task");
        doThrow(new ApiException(ErrorCode.NOT_FOUND)).when(access).lockOwned(owner.getId(), "task");
        assertThrows(ApiException.class, () -> service.list(owner.getId(), "task"));
        assertThrows(ApiException.class, () -> service.add(owner.getId(), "task", candidate.getId()));
        verifyNoInteractions(assignees, items, users);
    }

    @Test
    void listIncludesOwnerAndExcludesDisabledAccountsWithOneBulkLookup() {
        UserEntity disabled = user("disabled");
        org.springframework.test.util.ReflectionTestUtils.setField(disabled, "isEnabled", 0);
        when(assignees.findByTaskIdOrderByUserIdAsc("task"))
                .thenReturn(List.of(new TaskAssigneeEntity("task", candidate.getId()),
                        new TaskAssigneeEntity("task", disabled.getId())));
        when(users.findAllById(anyList())).thenReturn(List.of(owner, candidate, disabled));
        var result = service.list(owner.getId(), "task");
        assertEquals(2, result.size());
        verify(users).findAllById(List.of(owner.getId(), candidate.getId(), disabled.getId()));
        verify(users, never()).findById(any());
    }

    @Test
    void addValidatesCandidateAfterParentLockAndInsertsOnce() {
        when(access.requireActiveUser(candidate.getId())).thenReturn(candidate);
        var result = service.add(owner.getId(), "task", candidate.getId());
        assertEquals(candidate.getId(), result.userId());
        var order = inOrder(access, assignees);
        order.verify(access).lockOwned(owner.getId(), "task");
        order.verify(access).requireActiveUser(candidate.getId());
        order.verify(assignees).existsByTaskIdAndUserId("task", candidate.getId());
        order.verify(assignees).countByTaskId("task");
        order.verify(assignees).saveAndFlush(any());
    }

    @Test
    void addingOwnerOrExistingCandidateIsIdempotent() {
        when(access.requireActiveUser(owner.getId())).thenReturn(owner);
        when(access.requireActiveUser(candidate.getId())).thenReturn(candidate);
        when(assignees.existsByTaskIdAndUserId("task", candidate.getId())).thenReturn(true);
        service.add(owner.getId(), "task", owner.getId());
        service.add(owner.getId(), "task", candidate.getId());
        verify(assignees, never()).countByTaskId(any());
        verify(assignees, never()).saveAndFlush(any());
    }

    @Test
    void candidateLimitAndInactiveCandidatePreventInsert() {
        when(access.requireActiveUser(candidate.getId())).thenReturn(candidate);
        when(assignees.countByTaskId("task")).thenReturn(50L);
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class,
                () -> service.add(owner.getId(), "task", candidate.getId())).errorCode());
        doThrow(new ApiException(ErrorCode.VALIDATION_FAILED)).when(access).requireActiveUser("inactive");
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class,
                () -> service.add(owner.getId(), "task", "inactive")).errorCode());
        verify(assignees, never()).saveAndFlush(any());
    }

    @Test
    void cannotRemoveOwnerOrCurrentlyAssignedCandidate() {
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class,
                () -> service.remove(owner.getId(), "task", owner.getId())).errorCode());
        when(items.existsByTaskIdAndAssigneeId("task", candidate.getId())).thenReturn(true);
        assertEquals(ErrorCode.CONFLICT, assertThrows(ApiException.class,
                () -> service.remove(owner.getId(), "task", candidate.getId())).errorCode());
        verify(assignees, never()).delete(any());
    }

    @Test
    void removingAnAbsentCandidateSucceedsWithNoDelete() {
        service.remove(owner.getId(), "task", candidate.getId());
        verify(assignees, never()).delete(any());
        verify(assignees).flush();
    }

    private UserEntity user(String nickname) {
        return new UserEntity(nickname + "@example.test", nickname, "not-a-real-password-hash",
                UserRole.USER, UserStatus.ACTIVE);
    }
}
