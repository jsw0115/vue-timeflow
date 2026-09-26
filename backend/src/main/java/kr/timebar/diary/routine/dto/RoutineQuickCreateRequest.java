package kr.timebar.diary.routine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** 이름과 시간만으로 빠르게 만드는 루틴 — 요일은 평일(mon~fri) 기본값을 그대로 쓴다. */
public record RoutineQuickCreateRequest(
        @NotBlank(message = "루틴 이름을 입력해주세요.") String name,
        @NotBlank(message = "시간을 입력해주세요.") @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "시간은 HH:mm 형식이어야 합니다.") String atTime
) {
}
