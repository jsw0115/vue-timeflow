package kr.timebar.diary.routine.dto;

import java.util.List;

public record RoutineHistoryGridResponse(
        String routineId,
        List<RoutineLogEntryResponse> entries,
        int doneCount,
        int totalDays,
        double completionRate
) {
}
