package kr.timebar.diary.event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<EventEntity, Long> {
    Optional<EventEntity> findByIdAndUserId(Long id, String userId);

    List<EventEntity> findByUserIdAndDateBetweenOrderByDateAscStartTimeAsc(String userId, LocalDate from, LocalDate to);

    List<EventEntity> findByUserIdAndTitleContainingIgnoreCaseAndDateBetweenOrderByDateAscStartTimeAsc(
            String userId, String keyword, LocalDate from, LocalDate to);

    List<EventEntity> findBySeriesIdAndDateGreaterThanEqual(Long seriesId, LocalDate fromDate);

    List<EventEntity> findBySeriesIdAndDateGreaterThan(Long seriesId, LocalDate afterDate);
}
