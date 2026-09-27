package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "Home, Statistics & Focus") 
@RestController 
@RequestMapping("/api")
public class InsightController {

    /**
     * 
     * @param date
     * @return
      */
    @GetMapping("/home/summary") 
    public ApiResponse<?> home(@RequestParam(required=false) String date) { 
        
        return ContractResponses.stub("GET /home/summary"); 
    }
    
    /**
     * 
     * @param range
     * @param date
     * @return
      */
    @GetMapping("/stat/dashboard") 
    public ApiResponse<?> dashboard(@RequestParam String range, @RequestParam(required=false) String date) { 
    
        return ContractResponses.stub("GET /stat/dashboard"); 
    }
    
    /**
     * 
     * @param range
     * @param from
     * @param to
     * @return
      */
    @GetMapping("/stat/category") 
    public ApiResponse<?> category(@RequestParam String range, @RequestParam(required=false) String from, @RequestParam(required=false) String to) { 
        
        return ContractResponses.stub("GET /stat/category"); 
    }
    
    /**
     * 
     * @param range
     * @param from
     * @param to
     * @return
      */
    @GetMapping("/stat/plan-actual") 
    public ApiResponse<?> planActual(@RequestParam String range, @RequestParam(required=false) String from, @RequestParam(required=false) String to) { 
        
        return ContractResponses.stub("GET /stat/plan-actual"); 
    }
    
    /**
     * 
     * @param from
     * @param to
     * @return
      */
    @GetMapping("/stat/focus") 
    public ApiResponse<?> focusStats(@RequestParam(required=false) String from, @RequestParam(required=false) String to) { 
        return ContractResponses.stub("GET /stat/focus"); 
    }
    
    /**
     * 
     * @param from
     * @param to
     * @param categoryId
     * @return
      */
    @GetMapping("/focus/sessions") 
    public ApiResponse<?> sessions(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String categoryId) { 
        return ContractResponses.stub("GET /focus/sessions"); 
    }
    
    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/focus/sessions") 
    public ApiResponse<?> createSession(@RequestBody Map<String, Object> body) { 
        return ContractResponses.stub("POST /focus/sessions"); 
    }
    
    /**
     * 
     * @param id
     * @param body
     * @return
      */
    @PutMapping("/focus/sessions/{id}") 
    public ApiResponse<?> updateSession(@PathVariable String id, @RequestBody Map<String, Object> body) { 
        return ContractResponses.stub("PUT /focus/sessions/{id}"); 
    }
    
    /**
     * 
     * @param id
     * @return
      */
    @DeleteMapping("/focus/sessions/{id}") 
    public ApiResponse<?> deleteSession(@PathVariable String id) { 
        return ContractResponses.stub("DELETE /focus/sessions/{id}"); 
    }
}
