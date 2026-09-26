package kr.timebar.diary.event.dto;

import kr.timebar.diary.event.EventEntity;
import kr.timebar.diary.event.EventVisibility;

import java.time.LocalDate;
import java.time.LocalTime;

public record EventResponse(
        Long id,
        String title,
        String category,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        EventVisibility visibility,
        String note,
        Long seriesId,
        boolean recurring
) {
    public static EventResponse from(EventEntity entity) {
        return new EventResponse(entity.getId(), entity.getTitle(), entity.getCategory(), entity.getDate(),
                entity.getStartTime(), entity.getEndTime(), entity.getLocation(), entity.getVisibility(),
                entity.getNote(), entity.getSeriesId(), entity.getSeriesId() != null);
    }
}
