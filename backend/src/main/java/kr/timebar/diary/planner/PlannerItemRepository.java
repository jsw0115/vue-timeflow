package kr.timebar.diary.planner;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PlannerItemRepository extends JpaRepository<PlannerItemEntity, Long>, PlannerItemQueryRepository {
    java.util.List<PlannerItemEntity> findByUserIdOrderByStartTimeAsc(String userId);
    java.util.Optional<PlannerItemEntity> findByIdAndUserId(Long id, String userId);
}
