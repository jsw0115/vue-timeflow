package kr.timebar.diary.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kr.timebar.diary.event.EventVisibility;
import kr.timebar.diary.event.RecurrenceFreq;

import java.time.LocalDate;
import java.time.LocalTime;

public record RecurringEventRequest(
        @NotBlank(message = "제목을 입력해주세요.") String title,
        String category,
        @NotNull(message = "시작 날짜를 입력해주세요.") LocalDate startDate,
        @NotNull(message = "반복 종료일을 입력해주세요.") LocalDate until,
        @NotNull(message = "반복 주기를 선택해주세요.") RecurrenceFreq freq,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        EventVisibility visibility,
        String note
) {
}
