// 주소록 연락처를 가입 계정과 연결·해제하는 API(Q-21). 연결된 연락처만 할 일 체크리스트 담당자로 고를 수 있다.
package kr.timebar.diary.contract;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.records.ContactAccounts;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/contacts/{id}/account")
public class ContactAccountController {
    private final ContactAccounts accounts;
    public ContactAccountController(ContactAccounts accounts) { this.accounts = accounts; }
    @PostMapping
    public ApiResponse<?> link(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(accounts.link(CurrentUser.id(), id, body)); }
    @DeleteMapping
    public ApiResponse<?> unlink(@PathVariable String id, @RequestParam long version) { return ApiResponse.ok(accounts.unlink(CurrentUser.id(), id, version)); }
}
