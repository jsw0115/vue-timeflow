package kr.timebar.diary.event;

import jakarta.validation.Valid;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.event.dto.EventRequest;
import kr.timebar.diary.event.dto.EventResponse;
import kr.timebar.diary.event.dto.RecurringEventRequest;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ApiResponse<List<EventResponse>> search(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category) {
        return ApiResponse.ok(eventService.search(CurrentUser.id(), from, to, keyword, category));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EventResponse> create(@Valid @RequestBody EventRequest request) {
        return ApiResponse.ok(eventService.create(CurrentUser.id(), request), "일정을 만들었어요.");
    }

    @PutMapping("/{eventId}")
    public ApiResponse<EventResponse> update(@PathVariable Long eventId, @Valid @RequestBody EventRequest request) {
        return ApiResponse.ok(eventService.update(CurrentUser.id(), eventId, request), "수정했어요.");
    }

    @DeleteMapping("/{eventId}")
    public ApiResponse<Void> delete(@PathVariable Long eventId) {
        eventService.delete(CurrentUser.id(), eventId);
        return ApiResponse.ok(null, "삭제했어요.");
    }

    @PostMapping("/recurring")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<List<EventResponse>> createRecurring(@Valid @RequestBody RecurringEventRequest request) {
        return ApiResponse.ok(eventService.createRecurring(CurrentUser.id(), request), "반복 일정을 만들었어요.");
    }

    @PutMapping("/{eventId}/following")
    public ApiResponse<List<EventResponse>> updateFollowing(@PathVariable Long eventId, @Valid @RequestBody EventRequest request) {
        return ApiResponse.ok(eventService.updateFollowing(CurrentUser.id(), eventId, request), "이후 일정을 모두 수정했어요.");
    }

    @DeleteMapping("/{eventId}/following")
    public ApiResponse<Void> endFollowing(@PathVariable Long eventId) {
        eventService.endFollowing(CurrentUser.id(), eventId);
        return ApiResponse.ok(null, "이후 반복을 종료했어요.");
    }
}
