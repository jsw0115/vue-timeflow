package kr.timebar.diary.task.checklist;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskChecklistItemRepository extends JpaRepository<TaskChecklistItemEntity, String> {

    List<TaskChecklistItemEntity> findByTaskIdOrderByCreatedAtAscIdAsc(String taskId);

    Optional<TaskChecklistItemEntity> findByIdAndTaskId(String id, String taskId);

    long countByTaskId(String taskId);

    boolean existsByTaskIdAndAssigneeId(String taskId, String assigneeId);
}
