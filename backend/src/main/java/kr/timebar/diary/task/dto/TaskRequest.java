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
        String categoryIcon,
        Long version,
        @com.fasterxml.jackson.annotation.JsonFormat(pattern = "HH:mm") java.time.LocalTime dueTime
) {
    /** 마감 시각(Q-31)을 넣기 전의 호출부(메모 → 할 일 변환 등)는 시각 없이 만든다. */
    public TaskRequest(String title, String note, TaskPriority priority, EnergyLevel energyLevel, Integer durationMin, LocalDate due,
            String categoryId, String categoryName, String categoryColor, String categoryIcon, Long version) {
        this(title, note, priority, energyLevel, durationMin, due, categoryId, categoryName, categoryColor, categoryIcon, version, null);
    }
}
