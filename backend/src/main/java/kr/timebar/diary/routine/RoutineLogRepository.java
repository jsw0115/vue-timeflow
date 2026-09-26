package kr.timebar.diary.routine;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RoutineLogRepository extends JpaRepository<RoutineLogEntity, String> {
    List<RoutineLogEntity> findByRoutineIdAndDateBetweenOrderByDateAsc(String routineId, LocalDate from, LocalDate to);

    Optional<RoutineLogEntity> findByRoutineIdAndDate(String routineId, LocalDate date);

    void deleteByRoutineIdAndDate(String routineId, LocalDate date);
}
