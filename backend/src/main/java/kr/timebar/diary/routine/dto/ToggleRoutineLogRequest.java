package kr.timebar.diary.routine.dto;

import kr.timebar.diary.routine.RoutineLogStatus;

/** status가 없으면 done→missed→skip 순으로 순환 토글하고, 지정하면 그 값으로 직접 지정한다. */
public record ToggleRoutineLogRequest(RoutineLogStatus status) {
}
