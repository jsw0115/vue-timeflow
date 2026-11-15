// 인증 계정의 제한된 백업 다운로드와 파일 미리보기·복원 API를 제공한다.
package kr.timebar.diary.operations;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user/data/backup")
public class BackupController {
    private final BackupService backups;
    public BackupController(BackupService backups) { this.backups = backups; }
    @GetMapping
    public ResponseEntity<?> export() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.ok(backups.export(CurrentUser.id())));
    }
    @GetMapping("/status")
    public ApiResponse<?> status() { return ApiResponse.ok(backups.status(CurrentUser.id())); }
    @PostMapping(value="/preview", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> preview(@RequestPart MultipartFile file) throws java.io.IOException {
        String user = CurrentUser.id(); return ApiResponse.ok(backups.preview(user, bytes(file)));
    }
    @PostMapping(value="/{jobId}/restore", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> restore(@PathVariable String jobId, @RequestPart MultipartFile file) throws java.io.IOException {
        String user = CurrentUser.id(); return ApiResponse.ok(backups.restore(user, jobId, bytes(file)));
    }
    private byte[] bytes(MultipartFile file) throws java.io.IOException {
        if (file.isEmpty() || file.getSize() > BackupService.MAX_BYTES) FeatureInput.fail("백업 JSON은 1바이트~8 MiB입니다.");
        return file.getBytes();
    }
}
