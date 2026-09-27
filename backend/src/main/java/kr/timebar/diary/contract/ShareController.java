package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "Share") 
@RestController 
@RequestMapping("/api/share")
public class ShareController {

    /**
     * 
     * @return
      */
    @GetMapping("/friends") 
    public ApiResponse<?> friends() { 
        return ContractResponses.stub("GET /friends"); 
    }
    
    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/friends/invite") 
    public ApiResponse<?> invite(@RequestBody Map<String,Object> body) { 
        return ContractResponses.stub("POST /friends/invite"); 
    }

    /**
     * 
     * @param id
     * @return
      */
    @PostMapping("/friends/{id}/accept") 
    public ApiResponse<?> accept(@PathVariable String id) { 
        return ContractResponses.stub("POST /friends/{id}/accept"); 
    }

    /**
     * 
     * @param id
     * @return
      */
    @PostMapping("/friends/{id}/reject") 
    public ApiResponse<?> reject(@PathVariable String id) { 
        return ContractResponses.stub("POST /friends/{id}/reject"); 
    }

    /**
     * 
     * @param id
     * @return
      */
    @DeleteMapping("/friends/{id}") 
    public ApiResponse<?> deleteFriend(@PathVariable String id) { 
        return ContractResponses.stub("DELETE /friends/{id}"); 
    }

    /**
     * 
     * @return
      */
    @GetMapping("/groups") 
    public ApiResponse<?> groups() { 
        
        return ContractResponses.stub("GET /groups"); 
    }

    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/groups") public ApiResponse<?> createGroup(@RequestBody Map<String,Object> body) { 
        
        return ContractResponses.stub("POST /groups"); 
    }

    /**
     * 
     * @param id
     * @return
      */
    @GetMapping("/groups/{id}") public ApiResponse<?> group(@PathVariable String id) { 

        return ContractResponses.stub("GET /groups/{id}"); 
    }

    /**
     * 
     * @param id
     * @param body
     * @return
      */
    @PutMapping("/groups/{id}") 
    public ApiResponse<?> updateGroup(@PathVariable String id, @RequestBody Map<String,Object> body) { 
        
        return ContractResponses.stub("PUT /groups/{id}"); 
    }

    /**
     * 
     * @param id
     * @return
      */
    @DeleteMapping("/groups/{id}") 
    public ApiResponse<?> deleteGroup(@PathVariable String id) { 
        return ContractResponses.stub("DELETE /groups/{id}"); 
    }

    /**
     * 
     * @param id
     * @return
      */
    @GetMapping("/groups/{id}/members") 
    public ApiResponse<?> members(@PathVariable String id) {
        
        return ContractResponses.stub("GET /groups/{id}/members"); 
    }

    /**
     * 
     * @param id
     * @param body
     * @return
      */
    @PostMapping("/groups/{id}/members") 
    public ApiResponse<?> addMember(@PathVariable String id, @RequestBody Map<String,Object> body) { 
        return ContractResponses.stub("POST /groups/{id}/members"); 
    }

    /**
     * 
     * @param id
     * @param memberId
     * @return
      */
    @DeleteMapping("/groups/{id}/members/{memberId}") 
    public ApiResponse<?> deleteMember(@PathVariable String id, @PathVariable String memberId) { 
        return ContractResponses.stub("DELETE /groups/{id}/members/{memberId}"); 
    }
    
}
