package kr.timebar.diary.contract;

import io.swagger.v3.oas.annotations.tags.Tag;
import kr.timebar.diary.common.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@Tag(name = "Diary & Memo") @RestController @RequestMapping("/api")
public class EventDiaryMemoController {
    @GetMapping("/diary/calendar") public ApiResponse<?> diaryCalendar(@RequestParam int year, @RequestParam int month) { return ContractResponses.stub("GET /diary/calendar"); }
    @GetMapping("/diary/{date}") public ApiResponse<?> diary(@PathVariable String date) { return ContractResponses.stub("GET /diary/{date}"); }
    @PostMapping("/diary/{date}") public ApiResponse<?> saveDiary(@PathVariable String date, @RequestBody Map<String, Object> body) { return ContractResponses.stub("POST /diary/{date}"); }
    @DeleteMapping("/diary/{date}") public ApiResponse<?> deleteDiary(@PathVariable String date) { return ContractResponses.stub("DELETE /diary/{date}"); }
    @GetMapping("/memos") public ApiResponse<?> memos(@RequestParam(required=false) String from, @RequestParam(required=false) String to, @RequestParam(required=false) String q, @RequestParam(required=false) Integer page, @RequestParam(required=false) Integer size) { return ContractResponses.stub("GET /memos"); }
    @PostMapping("/memos") public ApiResponse<?> createMemo(@RequestBody Map<String, Object> body) { return ContractResponses.stub("POST /memos"); }
    @DeleteMapping("/memos/{id}") public ApiResponse<?> deleteMemo(@PathVariable String id) { return ContractResponses.stub("DELETE /memos/{id}"); }
    @PostMapping(value="/memos/stt", consumes=MediaType.MULTIPART_FORM_DATA_VALUE) public ApiResponse<?> stt(@RequestPart MultipartFile file) { return ContractResponses.stub("POST /memos/stt"); }
}
