package kr.timebar.diary.planner;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PlannerItemRepository extends JpaRepository<PlannerItemEntity, Long>, PlannerItemQueryRepository {
}
