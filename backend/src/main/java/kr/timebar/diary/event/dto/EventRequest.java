package kr.timebar.diary.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.timebar.diary.event.EventVisibility;

import java.time.LocalDate;
import java.time.LocalTime;

public record EventRequest(
        @NotBlank(message = "제목을 입력해주세요.") String title,
        String category,
        @NotNull(message = "날짜를 입력해주세요.") LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        EventVisibility visibility,
        String note
) {
}
