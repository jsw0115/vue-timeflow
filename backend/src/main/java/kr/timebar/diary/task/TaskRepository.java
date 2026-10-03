package kr.timebar.diary.task;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<TaskEntity, String> {
    List<TaskEntity> findByUserIdAndDeletedAtIsNullOrderByDueAscCreatedAtAsc(String userId);

    Optional<TaskEntity> findByIdAndUserIdAndDeletedAtIsNull(String id, String userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select task from TaskEntity task where task.id = :taskId "
            + "and task.userId = :userId and task.deletedAt is null")
    Optional<TaskEntity> findOwnedForUpdate(@Param("taskId") String taskId, @Param("userId") String userId);
}
