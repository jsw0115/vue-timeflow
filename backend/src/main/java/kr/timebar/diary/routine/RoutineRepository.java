package kr.timebar.diary.routine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoutineRepository extends JpaRepository<RoutineEntity, String> {
    List<RoutineEntity> findByUserIdAndDeletedAtIsNullOrderByAtTimeAsc(String userId);

    Optional<RoutineEntity> findByIdAndUserIdAndDeletedAtIsNull(String id, String userId);
}
