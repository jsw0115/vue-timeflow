package kr.timebar.diary.task.dto;

import kr.timebar.diary.task.EnergyLevel;
import kr.timebar.diary.task.TaskEntity;
import kr.timebar.diary.task.TaskPriority;
import kr.timebar.diary.task.TaskStatus;

import java.time.LocalDate;

public record TaskResponse(
        String id,
        String title,
        String note,
        TaskStatus status,
        TaskPriority priority,
        EnergyLevel energyLevel,
        int durationMin,
        LocalDate due,
        String categoryId,
        String categoryName,
        String categoryColor,
        String categoryIcon
) {
    public static TaskResponse from(TaskEntity entity) {
        return new TaskResponse(entity.getId(), entity.getTitle(), entity.getNote(), entity.getStatus(),
                entity.getPriority(), entity.getEnergyLevel(), entity.getDurationMin(), entity.getDue(),
                entity.getCategoryId(), entity.getCategoryName(), entity.getCategoryColor(), entity.getCategoryIcon());
    }
}
