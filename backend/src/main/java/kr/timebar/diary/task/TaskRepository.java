package kr.timebar.diary.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<TaskEntity, String> {
    List<TaskEntity> findByUserIdAndDeletedAtIsNullOrderByDueAscCreatedAtAsc(String userId);

    Optional<TaskEntity> findByIdAndUserIdAndDeletedAtIsNull(String id, String userId);
}
