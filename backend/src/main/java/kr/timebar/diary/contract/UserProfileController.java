package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "User Profile") 
@RestController 
@RequestMapping("/api/user/profile")
public class UserProfileController {
    
    /**
     * 
     * @return
      */
    @GetMapping 
    public ApiResponse<?> profile() { 
        return ContractResponses.stub("GET /user/profile"); 
    }

    /**
     * 
     * @param body
     * @return
      */
    @PutMapping 
    public ApiResponse<?> update(@RequestBody Map<String, Object> body) { 
        return ContractResponses.stub("PUT /user/profile"); 
    }
}
