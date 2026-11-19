// 범위가 명시된 개인 기록·첨부 백업과 무결성 검사 및 덮어쓰기 없는 병합 복원을 처리한다.
package kr.timebar.diary.operations;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import kr.timebar.diary.common.*;
import kr.timebar.diary.feature.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.regex.Pattern;

@Service
@Transactional
public class BackupService {
    public static final int MAX_BYTES = 8 * 1024 * 1024;
    private static final int MAX_CONTENT_BYTES = 5 * 1024 * 1024;
    private static final List<FeatureType> TYPES = List.of(FeatureType.DIARY, FeatureType.MEMO, FeatureType.DDAY,
            FeatureType.MONEY, FeatureType.REVIEW, FeatureType.FOCUS, FeatureType.ACTUAL_SESSION);
    private static final List<String> EXCLUDED = List.of("브라우저 로컬·시연 자료", "일정·할 일·루틴·기존 플래너 항목", "업무·경력·소셜·채팅 자료",
            "계정 프로필·설정·토큰·비밀키·공유 권한", "진행 중인 집중·실제 기록", "공유 그룹 첨부·만료 첨부");
    private static final Pattern FILE_LINK = Pattern.compile("/api/attachments/([A-Za-z0-9_-]{1,100})/download");
    private final FeatureStore store;
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public BackupService(FeatureStore store, JdbcTemplate jdbc, ObjectMapper mapper) {
        this.store = store; this.jdbc = jdbc; this.mapper = mapper.copy().enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS);
    }
    public Map<String,Object> export(String user) {
        lockAccount(user);
        var records = new ArrayList<Map<String,Object>>();
        for (var type : TYPES) for (var row : store.all(user, type)) {
            if (type == FeatureType.ACTUAL_SESSION && !"COMPLETED".equals(row.get("state")) || type == FeatureType.FOCUS && row.get("endedAt") == null) continue;
            var data = FeatureStore.payload(row); data.remove("finishKey");
            // 원본 할 일·일정은 백업 범위 밖이라 연결 정보는 담지 않는다(PR-08)
            data.remove("sourceKind"); data.remove("sourceId");
            records.add(Map.of("kind", type.name(), "id", row.get("id"), "version", row.get("version"), "data", data));
        }
        if (records.size() > 500) FeatureInput.fail("수동 백업은 한 번에 최대 500개 기록을 지원합니다.");
        String now = Instant.now().toString();
        var attachments = new ArrayList<Map<String,Object>>();
        var metadata = jdbc.queryForList("SELECT id,name,size_bytes,expires_at FROM feature_file WHERE owner_id=? AND group_id IS NULL AND (expires_at IS NULL OR expires_at>?) ORDER BY id", user, now);
        if (metadata.size() > 50 || metadata.stream().mapToLong(row -> ((Number)field(row, "size_bytes")).longValue()).sum() > MAX_CONTENT_BYTES)
            FeatureInput.fail("수동 백업 첨부는 최대 50개, 합계 5 MiB입니다. 일부 파일을 제외한 백업으로 처리하지 않습니다.");
        for (var item : metadata) {
            String id = field(item, "id").toString();
            byte[] bytes = jdbc.queryForObject("SELECT content FROM feature_file WHERE id=? AND owner_id=?", byte[].class, id, user);
            var attachment = new LinkedHashMap<String,Object>();
            attachment.put("id", id); attachment.put("name", field(item, "name")); attachment.put("sizeBytes", bytes.length);
            attachment.put("expiresAt", field(item, "expires_at")); attachment.put("contentBase64", Base64.getEncoder().encodeToString(bytes)); attachment.put("sha256", hash(bytes));
            attachments.add(attachment);
        }
        var backup = new LinkedHashMap<String,Object>();
        backup.put("schemaVersion", 1); backup.put("backupId", UUID.randomUUID().toString()); backup.put("exportedAt", now);
        backup.put("timeZone", "UTC"); backup.put("includedTypes", TYPES.stream().map(Enum::name).toList()); backup.put("excluded", EXCLUDED);
        backup.put("records", records); backup.put("attachments", attachments); backup.put("checksum", digest(backup));
        byte[] bytes = encode(backup);
        validate(bytes);
        store.create(user, FeatureType.BACKUP_JOB, "export-" + backup.get("backupId"), Map.of("operation", "EXPORT", "state", "FILE_READY", "finishedAt", now, "recordCount", records.size(), "attachmentCount", attachments.size()));
        return backup;
    }
    public Map<String,Object> status(String user) {
        var rows = store.all(user, FeatureType.BACKUP_JOB);
        var result = new LinkedHashMap<String,Object>();
        result.put("lastExport", rows.stream().filter(row -> "EXPORT".equals(row.get("operation"))).findFirst().orElse(null));
        result.put("lastRestore", rows.stream().filter(row -> "COMPLETED".equals(row.get("state"))).findFirst().orElse(null));
        result.put("includedTypes", TYPES.stream().map(Enum::name).toList()); result.put("excluded", EXCLUDED);
        return result;
    }
    public Map<String,Object> preview(String user, byte[] bytes) {
        var backup = validate(bytes); String id = jobId(backup);
        lockAccount(user);
        var previous = store.optional(user, FeatureType.BACKUP_JOB, id);
        if (previous.isPresent()) return describe(previous.get(), backup);
        var items = new ArrayList<Map<String,Object>>();
        for (var record : rows(backup, "records")) {
            var type = FeatureType.valueOf(record.get("kind").toString()); String sourceId = record.get("id").toString();
            String target = type == FeatureType.REVIEW ? FeatureInput.text(object(record.get("data")), "date") : sourceId;
            var existing = store.optional(user, type, target);
            boolean skip = existing.isPresent();
            items.add(Map.of("kind", type.name(), "sourceId", sourceId, "targetId", skip || type == FeatureType.REVIEW ? target : UlidGenerator.newUlid(), "action", skip ? "SKIP" : "CREATE"));
        }
        for (var file : rows(backup, "attachments")) items.add(Map.of("kind", "ATTACHMENT", "sourceId", file.get("id"), "targetId", UlidGenerator.newUlid(), "action", "CREATE"));
        return describe(store.create(user, FeatureType.BACKUP_JOB, id, Map.of("operation", "RESTORE", "state", "PREVIEWED", "checksum", backup.get("checksum"), "items", items,
                "recordCount", rows(backup, "records").size(), "attachmentCount", rows(backup, "attachments").size(), "excluded", EXCLUDED)), backup);
    }
    public Map<String,Object> restore(String user, String jobId, byte[] bytes) {
        var backup = validate(bytes);
        if (!jobId(backup).equals(jobId)) FeatureInput.fail("미리보기와 다른 백업 파일입니다. 다시 확인해주세요.");
        lockAccount(user);
        var job = store.lock(user, FeatureType.BACKUP_JOB, jobId);
        if ("COMPLETED".equals(job.get("state"))) return describe(job, backup);
        if (!"PREVIEWED".equals(job.get("state"))) throw new ApiException(ErrorCode.CONFLICT);
        var items = rows(job, "items"); var fileIds = new HashMap<String,String>();
        for (var item : items) if ("ATTACHMENT".equals(item.get("kind"))) fileIds.put(item.get("sourceId").toString(), item.get("targetId").toString());
        for (var file : rows(backup, "attachments")) {
            byte[] content = Base64.getDecoder().decode(file.get("contentBase64").toString());
            jdbc.update("INSERT INTO feature_file(id,owner_id,group_id,name,size_bytes,content,expires_at,created_at) VALUES (?,?,NULL,?,?,?,?,?)",
                    fileIds.get(file.get("id").toString()), user, file.get("name"), content.length, content, file.get("expiresAt"), Instant.now().toString());
        }
        for (var record : rows(backup, "records")) {
            var item = items.stream().filter(plan -> plan.get("kind").equals(record.get("kind")) && plan.get("sourceId").equals(record.get("id"))).findFirst().orElseThrow();
            if ("SKIP".equals(item.get("action"))) continue;
            var type = FeatureType.valueOf(record.get("kind").toString());
            if (store.optional(user, type, record.get("id").toString()).isPresent()) throw new ApiException(ErrorCode.CONFLICT, "미리보기 이후 같은 ID의 기록이 생겼습니다. 기존 자료를 보존하기 위해 복원을 중단했습니다.");
            var data = new LinkedHashMap<>(object(record.get("data")));
            if (data.get("body") instanceof String body) {
                for (var file : fileIds.entrySet()) body = body.replace("/api/attachments/" + file.getKey() + "/download", "/api/attachments/" + file.getValue() + "/download");
                data.put("body", body);
            }
            store.create(user, type, item.get("targetId").toString(), data);
        }
        var data = FeatureStore.payload(job); data.put("state", "COMPLETED"); data.put("finishedAt", Instant.now().toString());
        data.put("items", items.stream().map(item -> { var result = new LinkedHashMap<>(item); result.put("result", "SKIP".equals(item.get("action")) ? "PRESERVED" : "CREATED"); return result; }).toList());
        return describe(store.replace(user, FeatureType.BACKUP_JOB, jobId, ((Number)job.get("version")).longValue(), data), backup);
    }
    public Map<String,Object> validate(byte[] bytes) {
        if (bytes.length == 0 || bytes.length > MAX_BYTES) FeatureInput.fail("백업 JSON은 1바이트~8 MiB입니다.");
        Map<String,Object> backup;
        try { backup = mapper.readValue(bytes, new TypeReference<LinkedHashMap<String,Object>>() { }); }
        catch (java.io.IOException e) { throw new ApiException(ErrorCode.VALIDATION_FAILED, "읽을 수 없는 백업 JSON입니다."); }
        if (backup == null) FeatureInput.fail("백업 객체가 필요합니다.");
        FeatureInput.keys(backup, Set.of("schemaVersion", "backupId", "exportedAt", "timeZone", "includedTypes", "excluded", "records", "attachments", "checksum"));
        if (!Integer.valueOf(1).equals(backup.get("schemaVersion"))) FeatureInput.fail("지원하지 않는 백업 버전입니다.");
        FeatureInput.instant(FeatureInput.requiredText(backup, "exportedAt"));
        if (!FeatureInput.requiredText(backup, "backupId").matches("[a-zA-Z0-9_-]{16,80}")) FeatureInput.fail("백업 ID가 올바르지 않습니다.");
        if (!TYPES.stream().map(Enum::name).toList().equals(backup.get("includedTypes")) || !EXCLUDED.equals(backup.get("excluded")) || !"UTC".equals(backup.get("timeZone"))) FeatureInput.fail("백업 범위 정보가 올바르지 않습니다.");
        var records = rows(backup, "records"); var files = rows(backup, "attachments");
        if (records.size() > 500 || files.size() > 50) FeatureInput.fail("최대 기록 500개·첨부 50개입니다.");
        Set<String> fileIds = new HashSet<>(); long total = 0;
        for (var file : files) {
            FeatureInput.keys(file, Set.of("id", "name", "sizeBytes", "expiresAt", "contentBase64", "sha256"));
            String id = identifier(file);
            if (!fileIds.add(id)) FeatureInput.fail("중복 첨부 ID입니다.");
            String name = FeatureInput.requiredText(file, "name");
            if (name.length() > 200 || name.matches(".*[\\\\/\\r\\n].*")) FeatureInput.fail("첨부 이름이 올바르지 않습니다.");
            long size = (long)FeatureInput.number(file, "sizeBytes", 1, MAX_CONTENT_BYTES, true);
            byte[] content;
            if (!(file.get("contentBase64") instanceof String encoded) || encoded.isEmpty() || encoded.length() > MAX_BYTES) FeatureInput.fail("첨부 인코딩을 확인해주세요.");
            try { content = Base64.getDecoder().decode((String)file.get("contentBase64")); }
            catch (IllegalArgumentException e) { throw new ApiException(ErrorCode.VALIDATION_FAILED, "손상된 첨부 인코딩입니다."); }
            if (content.length != size || !hash(content).equals(file.get("sha256"))) FeatureInput.fail("첨부 크기 또는 검증값이 일치하지 않습니다.");
            total += size;
            if (total > MAX_CONTENT_BYTES) FeatureInput.fail("첨부 합계는 최대 5 MiB입니다.");
            if (file.get("expiresAt") != null && !FeatureInput.instant(file.get("expiresAt").toString()).isAfter(Instant.now())) FeatureInput.fail("만료된 첨부가 포함되어 있습니다.");
        }
        Set<String> recordIds = new HashSet<>(); Set<String> reviewDates = new HashSet<>();
        for (var record : records) {
            FeatureInput.keys(record, Set.of("kind", "id", "version", "data"));
            String id = identifier(record), kind = FeatureInput.requiredText(record, "kind");
            var type = TYPES.stream().filter(t -> t.name().equals(kind)).findFirst().orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_FAILED, "지원하지 않는 기록 종류입니다."));
            if (!recordIds.add(kind + ":" + id)) FeatureInput.fail("중복 기록 ID입니다.");
            FeatureInput.version(record); var data = object(record.get("data"));
            if (data.containsKey("version")) FeatureInput.fail("기록 내용에 version을 포함할 수 없습니다.");
            if (type == FeatureType.ACTUAL_SESSION) validateActual(data); else FeatureInput.validate(type, data);
            if (type == FeatureType.FOCUS && data.get("endedAt") == null) FeatureInput.fail("진행 중인 집중 기록은 복원할 수 없습니다.");
            if (type == FeatureType.REVIEW && !reviewDates.add(FeatureInput.text(data, "date"))) FeatureInput.fail("같은 날짜의 회고가 중복됩니다.");
            var links = FILE_LINK.matcher(Objects.toString(data.get("body"), ""));
            while (links.find()) if (!fileIds.contains(links.group(1))) FeatureInput.fail("기록이 참조하는 첨부가 백업에 없습니다.");
        }
        if (!digest(backup).equals(backup.get("checksum"))) FeatureInput.fail("백업 검증값이 일치하지 않습니다. 손상 여부를 확인해주세요.");
        return backup;
    }
    private void validateActual(Map<String,Object> data) {
        FeatureInput.keys(data, Set.of("title", "startedAt", "endedAt", "timeZone", "state", "elapsedSeconds"));
        if (FeatureInput.requiredText(data, "title").length() > 200 || !"COMPLETED".equals(data.get("state"))) FeatureInput.fail("완료한 실제 기록만 복원할 수 있습니다.");
        Instant start = FeatureInput.instant(FeatureInput.requiredText(data, "startedAt")), end = FeatureInput.instant(FeatureInput.requiredText(data, "endedAt"));
        double seconds = FeatureInput.number(data, "elapsedSeconds", 0, 3155760000L, true);
        if (end.isBefore(start) || Duration.between(start, end).getSeconds() != seconds) FeatureInput.fail("실제 기록의 시각과 경과 시간이 다릅니다.");
        try { ZoneId.of(FeatureInput.requiredText(data, "timeZone")); } catch (DateTimeException e) { FeatureInput.fail("기록 시간대가 올바르지 않습니다."); }
    }
    private Map<String,Object> describe(Map<String,Object> job, Map<String,Object> backup) {
        var result = new LinkedHashMap<>(job);
        result.put("items", rows(job, "items").stream().map(item -> {
            var description = new LinkedHashMap<>(item);
            if ("ATTACHMENT".equals(item.get("kind"))) {
                description.put("title", rows(backup, "attachments").stream().filter(row -> row.get("id").equals(item.get("sourceId"))).findFirst().orElseThrow().get("name"));
                description.put("reason", "개인 첨부로 복원. 공유 권한은 복원하지 않음");
            } else {
                var record = rows(backup, "records").stream().filter(row -> row.get("kind").equals(item.get("kind")) && row.get("id").equals(item.get("sourceId"))).findFirst().orElseThrow();
                description.put("title", Objects.toString(object(record.get("data")).get("title"), item.get("targetId").toString()));
                description.put("reason", "SKIP".equals(item.get("action")) ? "기존 ID·날짜를 보존합니다. 파일 버전 " + record.get("version") : "현재 계정 소유의 새 기록");
            }
            return description;
        }).toList());
        return result;
    }
    private void lockAccount(String user) {
        if (jdbc.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE", user).isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND);
    }
    private String identifier(Map<String,Object> row) {
        String id = FeatureInput.requiredText(row, "id");
        if (!id.matches("[A-Za-z0-9_@-]{1,100}")) FeatureInput.fail("기록 식별자가 올바르지 않습니다.");
        return id;
    }
    private String jobId(Map<String,Object> backup) { return "restore-" + backup.get("checksum"); }
    private String digest(Map<String,Object> value) { var data = new LinkedHashMap<>(value); data.remove("checksum"); return hash(encode(data)); }
    private byte[] encode(Object data) {
        try { return mapper.writeValueAsBytes(data); } catch (java.io.IOException e) { throw new IllegalStateException("백업 직렬화 오류", e); }
    }
    private String hash(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    private Object field(Map<String,Object> row, String key) { return row.entrySet().stream().filter(e -> e.getKey().equalsIgnoreCase(key)).map(Map.Entry::getValue).filter(Objects::nonNull).findFirst().orElse(null); }
    private Map<String,Object> object(Object value) { return FeatureInput.object(value); }
    private List<Map<String,Object>> rows(Map<String,Object> data, String field) {
        if (!(data.get(field) instanceof List<?>)) FeatureInput.fail(field + " 목록이 필요합니다.");
        return ((List<?>)data.get(field)).stream().map(this::object).toList();
    }
}
