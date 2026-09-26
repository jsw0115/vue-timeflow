package kr.timebar.diary.planner;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import static kr.timebar.diary.planner.QPlannerItemEntity.plannerItemEntity;

@Repository
@RequiredArgsConstructor
public class PlannerItemQueryRepositoryImpl implements PlannerItemQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<PlannerItemEntity> search(LocalDate date, PlannerItem.ItemType type, String category,
            PlannerItem.ItemStatus status) {
        return queryFactory
                .selectFrom(plannerItemEntity)
                .where(
                        dateEq(date),
                        typeEq(type),
                        categoryEq(category),
                        statusEq(status))
                .orderBy(plannerItemEntity.startTime.asc().nullsLast())
                .fetch();
    }

    private BooleanExpression dateEq(LocalDate date) {
        return date == null ? null : plannerItemEntity.date.eq(date);
    }

    private BooleanExpression typeEq(PlannerItem.ItemType type) {
        return type == null ? null : plannerItemEntity.type.eq(type);
    }

    private BooleanExpression categoryEq(String category) {
        return category == null ? null : plannerItemEntity.category.eq(category);
    }

    private BooleanExpression statusEq(PlannerItem.ItemStatus status) {
        return status == null ? null : plannerItemEntity.status.eq(status);
    }
}
