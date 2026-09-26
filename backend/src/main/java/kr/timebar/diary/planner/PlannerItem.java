package kr.timebar.diary.planner;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record PlannerItem(Long id, @NotNull ItemType type, @NotBlank String title, String category, LocalDate date, LocalTime startTime, LocalTime endTime, ItemStatus status, boolean dday, String note) {
    public enum ItemType { EVENT, TASK, ROUTINE, DIARY, MEMO, ACTUAL }
    public enum ItemStatus { TODO, IN_PROGRESS, DONE, CANCELLED, SCHEDULED }
}

