// 개인 주소록의 조회와 저장 API를 제공한다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.records.RecordService;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ContactsController {
    private final RecordService records;
    public ContactsController(RecordService records) { this.records = records; }
    @GetMapping("/contacts")
    public ApiResponse<?> contactList(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.CONTACT, from, to, q, category, page, size));
    }
    @GetMapping("/contacts/{id}")
    public ApiResponse<?> contactGet(@PathVariable String id) { return ApiResponse.ok(records.get(CurrentUser.id(), FeatureType.CONTACT, id)); }
    @PostMapping("/contacts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> contactCreate(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.CONTACT, body)); }
    @PutMapping("/contacts/{id}")
    public ApiResponse<?> contactUpdate(@PathVariable String id, @RequestBody Map<String,Object> body) { return ApiResponse.ok(records.update(CurrentUser.id(), FeatureType.CONTACT, id, body)); }
    @DeleteMapping("/contacts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void contactDelete(@PathVariable String id, @RequestParam long version) { records.delete(CurrentUser.id(), FeatureType.CONTACT, id, version); }
}
