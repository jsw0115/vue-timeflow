package kr.timebar.diary.task.checklist;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.task.checklist.dto.CreateChecklistItemRequest;
import kr.timebar.diary.task.checklist.dto.SetChecklistCompletionRequest;
import kr.timebar.diary.task.checklist.dto.UpdateChecklistItemRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class TaskChecklistServiceTest {

    private static final String OWNER = "owner";
    private static final String TASK = "task";

    private TaskChecklistAccess access;
    private TaskChecklistItemRepository items;
    private TaskAssigneeRepository assignees;
    private TaskChecklistService service;

    @BeforeEach
    void setUp() {
        access = mock(TaskChecklistAccess.class);
        items = mock(TaskChecklistItemRepository.class);
        assignees = mock(TaskAssigneeRepository.class);
        service = new TaskChecklistService(access, items, assignees);
    }

    @Test
    void ownershipFailurePreventsReadingOrWritingChildren() {
        doThrow(new ApiException(ErrorCode.NOT_FOUND)).when(access).requireOwned(OWNER, TASK);
        doThrow(new ApiException(ErrorCode.NOT_FOUND)).when(access).lockOwned(OWNER, TASK);
        assertThrows(ApiException.class, () -> service.list(OWNER, TASK));
        assertThrows(ApiException.class,
                () -> service.create(OWNER, TASK, new CreateChecklistItemRequest("title", null)));
        verifyNoInteractions(items, assignees);
    }

    @Test
    void listReturnsCompletionAndAssigneeWithoutLoadingOtherTasks() {
        TaskChecklistItemEntity item = persistedItem("title", OWNER);
        item.setCompletion(true);
        when(items.findByTaskIdOrderByCreatedAtAscIdAsc(TASK)).thenReturn(List.of(item));
        var result = service.list(OWNER, TASK);
        assertEquals(1, result.size());
        assertTrue(result.get(0).completed());
        assertEquals(OWNER, result.get(0).assigneeId());
        assertEquals(1, result.get(0).version());
        verify(access).requireOwned(OWNER, TASK);
    }

    @Test
    void createsTrimmedUnassignedItemAndAcquiresParentLockBeforeCount() {
        when(items.saveAndFlush(any())).thenAnswer(invocation -> {
            TaskChecklistItemEntity item = invocation.getArgument(0);
            ReflectionTestUtils.setField(item, "version", 0L);
            return item;
        });
        var result = service.create(OWNER, TASK, new CreateChecklistItemRequest("  문서 검토  ", null));
        assertEquals("문서 검토", result.title());
        assertFalse(result.completed());
        assertEquals(1, result.version());
        var order = inOrder(access, items);
        order.verify(access).lockOwned(OWNER, TASK);
        order.verify(items).countByTaskId(TASK);
        verifyNoInteractions(assignees);
    }

    @Test
    void itemLimitPreventsInsert() {
        when(items.countByTaskId(TASK)).thenReturn(100L);
        assertError(ErrorCode.CONFLICT,
                () -> service.create(OWNER, TASK, new CreateChecklistItemRequest("title", null)));
        verify(items, never()).saveAndFlush(any());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\t\n"})
    void blankTitleIsRejectedEvenForNonHttpCallers(String title) {
        assertError(ErrorCode.VALIDATION_FAILED,
                () -> service.create(OWNER, TASK, new CreateChecklistItemRequest(title, null)));
        verify(items, never()).saveAndFlush(any());
    }

    @Test
    void oversizedTitleIsRejected() {
        assertError(ErrorCode.VALIDATION_FAILED,
                () -> service.create(OWNER, TASK, new CreateChecklistItemRequest("x".repeat(201), null)));
    }

    @Test
    void rejectsUnregisteredOrDisabledAssigneeBeforeWriting() {
        assertError(ErrorCode.VALIDATION_FAILED,
                () -> service.create(OWNER, TASK, new CreateChecklistItemRequest("title", "other")));
        when(assignees.existsByTaskIdAndUserId(TASK, "other")).thenReturn(true);
        doThrow(new ApiException(ErrorCode.VALIDATION_FAILED)).when(access).requireActiveUser("other");
        assertError(ErrorCode.VALIDATION_FAILED,
                () -> service.create(OWNER, TASK, new CreateChecklistItemRequest("title", "other")));
        verify(items, never()).saveAndFlush(any());
    }

    @Test
    void registeredAssigneeAndOwnerAreValidatedAsActive() {
        when(assignees.existsByTaskIdAndUserId(TASK, "other")).thenReturn(true);
        when(items.saveAndFlush(any())).thenAnswer(invocation -> {
            TaskChecklistItemEntity item = invocation.getArgument(0);
            ReflectionTestUtils.setField(item, "version", 0L);
            return item;
        });
        assertEquals("other",
                service.create(OWNER, TASK, new CreateChecklistItemRequest("title", "other")).assigneeId());
        assertEquals(OWNER,
                service.create(OWNER, TASK, new CreateChecklistItemRequest("title", OWNER)).assigneeId());
        verify(access).requireActiveUser("other");
        verify(access).requireActiveUser(OWNER);
    }

    @Test
    void detailUpdateCanUnassignAndReturnsVersionAfterFlush() {
        TaskChecklistItemEntity item = persistedItem("old", "other");
        when(items.findByIdAndTaskId(item.getId(), TASK)).thenReturn(Optional.of(item));
        org.mockito.Mockito.doAnswer(invocation -> {
            ReflectionTestUtils.setField(item, "version", 1L);
            return null;
        }).when(items).flush();
        var result = service.update(OWNER, TASK, item.getId(), new UpdateChecklistItemRequest("new", null, 1L));
        assertEquals("new", result.title());
        assertEquals(null, result.assigneeId());
        assertEquals(2, result.version());
    }

    @Test
    void completionSetsStateAndRepeatedTrueDoesNotToggle() {
        TaskChecklistItemEntity item = persistedItem("title", null);
        when(items.findByIdAndTaskId(item.getId(), TASK)).thenReturn(Optional.of(item));
        assertTrue(service.setCompletion(OWNER, TASK, item.getId(),
                new SetChecklistCompletionRequest(true, 1L)).completed());
        assertTrue(service.setCompletion(OWNER, TASK, item.getId(),
                new SetChecklistCompletionRequest(true, 1L)).completed());
        assertFalse(service.setCompletion(OWNER, TASK, item.getId(),
                new SetChecklistCompletionRequest(false, 1L)).completed());
    }

    @Test
    void missingCompletionAndStaleVersionAreRejected() {
        TaskChecklistItemEntity item = persistedItem("title", null);
        when(items.findByIdAndTaskId(item.getId(), TASK)).thenReturn(Optional.of(item));
        assertError(ErrorCode.VALIDATION_FAILED, () -> service.setCompletion(OWNER, TASK, item.getId(),
                new SetChecklistCompletionRequest(null, 1L)));
        assertError(ErrorCode.CONFLICT, () -> service.setCompletion(OWNER, TASK, item.getId(),
                new SetChecklistCompletionRequest(true, 2L)));
        assertFalse(item.isCompleted());
        verify(items, never()).flush();
    }

    @Test
    void itemFromAnotherTaskAndInvalidDeleteVersionAreRejected() {
        assertError(ErrorCode.NOT_FOUND, () -> service.delete(OWNER, TASK, "foreign-item", 1));
        assertError(ErrorCode.VALIDATION_FAILED, () -> service.delete(OWNER, TASK, "item", 0));
        verify(items, never()).delete(any());
    }

    @Test
    void deleteRequiresCurrentVersion() {
        TaskChecklistItemEntity item = persistedItem("title", null);
        when(items.findByIdAndTaskId(item.getId(), TASK)).thenReturn(Optional.of(item));
        service.delete(OWNER, TASK, item.getId(), 1);
        verify(items).delete(item);
        verify(items).flush();
    }

    private TaskChecklistItemEntity persistedItem(String title, String assigneeId) {
        TaskChecklistItemEntity item = new TaskChecklistItemEntity(TASK, title, assigneeId);
        ReflectionTestUtils.setField(item, "version", 0L);
        return item;
    }

    private void assertError(ErrorCode expected, Runnable action) {
        assertEquals(expected, assertThrows(ApiException.class, action::run).errorCode());
    }
}
