package kr.timebar.diary.task.checklist;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskAssigneeRepository extends JpaRepository<TaskAssigneeEntity, String> {

    List<TaskAssigneeEntity> findByTaskIdOrderByUserIdAsc(String taskId);

    Optional<TaskAssigneeEntity> findByTaskIdAndUserId(String taskId, String userId);

    boolean existsByTaskIdAndUserId(String taskId, String userId);

    long countByTaskId(String taskId);
}
