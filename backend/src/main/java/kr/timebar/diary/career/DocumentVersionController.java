// 문서 버전(이력서·경력기술서·포트폴리오 고정본)과 지원 건의 제출본 연결 API(PR-25). 버전은 고치는 경로가 없다.
package kr.timebar.diary.career;

import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/career")
public class DocumentVersionController {
    private final DocumentVersions versions;
    public DocumentVersionController(DocumentVersions versions) { this.versions = versions; }

    @GetMapping("/document-versions")
    public ApiResponse<?> list(@RequestParam(required = false) String document) { return ApiResponse.ok(versions.list(CurrentUser.id(), document)); }
    @PostMapping("/document-versions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> create(@RequestBody(required = false) Map<String, Object> body) { return ApiResponse.ok(versions.create(CurrentUser.id(), body)); }
    @GetMapping("/document-versions/{id}")
    public ApiResponse<?> get(@PathVariable String id) { return ApiResponse.ok(versions.get(CurrentUser.id(), id)); }
    @DeleteMapping("/document-versions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { versions.delete(CurrentUser.id(), id); }

    @GetMapping("/applications/{id}/documents")
    public ApiResponse<?> attached(@PathVariable String id) { return ApiResponse.ok(versions.attached(CurrentUser.id(), id)); }
    @PostMapping("/applications/{id}/documents")
    public ApiResponse<?> attach(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) { return ApiResponse.ok(versions.attach(CurrentUser.id(), id, body)); }
    @DeleteMapping("/applications/{id}/documents/{versionId}")
    public ApiResponse<?> detach(@PathVariable String id, @PathVariable String versionId) { return ApiResponse.ok(versions.detach(CurrentUser.id(), id, versionId)); }
}
