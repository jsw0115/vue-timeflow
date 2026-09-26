package kr.timebar.diary.routine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RoutineRequest(
        @NotBlank(message = "루틴 이름을 입력해주세요.") String name,
        @NotBlank(message = "시간을 입력해주세요.") @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "시간은 HH:mm 형식이어야 합니다.") String atTime,
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
}
