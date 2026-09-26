package kr.timebar.diary.planner;

import jakarta.validation.Valid;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/planner/items")
public class PlannerController {
    private final PlannerService service;
    public PlannerController(PlannerService service) { this.service = service; }
    @GetMapping public ApiResponse<List<PlannerItem>> list(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @RequestParam(required = false) PlannerItem.ItemType type, @RequestParam(required = false) String category, @RequestParam(required = false) PlannerItem.ItemStatus status) { return ApiResponse.ok(service.find(date, type, category, status)); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ApiResponse<PlannerItem> create(@Valid @RequestBody PlannerItem item) { return ApiResponse.ok(service.save(item)); }
    @PutMapping("/{id}") public ApiResponse<PlannerItem> update(@PathVariable long id, @Valid @RequestBody PlannerItem item) { return ApiResponse.ok(service.update(id, item)); }
    @PatchMapping("/{id}/status") public ApiResponse<PlannerItem> changeStatus(@PathVariable long id, @RequestParam PlannerItem.ItemStatus status) { PlannerItem old = service.find(null, null, null, null).stream().filter(i -> i.id() == id).findFirst().orElseThrow(); return ApiResponse.ok(service.update(id, new PlannerItem(id, old.type(), old.title(), old.category(), old.date(), old.startTime(), old.endTime(), status, old.dday(), old.note()))); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable long id) { service.delete(id); }
}

