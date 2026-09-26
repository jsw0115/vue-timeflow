package kr.timebar.diary.task.dto;

import jakarta.validation.constraints.NotBlank;
import kr.timebar.diary.task.EnergyLevel;
import kr.timebar.diary.task.TaskPriority;

import java.time.LocalDate;

public record TaskRequest(
        @NotBlank(message = "제목을 입력해주세요.") String title,
        String note,
        TaskPriority priority,
        EnergyLevel energyLevel,
        Integer durationMin,
        LocalDate due,
        String categoryId,
        String categoryName,
        String categoryColor,
        String categoryIcon
) {
}
