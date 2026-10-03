package kr.timebar.diary.task.checklist.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import kr.timebar.diary.common.UserIdentifier;

public record UpdateChecklistItemRequest(
        @NotBlank @Size(max = 200) String title,
        @Pattern(regexp = UserIdentifier.PATTERN) String assigneeId,
        @NotNull @Min(1) Long version
) {
}
