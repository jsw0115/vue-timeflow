package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "Admin") 
@RestController 
@RequestMapping("/api/admin")
public class AdminController {

    /**
     * 
     * @param q
     * @param role
     * @param status
     * @param page
     * @param size
     * @return
      */
    @GetMapping("/users") 
    public ApiResponse<?> users(@RequestParam(required=false) String q, @RequestParam(required=false) String role, @RequestParam(required=false) String status, @RequestParam(required=false) Integer page, @RequestParam(required=false) Integer size) { 
        return ContractResponses.stub("GET /users"); 
    }

    /**
     * 
     * @param id
     * @return
      */
    @GetMapping("/users/{id}") 
    public ApiResponse<?> user(@PathVariable String id) { 
        return ContractResponses.stub("GET /users/{id}"); 
    }

    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/users") 
    public ApiResponse<?> createUser(@RequestBody Map<String,Object> body) { 
        return ContractResponses.stub("POST /users"); 
    }

    /**
     * 
     * @param id
     * @param body
     * @return
      */
    @PutMapping("/users/{id}") 
    public ApiResponse<?> updateUser(@PathVariable String id, @RequestBody Map<String,Object> body) { 
        return ContractResponses.stub("PUT /users/{id}"); 
    }

    /**
     * 
     * @param id
     * @return
      */
    @DeleteMapping("/users/{id}") 
    public ApiResponse<?> deleteUser(@PathVariable String id) { 
        return ContractResponses.stub("DELETE /users/{id}"); 
    }
}
