// 실제 기록·첨부의 타 계정 복원과 손상·충돌·중단 재시도·소유권을 검증한다.
package kr.timebar.diary.feature;

import com.fasterxml.jackson.databind.*;
import kr.timebar.diary.common.*;
import kr.timebar.diary.operations.*;
import kr.timebar.diary.records.AttachmentController;
import kr.timebar.diary.social.SocialService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class BackupTest {
    @Autowired BackupService service;
    @Autowired FeatureStore store;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper mapper;
    @Autowired SocialService social;
    String source, destination, fileId;
    byte[] content = "첨부 원문".repeat(100).getBytes(StandardCharsets.UTF_8);
    @BeforeEach void setup() {
        source = UUID.randomUUID().toString(); destination = UUID.randomUUID().toString(); fileId = UlidGenerator.newUlid();
        for (String user : List.of(source, destination)) jdbc.update("INSERT INTO users(id) VALUES (?)", user);
        store.create(source, FeatureType.DIARY, "diary-1", Map.of("title", "일기", "date", "2026-11-15", "body", "[첨부](/api/attachments/" + fileId + "/download)"));
        store.create(source, FeatureType.MEMO, "memo-1", Map.of("title", "메모", "body", "내용"));
        store.create(source, FeatureType.SETTING, "ai", Map.of("value", Map.of("apiKey", "not-exported-test-marker")));
        jdbc.update("INSERT INTO feature_file(id,owner_id,name,size_bytes,content,created_at) VALUES (?,?,?,?,?,?)", fileId, source, "note.txt", content.length, content, "2026-11-15T00:00:00Z");
    }
    @AfterEach void clear() { org.springframework.security.core.context.SecurityContextHolder.clearContext(); }
    byte[] bytes(Object value) throws Exception { return mapper.writeValueAsBytes(value); }
    @SuppressWarnings("unchecked") List<Map<String,Object>> rows(Map<String,Object> value, String key) { return (List<Map<String,Object>>)value.get(key); }
    void sign(Map<String,Object> backup) throws Exception {
        backup.remove("checksum"); backup.put("checksum", HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(mapper.copy().enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS).writeValueAsBytes(backup))));
    }
    @Test void anotherAccountRestoresContentsRelationsAndPrivateFilesExactlyOnce() throws Exception {
        var backup = service.export(source); byte[] file = bytes(backup);
        assertFalse(new String(file, StandardCharsets.UTF_8).contains("not-exported-test-marker"));
        assertEquals(2, rows(backup, "records").size());
        var preview = service.preview(destination, file);
        assertTrue(store.all(destination, FeatureType.DIARY).isEmpty());
        assertEquals(3, rows(preview, "items").size());
        var result = service.restore(destination, preview.get("id").toString(), file);
        assertEquals("COMPLETED", result.get("state"));
        assertEquals(result, service.restore(destination, preview.get("id").toString(), file));
        assertEquals(1, store.all(destination, FeatureType.DIARY).size()); assertEquals(1, store.all(destination, FeatureType.MEMO).size());
        String newFile = jdbc.queryForObject("SELECT id FROM feature_file WHERE owner_id=?", String.class, destination);
        assertNotEquals(fileId, newFile);
        assertArrayEquals(content, jdbc.queryForObject("SELECT content FROM feature_file WHERE id=?", byte[].class, newFile));
        assertNull(jdbc.queryForObject("SELECT group_id FROM feature_file WHERE id=?", String.class, newFile));
        assertEquals("[첨부](/api/attachments/" + newFile + "/download)", store.all(destination, FeatureType.DIARY).get(0).get("body"));
        assertEquals("내용", store.all(destination, FeatureType.MEMO).get(0).get("body"));
    }
    @Test void existingRecordsAreShownAsSkippedAndNeverOverwritten() throws Exception {
        store.create(destination, FeatureType.MEMO, "memo-1", Map.of("title", "기존", "body", "보존"));
        byte[] file = bytes(service.export(source)); var preview = service.preview(destination, file);
        assertEquals(1, rows(preview, "items").stream().filter(item -> "SKIP".equals(item.get("action"))).count());
        service.restore(destination, preview.get("id").toString(), file);
        assertEquals("보존", store.get(destination, FeatureType.MEMO, "memo-1").get("body"));
    }
    /** 타이머 모드·목표 시간·일시정지 구간도 백업·복원한다. 경과 시간은 일시정지를 뺀 값이어야 하고, 기록 밖 일시정지는 거부한다(PR-09). */
    @SuppressWarnings("unchecked")
    @Test void timerRecordsKeepPausesThroughBackup() throws Exception {
        Instant start = Instant.parse("2026-11-18T01:00:00Z");
        store.create(source, FeatureType.ACTUAL_SESSION, "timer-1", Map.of("title", "집중", "state", "COMPLETED", "timeZone", "Asia/Seoul", "mode", "pomodoro", "targetMinutes", 50,
                "startedAt", start.toString(), "endedAt", start.plusSeconds(1800).toString(), "elapsedSeconds", 1500, "finishKey", "finish-key-0000000001",
                "pauses", List.of(Map.of("from", start.plusSeconds(600).toString(), "to", start.plusSeconds(900).toString()))));
        byte[] file = bytes(service.export(source));
        service.restore(destination, service.preview(destination, file).get("id").toString(), file);
        var restored = store.all(destination, FeatureType.ACTUAL_SESSION).get(0);
        assertEquals(1500, ((Number)restored.get("elapsedSeconds")).intValue());
        assertEquals("pomodoro", restored.get("mode"));
        assertEquals(1, ((List<?>)restored.get("pauses")).size());
        assertFalse(restored.containsKey("finishKey"));
        for (var change : List.<Map<String,Object>>of(Map.of("elapsedSeconds", 1800), Map.of("mode", "stopwatch"),
                Map.of("pauses", List.of(Map.of("from", start.minusSeconds(60).toString(), "to", start.plusSeconds(60).toString()))))) {
            var tampered = service.export(source);
            var data = (Map<String,Object>)rows(tampered, "records").stream().filter(row -> "ACTUAL_SESSION".equals(row.get("kind"))).findFirst().orElseThrow().get("data");
            data.putAll(change); sign(tampered);
            assertThrows(ApiException.class, () -> service.preview(destination, bytes(tampered)), change.toString());
        }
    }
    @Test void damagedUnsupportedDuplicateAndMissingAttachmentBackupsAreRejected() throws Exception {
        assertThrows(ApiException.class, () -> service.preview(destination, "broken".getBytes(StandardCharsets.UTF_8)));
        assertThrows(ApiException.class, () -> service.preview(destination, "null".getBytes(StandardCharsets.UTF_8)));
        var backup = service.export(source); backup.put("schemaVersion", 2);
        assertThrows(ApiException.class, () -> service.preview(destination, bytes(backup)));
        backup.put("schemaVersion", 1); var records = new ArrayList<>(rows(backup, "records")); records.add(records.get(0)); backup.put("records", records); sign(backup);
        assertThrows(ApiException.class, () -> service.preview(destination, bytes(backup)));
        var missing = service.export(source); missing.put("attachments", List.of()); sign(missing);
        assertThrows(ApiException.class, () -> service.preview(destination, bytes(missing)));
        var damaged = service.export(source); rows(damaged, "attachments").get(0).put("contentBase64", Base64.getEncoder().encodeToString("changed".getBytes(StandardCharsets.UTF_8))); sign(damaged);
        assertThrows(ApiException.class, () -> service.preview(destination, bytes(damaged)));
        assertTrue(store.all(destination, FeatureType.DIARY).isEmpty());
    }
    @Test void failureAfterFileInsertionRollsBackAndTheSamePreviewCanBeRetried() throws Exception {
        byte[] file = bytes(service.export(source)); var preview = service.preview(destination, file);
        store.create(destination, FeatureType.MEMO, "memo-1", Map.of("title", "동시 생성"));
        assertThrows(ApiException.class, () -> service.restore(destination, preview.get("id").toString(), file));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM feature_file WHERE owner_id=?", Integer.class, destination));
        assertTrue(store.all(destination, FeatureType.DIARY).isEmpty());
        assertEquals("PREVIEWED", store.get(destination, FeatureType.BACKUP_JOB, preview.get("id").toString()).get("state"));
        store.delete(destination, FeatureType.MEMO, "memo-1", 1);
        assertEquals("COMPLETED", service.restore(destination, preview.get("id").toString(), file).get("state"));
    }
    @Test void httpEnforcesLoginPreviewAndFileOwnership() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new BackupController(service), new AttachmentController(jdbc, social)).setControllerAdvice(new ApiExceptionHandler()).build();
        mvc.perform(get("/api/user/data/backup")).andExpect(status().isUnauthorized());
        authenticate(destination);
        byte[] file = bytes(service.export(source));
        mvc.perform(multipart("/api/user/data/backup/preview").file(new MockMultipartFile("file", "backup.json", "application/json", file)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.state").value("PREVIEWED"));
        mvc.perform(get("/api/attachments/" + fileId + "/download")).andExpect(status().isNotFound());
        var foreignPreview = service.preview(source, file);
        String third = UUID.randomUUID().toString(); jdbc.update("INSERT INTO users(id) VALUES (?)", third); authenticate(third);
        mvc.perform(multipart("/api/user/data/backup/" + foreignPreview.get("id") + "/restore").file(new MockMultipartFile("file", "backup.json", "application/json", file))).andExpect(status().isNotFound());
    }
    private void authenticate(String owner) {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated(new kr.timebar.diary.security.AuthUserPrincipal(owner, "test@example.test", "USER"), null, List.of()));
    }
}
