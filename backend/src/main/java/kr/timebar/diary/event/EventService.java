package kr.timebar.diary.event;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.event.dto.EventRequest;
import kr.timebar.diary.event.dto.EventResponse;
import kr.timebar.diary.event.dto.RecurringEventRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class EventService {
    /** 반복 일정을 회차별 row로 만들 때 한 번에 만들 최대 개수(무한 반복 폭주 방지). */
    private static final int MAX_OCCURRENCES = 366;

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Transactional(value = "transactionManager", readOnly = true)
    public List<EventResponse> search(String userId, LocalDate from, LocalDate to, String keyword, String category) {
        LocalDate rangeFrom = from == null ? LocalDate.now().withDayOfMonth(1) : from;
        LocalDate rangeTo = to == null ? rangeFrom.plusMonths(1) : to;
        List<EventEntity> events = (keyword == null || keyword.isBlank())
                ? eventRepository.findByUserIdAndDateBetweenOrderByDateAscStartTimeAsc(userId, rangeFrom, rangeTo)
                : eventRepository.findByUserIdAndTitleContainingIgnoreCaseAndDateBetweenOrderByDateAscStartTimeAsc(userId, keyword, rangeFrom, rangeTo);
        return events.stream()
                .filter(e -> category == null || category.equals(e.getCategory()))
                .map(EventResponse::from)
                .toList();
    }

    @Transactional("transactionManager")
    public EventResponse create(String userId, EventRequest request) {
        EventEntity entity = new EventEntity(userId, request.title(), request.category(), request.date(),
                request.startTime(), request.endTime(), request.location(), request.visibility(), request.note(), null);
        return EventResponse.from(eventRepository.save(entity));
    }

    @Transactional("transactionManager")
    public EventResponse update(String userId, Long eventId, EventRequest request) {
        EventEntity entity = findOwned(userId, eventId);
        entity.applyUpdate(request.title(), request.category(), request.date(), request.startTime(), request.endTime(),
                request.location(), request.visibility(), request.note());
        return EventResponse.from(entity);
    }

    @Transactional("transactionManager")
    public void delete(String userId, Long eventId) {
        eventRepository.delete(findOwned(userId, eventId));
    }

    @Transactional("transactionManager")
    public List<EventResponse> createRecurring(String userId, RecurringEventRequest request) {
        List<LocalDate> occurrenceDates = materializeDates(request.startDate(), request.until(), request.freq());
        List<EventEntity> saved = new ArrayList<>();
        Long seriesId = null;
        for (LocalDate occurrenceDate : occurrenceDates) {
            EventEntity entity = new EventEntity(userId, request.title(), request.category(), occurrenceDate,
                    request.startTime(), request.endTime(), request.location(), request.visibility(), request.note(), seriesId);
            entity = eventRepository.save(entity);
            if (seriesId == null) {
                // 시리즈의 첫 회차 자신의 id를 seriesId로 삼아, 별도 시리즈 테이블 없이도 회차들을 묶는다
                seriesId = entity.getId();
                entity.bindToSeries(seriesId);
            }
            saved.add(entity);
        }
        return saved.stream().map(EventResponse::from).toList();
    }

    /** 이 회차를 포함해 이후(날짜 &gt;= 이 회차) 모든 회차에 동일한 내용을 일괄 적용한다. */
    @Transactional("transactionManager")
    public List<EventResponse> updateFollowing(String userId, Long eventId, EventRequest request) {
        EventEntity base = findOwned(userId, eventId);
        if (base.getSeriesId() == null) {
            base.applyUpdate(request.title(), request.category(), request.date(), request.startTime(), request.endTime(),
                    request.location(), request.visibility(), request.note());
            return List.of(EventResponse.from(base));
        }
        List<EventEntity> following = eventRepository.findBySeriesIdAndDateGreaterThanEqual(base.getSeriesId(), base.getDate());
        for (EventEntity occurrence : following) {
            occurrence.applyUpdate(request.title(), request.category(), occurrence.getDate(), request.startTime(),
                    request.endTime(), request.location(), request.visibility(), request.note());
        }
        return following.stream().map(EventResponse::from).toList();
    }

    /** 이 회차는 남기고, 이후(날짜 &gt; 이 회차) 회차들만 전부 삭제해 시리즈를 여기서 끝낸다. */
    @Transactional("transactionManager")
    public void endFollowing(String userId, Long eventId) {
        EventEntity base = findOwned(userId, eventId);
        if (base.getSeriesId() == null) {
            return;
        }
        eventRepository.deleteAll(eventRepository.findBySeriesIdAndDateGreaterThan(base.getSeriesId(), base.getDate()));
    }

    private List<LocalDate> materializeDates(LocalDate start, LocalDate until, RecurrenceFreq freq) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate cursor = start;
        while (!cursor.isAfter(until) && dates.size() < MAX_OCCURRENCES) {
            dates.add(cursor);
            cursor = switch (freq) {
                case DAILY -> cursor.plusDays(1);
                case WEEKLY -> cursor.plusWeeks(1);
                case MONTHLY -> cursor.plusMonths(1);
                case YEARLY -> cursor.plusYears(1);
            };
        }
        return dates;
    }

    private EventEntity findOwned(String userId, Long eventId) {
        EventEntity entity = eventRepository.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "일정을 찾을 수 없습니다."));
        if (!entity.isOwnedBy(userId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        return entity;
    }
}
