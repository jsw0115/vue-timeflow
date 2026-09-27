package kr.timebar.diary.planner;

import jakarta.validation.Valid;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Planner")
@RestController
@RequestMapping("/api/planner/items")
public class PlannerController {
    
    private final PlannerService service;
    public PlannerController(PlannerService service) { this.service = service; }
    
    /**
     * 
     * @param date
     * @param type
     * @param category
     * @param status
     * @return
      */
    @GetMapping 
    public ApiResponse<List<PlannerItem>> list(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @RequestParam(required = false) PlannerItem.ItemType type, @RequestParam(required = false) String category, @RequestParam(required = false) PlannerItem.ItemStatus status) { 
        List<PlannerItem> result = service.find(date, type, category, status);
        return ApiResponse.ok(result); 
    }

    /**
     * 
     * @param item
     * @return
      */
    @PostMapping 
    @ResponseStatus(HttpStatus.CREATED) public ApiResponse<PlannerItem> create(@Valid @RequestBody PlannerItem item) { 
        
        PlannerItem result = service.save(item);
        return ApiResponse.ok(result); 
    }
    /**
     * 
     * @param id
     * @param item
     * @return
      */
    @PutMapping("/{id}") 
    public ApiResponse<PlannerItem> update(@PathVariable long id, @Valid @RequestBody PlannerItem item) { 
        
        PlannerItem result = service.update(id, item);
        return ApiResponse.ok(result); 
    }

    /**
     * 
     * @param id
     * @param status
     * @return
      */
    @PatchMapping("/{id}/status") 
    public ApiResponse<PlannerItem> changeStatus(@PathVariable long id, @RequestParam PlannerItem.ItemStatus status) { 
        
        PlannerItem old = service.find(null, null, null, null).stream().filter(i -> i.id() == id).findFirst().orElseThrow(); 
        PlannerItem result = service.update(id, new PlannerItem(id, old.type(), old.title(), old.category(), old.date(), old.startTime(), old.endTime(), status, old.dday(), old.note()));
        return ApiResponse.ok(result); 
    }

    /**
     * 
     * @param id
      */
    @DeleteMapping("/{id}") 
    @ResponseStatus(HttpStatus.NO_CONTENT) 
    public void delete(@PathVariable long id) { 
        service.delete(id); 
    }
}

