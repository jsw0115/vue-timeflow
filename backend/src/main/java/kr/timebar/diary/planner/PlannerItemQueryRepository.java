package kr.timebar.diary.planner;

import java.time.LocalDate;
import java.util.List;

public interface PlannerItemQueryRepository {

    List<PlannerItemEntity> search(LocalDate date, PlannerItem.ItemType type, String category,
            PlannerItem.ItemStatus status);
}
