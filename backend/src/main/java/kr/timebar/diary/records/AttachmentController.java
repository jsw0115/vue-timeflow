// 첨부 파일의 실제 업로드·다운로드와 그룹 권한 및 보관 기간을 검사한다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.social.SocialService;
import kr.timebar.diary.common.*;
import kr.timebar.diary.security.CurrentUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/attachments")
@Transactional
public class AttachmentController {
    private static final int MAX_BYTES = 10 * 1024 * 1024;
    private final JdbcTemplate jdbc;
    private final SocialService social;
    public AttachmentController(JdbcTemplate jdbc, SocialService social) { this.jdbc = jdbc; this.social = social; }
    @GetMapping
    public ApiResponse<?> list(@RequestParam(required=false) String groupId) {
        if (groupId != null) social.require(CurrentUser.id(), FeatureType.GROUP, groupId, false);
        String sql = "SELECT id,owner_id AS ownerId,group_id AS groupId,name,size_bytes AS sizeBytes,expires_at AS expiresAt FROM feature_file WHERE " + (groupId == null ? "owner_id=?" : "group_id=?") + " ORDER BY created_at DESC";
        return ApiResponse.ok(jdbc.queryForList(sql, groupId == null ? CurrentUser.id() : groupId).stream().map(this::fields).filter(row -> row.get("ownerId").equals(CurrentUser.id()) || !social.blocked(CurrentUser.id(), row.get("ownerId").toString())).toList());
    }
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<?> upload(@RequestPart MultipartFile file, @RequestParam(defaultValue="30") int retentionDays, @RequestParam(required=false) String groupId, @RequestParam(defaultValue="memo") String domain) throws java.io.IOException {
        if (!Set.of("memo", "diary", "event", "personal").contains(domain)) FeatureInput.fail("업무·경력 파일은 공유 첨부에 저장할 수 없습니다.");
        if (file.isEmpty() || file.getSize() > MAX_BYTES) FeatureInput.fail("파일 크기는 1바이트~10 MiB입니다.");
        retention(retentionDays); if (groupId != null) social.require(CurrentUser.id(), FeatureType.GROUP, groupId, false);
        String name = Objects.toString(file.getOriginalFilename(), "attachment").replaceAll("[\\\\/\\r\\n]", "_");
        if (name.length() > 200) name = name.substring(name.length() - 200);
        String id = UlidGenerator.newUlid(); byte[] bytes = file.getBytes(); String now = Instant.now().toString();
        jdbc.update("INSERT INTO feature_file(id,owner_id,group_id,name,size_bytes,content,expires_at,created_at) VALUES (?,?,?,?,?,?,?,?)", id, CurrentUser.id(), groupId, name, bytes.length, bytes, expiry(retentionDays), now);
        return ApiResponse.ok(metadata(id));
    }
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable String id) {
        var row = metadata(id); authorize(row, false);
        String expiry = Objects.toString(row.get("expiresAt"), "");
        if (!expiry.isEmpty() && !Instant.parse(expiry).isAfter(Instant.now())) throw new ApiException(ErrorCode.NOT_FOUND, "파일 보관 기간이 만료되었습니다.");
        byte[] bytes = jdbc.queryForObject("SELECT content FROM feature_file WHERE id=?", byte[].class, id);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(row.get("name").toString(), StandardCharsets.UTF_8).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store").body(bytes);
    }
    @PutMapping("/{id}/retention")
    public ApiResponse<?> setRetention(@PathVariable String id, @RequestBody Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("days")); int days = (int)FeatureInput.number(body, "days", 0, 365, true); retention(days);
        var row = metadata(id); authorize(row, true);
        String current = Objects.toString(row.get("expiresAt"), "");
        if (!current.isEmpty() && !Instant.parse(current).isAfter(Instant.now())) throw new ApiException(ErrorCode.CONFLICT, "만료된 파일은 다시 업로드해주세요.");
        jdbc.update("UPDATE feature_file SET expires_at=? WHERE id=?", expiry(days), id); return ApiResponse.ok(metadata(id));
    }
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { authorize(metadata(id), true); jdbc.update("DELETE FROM feature_file WHERE id=?", id); }
    @PostMapping("/purge-expired")
    public ApiResponse<?> purge() { return ApiResponse.ok(Map.of("deleted", jdbc.update("DELETE FROM feature_file WHERE owner_id=? AND expires_at IS NOT NULL AND expires_at<=?", CurrentUser.id(), timestamp(Instant.now())))); }
    private Map<String,Object> metadata(String id) { return jdbc.queryForList("SELECT id,owner_id AS ownerId,group_id AS groupId,name,size_bytes AS sizeBytes,expires_at AS expiresAt FROM feature_file WHERE id=?", id).stream().findFirst().map(this::fields).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND)); }
    private Map<String,Object> fields(Map<String,Object> row) { return SqlResponses.fields(row, "id", "ownerId", "groupId", "name", "sizeBytes", "expiresAt"); }
    private void authorize(Map<String,Object> file, boolean owner) {
        if (file.get("ownerId").equals(CurrentUser.id())) return;
        if (owner || file.get("groupId") == null || social.blocked(CurrentUser.id(), file.get("ownerId").toString())) throw new ApiException(ErrorCode.NOT_FOUND);
        social.require(CurrentUser.id(), FeatureType.GROUP, file.get("groupId").toString(), false);
    }
    private void retention(int days) { if (days < 0 || days > 365) FeatureInput.fail("보관 기간은 0~365일이며 0은 무기한입니다."); }
    private String expiry(int days) { return days == 0 ? null : timestamp(Instant.now().plus(Duration.ofDays(days))); }
    private String timestamp(Instant instant) { return new java.time.format.DateTimeFormatterBuilder().appendInstant(3).toFormatter().format(instant); }
}
