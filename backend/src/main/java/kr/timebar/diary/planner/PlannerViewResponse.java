package kr.timebar.diary.planner;

import kr.timebar.diary.event.dto.EventResponse;
import kr.timebar.diary.routine.dto.RoutineResponse;
import kr.timebar.diary.task.dto.TaskResponse;

import java.util.List;

/** 일정(Event) + 할 일(Task) + 루틴(Routine)을 한 번에 묶어 돌려주는 플래너 뷰 응답. */
public record PlannerViewResponse(List<EventResponse> events, List<TaskResponse> tasks, List<RoutineResponse> routines) {
}
