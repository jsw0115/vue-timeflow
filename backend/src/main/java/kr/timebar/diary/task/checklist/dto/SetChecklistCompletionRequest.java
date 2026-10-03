package kr.timebar.diary.task.checklist.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SetChecklistCompletionRequest(
        @NotNull Boolean completed,
        @NotNull @Min(1) Long version
) {
}
