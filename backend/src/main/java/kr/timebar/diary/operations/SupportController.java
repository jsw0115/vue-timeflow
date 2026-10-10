// 개인 문의 접수와 게시된 공지·콘텐츠 조회 API를 제공한다.
package kr.timebar.diary.operations;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.records.RecordService;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class SupportController {
    private final RecordService records;
    private final FeatureStore store;
    public SupportController(RecordService records, FeatureStore store) { this.records = records; this.store = store; }
    @GetMapping("/support/tickets")
    public ApiResponse<?> tickets(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) { return ApiResponse.ok(records.list(CurrentUser.id(), FeatureType.TICKET, null, null, null, null, page, size)); }
    @PostMapping("/support/tickets")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> ticket(@RequestBody Map<String,Object> body) { return ApiResponse.ok(records.create(CurrentUser.id(), FeatureType.TICKET, body)); }
    @GetMapping("/notices")
    public ApiResponse<?> notices() {
        CurrentUser.id(); String today = LocalDate.now(ZoneId.of("Asia/Seoul")).toString();
        return ApiResponse.ok(store.all(FeatureStore.SYSTEM, FeatureType.NOTICE).stream().filter(row -> Boolean.TRUE.equals(row.get("published")))
                .filter(row -> FeatureInput.text(row, "from").isEmpty() || FeatureInput.text(row, "from").compareTo(today) <= 0)
                .filter(row -> FeatureInput.text(row, "to").isEmpty() || FeatureInput.text(row, "to").compareTo(today) >= 0).toList());
    }
    @GetMapping("/content")
    public ApiResponse<?> content() { CurrentUser.id(); return ApiResponse.ok(store.all(FeatureStore.SYSTEM, FeatureType.CONTENT).stream().filter(row -> Boolean.TRUE.equals(row.get("live"))).toList()); }
}
