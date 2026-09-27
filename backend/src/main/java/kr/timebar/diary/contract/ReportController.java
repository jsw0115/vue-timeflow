package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "Reports") 
@RestController 
@RequestMapping("/api/reports")
public class ReportController {

    /**
     * 
     * @param date
     * @param categoryName
     * @return
      */
    @GetMapping("/time-blocks") 
    public ApiResponse<?> reportTimeBlocks(@RequestParam String date, @RequestParam(required=false) String categoryName) { 
        return ContractResponses.stub("GET /time-blocks"); 
    }

    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/draft") 
    public ApiResponse<?> reportDraft(@RequestBody Map<String,Object> body) { 
        return ContractResponses.stub("POST /draft"); 
    }

    /**
     * 
     * @param reportKey
     * @return
      */
    @GetMapping("/{reportKey}") 
    public ApiResponse<?> report(@PathVariable String reportKey) { 
        return ContractResponses.stub("GET /{reportKey}"); 
    }

    /**
     * 
     * @param reportKey
     * @param body
     * @return
      */
    @PostMapping("/{reportKey}") 
    public ApiResponse<?> saveReport(@PathVariable String reportKey, @RequestBody Map<String,Object> body) { 
        return ContractResponses.stub("POST /{reportKey}"); 
    }

    /**
     * 
     * @param reportKey
     * @return
      */
    @GetMapping("/{reportKey}/sub-reports") 
    public ApiResponse<?> subReports(@PathVariable String reportKey) { 
        return ContractResponses.stub("GET /{reportKey}/sub-reports"); 
    }
}
