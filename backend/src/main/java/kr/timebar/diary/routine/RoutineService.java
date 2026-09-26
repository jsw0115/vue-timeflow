package kr.timebar.diary.routine;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.routine.dto.RoutineHistoryGridResponse;
import kr.timebar.diary.routine.dto.RoutineLogEntryResponse;
import kr.timebar.diary.routine.dto.RoutineQuickCreateRequest;
import kr.timebar.diary.routine.dto.RoutineRequest;
import kr.timebar.diary.routine.dto.RoutineResponse;
import kr.timebar.diary.routine.dto.ToggleRoutineLogRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class RoutineService {
    private final RoutineRepository routineRepository;
    private final RoutineLogRepository routineLogRepository;

    public RoutineService(RoutineRepository routineRepository, RoutineLogRepository routineLogRepository) {
        this.routineRepository = routineRepository;
        this.routineLogRepository = routineLogRepository;
    }

    @Transactional(value = "routineTransactionManager", readOnly = true)
    public List<RoutineResponse> list(String userId) {
        return routineRepository.findByUserIdAndDeletedAtIsNullOrderByAtTimeAsc(userId).stream().map(RoutineResponse::from).toList();
    }

    @Transactional("routineTransactionManager")
    public RoutineResponse quickCreate(String userId, RoutineQuickCreateRequest request) {
        RoutineEntity entity = new RoutineEntity(userId, request.name(), request.atTime(), null, null, null, null, null, null, false, null);
        return RoutineResponse.from(routineRepository.save(entity));
    }

    @Transactional("routineTransactionManager")
    public RoutineResponse create(String userId, RoutineRequest request) {
        RoutineEntity entity = new RoutineEntity(userId, request.name(), request.atTime(), request.days(), request.icon(),
                request.categoryId(), request.categoryName(), request.categoryColor(), request.categoryIcon(),
                request.notifyEnabled(), request.notifyMinutesBefore());
        return RoutineResponse.from(routineRepository.save(entity));
    }

    @Transactional("routineTransactionManager")
    public RoutineResponse update(String userId, String routineId, RoutineRequest request) {
        RoutineEntity entity = findOwned(userId, routineId);
        entity.applyUpdate(request.name(), request.atTime(), request.days(), request.icon(), request.categoryId(),
                request.categoryName(), request.categoryColor(), request.categoryIcon(), request.onoff(), request.notifyEnabled(),
                request.notifyMinutesBefore());
        return RoutineResponse.from(entity);
    }

    @Transactional("routineTransactionManager")
    public void delete(String userId, String routineId) {
        findOwned(userId, routineId).softDelete();
    }

    @Transactional(value = "routineTransactionManager", readOnly = true)
    public RoutineHistoryGridResponse history(String userId, String routineId, int days) {
        findOwned(userId, routineId);
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days - 1L);
        List<RoutineLogEntryResponse> entries = routineLogRepository
                .findByRoutineIdAndDateBetweenOrderByDateAsc(routineId, from, to).stream()
                .map(RoutineLogEntryResponse::from)
                .toList();
        long doneCount = entries.stream().filter(e -> e.status() == RoutineLogStatus.done).count();
        double rate = entries.isEmpty() ? 0 : Math.round((doneCount * 1000.0) / days) / 10.0;
        return new RoutineHistoryGridResponse(routineId, entries, (int) doneCount, days, rate);
    }

    @Transactional("routineTransactionManager")
    public RoutineLogEntryResponse toggleHistory(String userId, String routineId, LocalDate date, ToggleRoutineLogRequest request) {
        findOwned(userId, routineId);
        RoutineLogEntity entity = routineLogRepository.findByRoutineIdAndDate(routineId, date)
                .orElseGet(() -> routineLogRepository.save(new RoutineLogEntity(routineId, date, RoutineLogStatus.missed)));
        if (request != null && request.status() != null) {
            entity.applyStatus(request.status());
        } else {
            entity.cycleStatus();
        }
        return RoutineLogEntryResponse.from(entity);
    }

    @Transactional("routineTransactionManager")
    public void deleteHistory(String userId, String routineId, LocalDate date) {
        findOwned(userId, routineId);
        routineLogRepository.deleteByRoutineIdAndDate(routineId, date);
    }

    private RoutineEntity findOwned(String userId, String routineId) {
        RoutineEntity entity = routineRepository.findByIdAndUserIdAndDeletedAtIsNull(routineId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "루틴을 찾을 수 없습니다."));
        if (!entity.isOwnedBy(userId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        return entity;
    }
}
