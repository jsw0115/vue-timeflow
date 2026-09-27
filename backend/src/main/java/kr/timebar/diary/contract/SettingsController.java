package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "Settings") 
@RestController 
@RequestMapping("/api/settings")
public class SettingsController {

    /**
     * 
     * @return
      */
    @GetMapping 
    public ApiResponse<?> get() { 
        return ContractResponses.stub("GET /settings"); 
    }

    /**
     * 
     * @param body
     * @return
      */
    @PostMapping 
    public ApiResponse<?> save(@RequestBody Map<String, Object> body) { 
        return ContractResponses.stub("POST /settings"); 
    }

    /**
     * 
     * @return
      */
    @GetMapping("/categories") 
    public ApiResponse<?> categories() { 
        return ContractResponses.stub("GET /settings/categories"); 
    }
    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/categories") 
    public ApiResponse<?> saveCategories(@RequestBody Map<String, Object> body) { 
        return ContractResponses.stub("POST /settings/categories"); 
    }

    /**
     * 
     * @return
      */
    @GetMapping("/notifications") 
    public ApiResponse<?> notifications() { 
        return ContractResponses.stub("GET /settings/notifications"); 
    }

    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/notifications") 
    public ApiResponse<?> saveNotifications(@RequestBody Map<String, Object> body) { 
        return ContractResponses.stub("POST /settings/notifications"); 
    }

    /**
     * 
     * @return
      */
    @GetMapping("/share-visibility") 
    public ApiResponse<?> visibility() { 
        return ContractResponses.stub("GET /settings/share-visibility"); 
    }
    
    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/share-visibility") 
    public ApiResponse<?> saveVisibility(@RequestBody Map<String, Object> body) { 
        return ContractResponses.stub("POST /settings/share-visibility"); 
    }

    /**
     * 
     * @return
      */
    @GetMapping("/theme-sticker") 
    public ApiResponse<?> theme() { 
        return ContractResponses.stub("GET /settings/theme-sticker"); 
    }

    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/theme-sticker") 
    public ApiResponse<?> saveTheme(@RequestBody Map<String, Object> body) { 
        return ContractResponses.stub("POST /settings/theme-sticker"); 
    }
}
