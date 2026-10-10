package kr.timebar.diary.planner;

import jakarta.validation.Valid;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
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
        List<PlannerItem> result = service.find(CurrentUser.id(), date, type, category, status);
        return ApiResponse.ok(result); 
    }

    /**
     * 
     * @param item
     * @return
      */
    @PostMapping 
    @ResponseStatus(HttpStatus.CREATED) public ApiResponse<PlannerItem> create(@Valid @RequestBody PlannerItem item) { 
        
        PlannerItem result = service.save(CurrentUser.id(), item);
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
        
        PlannerItem result = service.update(CurrentUser.id(), id, item);
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
        
        PlannerItem result = service.changeStatus(CurrentUser.id(), id, status);
        return ApiResponse.ok(result); 
    }

    /**
     * 
     * @param id
      */
    @DeleteMapping("/{id}") 
    @ResponseStatus(HttpStatus.NO_CONTENT) 
    public void delete(@PathVariable long id) { 
        service.delete(CurrentUser.id(), id);
    }
}

