package kr.timebar.diary.routine.dto;

import kr.timebar.diary.routine.RoutineEntity;

public record RoutineResponse(
        String id,
        String name,
        String atTime,
        String days,
        String icon,
        String categoryId,
        String categoryName,
        String categoryColor,
        String categoryIcon,
        boolean onoff,
        boolean notifyEnabled,
        Integer notifyMinutesBefore
) {
    public static RoutineResponse from(RoutineEntity entity) {
        return new RoutineResponse(entity.getId(), entity.getName(), entity.getAtTime(), entity.getDays(), entity.getIcon(),
                entity.getCategoryId(), entity.getCategoryName(), entity.getCategoryColor(), entity.getCategoryIcon(),
                entity.isOnoff(), entity.isNotify(), entity.getNotifyMinutesBefore());
    }
}
