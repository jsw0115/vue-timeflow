package kr.timebar.diary.task;

import kr.timebar.diary.task.dto.TaskRequest;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TaskMutationLockTest {

    @Test
    void updateStatusAndDeleteUseSameParentLockAsChecklistMutations() {
        TaskRepository repository = mock(TaskRepository.class);
        TaskEntity task = new TaskEntity("owner", "title", null, null, null, 30, null,
                null, null, null, null);
        when(repository.findOwnedForUpdate("task", "owner")).thenReturn(Optional.of(task));
        TaskService service = new TaskService(repository);
        service.update("owner", "task", new TaskRequest("edited", null, null, null, null, null,
                null, null, null, null));
        service.toggleStatus("owner", "task");
        service.delete("owner", "task");
        assertNotNull(task.getDeletedAt());
        verify(repository, org.mockito.Mockito.times(3)).findOwnedForUpdate("task", "owner");
        verify(repository, never()).findByIdAndUserIdAndDeletedAtIsNull(any(), any());
    }
}
