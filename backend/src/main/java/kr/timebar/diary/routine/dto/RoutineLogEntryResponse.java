package kr.timebar.diary.routine.dto;

import kr.timebar.diary.routine.RoutineLogEntity;
import kr.timebar.diary.routine.RoutineLogStatus;

import java.time.LocalDate;

public record RoutineLogEntryResponse(LocalDate date, RoutineLogStatus status) {
    public static RoutineLogEntryResponse from(RoutineLogEntity entity) {
        return new RoutineLogEntryResponse(entity.getDate(), entity.getStatus());
    }
}
