package kr.timebar.diary.planner;

import kr.timebar.diary.event.EventRepository;
import kr.timebar.diary.event.dto.EventResponse;
import kr.timebar.diary.routine.RoutineEntity;
import kr.timebar.diary.routine.RoutineRepository;
import kr.timebar.diary.routine.dto.RoutineResponse;
import kr.timebar.diary.task.TaskEntity;
import kr.timebar.diary.task.TaskRepository;
import kr.timebar.diary.task.dto.TaskResponse;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * 서로 다른 데이터소스(events=기본 스키마, task=task_db, routine=routine_db)에 흩어진
 * 도메인을 읽기 전용으로 모아 플래너 뷰(일/주/월/연/다가오는 일정)를 구성한다.
 * 각 리포지토리 호출은 Spring Data JPA가 자체 트랜잭션 경계를 관리하므로 여기서는
 * 별도 @Transactional 없이 순차 조회 후 메모리에서 합성한다.
 */
@Service
public class PlannerAggregationService {
    private static final String[] DAY_CODES = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"};

    private final EventRepository eventRepository;
    private final TaskRepository taskRepository;
    private final RoutineRepository routineRepository;

    public PlannerAggregationService(EventRepository eventRepository, TaskRepository taskRepository, RoutineRepository routineRepository) {
        this.eventRepository = eventRepository;
        this.taskRepository = taskRepository;
        this.routineRepository = routineRepository;
    }

    public PlannerViewResponse range(String userId, LocalDate from, LocalDate to) {
        List<EventResponse> events = eventRepository.findByUserIdAndDateBetweenOrderByDateAscStartTimeAsc(userId, from, to)
                .stream().map(EventResponse::from).toList();
        List<TaskResponse> tasks = taskRepository.findByUserIdAndDeletedAtIsNullOrderByDueAscCreatedAtAsc(userId).stream()
                .filter(t -> isDueWithin(t, from, to))
                .map(TaskResponse::from)
                .toList();
        List<RoutineResponse> routines = routineRepository.findByUserIdAndDeletedAtIsNullOrderByAtTimeAsc(userId).stream()
                .filter(RoutineEntity::isOnoff)
                .filter(r -> occursWithin(r, from, to))
                .map(RoutineResponse::from)
                .toList();
        return new PlannerViewResponse(events, tasks, routines);
    }

    public PlannerViewResponse daily(String userId, LocalDate date) {
        return range(userId, date, date);
    }

    public PlannerViewResponse weekly(String userId, LocalDate weekStart) {
        return range(userId, weekStart, weekStart.plusDays(6));
    }

    public PlannerViewResponse monthly(String userId, int year, int month) {
        LocalDate from = LocalDate.of(year, month, 1);
        return range(userId, from, from.plusMonths(1).minusDays(1));
    }

    public PlannerViewResponse yearly(String userId, int year) {
        return range(userId, LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31));
    }

    public List<EventResponse> upcoming(String userId, int days) {
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(Math.max(days, 1));
        return eventRepository.findByUserIdAndDateBetweenOrderByDateAscStartTimeAsc(userId, from, to)
                .stream().map(EventResponse::from).toList();
    }

    private boolean isDueWithin(TaskEntity task, LocalDate from, LocalDate to) {
        LocalDate due = task.getDue();
        return due != null && !due.isBefore(from) && !due.isAfter(to);
    }

    /** days가 비어 있으면 매일 반복하는 루틴으로 보고, 지정돼 있으면 범위 내에 해당 요일이 하루라도 있는지 본다. */
    private boolean occursWithin(RoutineEntity routine, LocalDate from, LocalDate to) {
        String days = routine.getDays();
        if (days == null || days.isBlank()) {
            return true;
        }
        List<String> codes = List.of(days.toLowerCase().split(","));
        for (LocalDate cursor = from; !cursor.isAfter(to); cursor = cursor.plusDays(1)) {
            if (codes.contains(dayCode(cursor.getDayOfWeek()))) {
                return true;
            }
        }
        return false;
    }

    private String dayCode(DayOfWeek dayOfWeek) {
        return DAY_CODES[dayOfWeek.getValue() - 1];
    }
}
