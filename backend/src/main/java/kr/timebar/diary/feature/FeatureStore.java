// 사용자와 기능별 JSON 기록을 DB에 저장하고 버전 충돌을 검사한다.
package kr.timebar.diary.feature;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.UlidGenerator;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Repository
@Transactional
public class FeatureStore {
    public static final String SYSTEM = "__system__";
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public FeatureStore(JdbcTemplate jdbc, ObjectMapper mapper) { this.jdbc = jdbc; this.mapper = mapper; }

    public Map<String, Object> create(String owner, FeatureType type, Map<String, Object> body) {
        return create(owner, type, UlidGenerator.newUlid(), body);
    }

    public Map<String, Object> create(String owner, FeatureType type, String id, Map<String, Object> body) {
        String json = encode(body);
        String now = Instant.now().toString();
        try {
            jdbc.update("INSERT INTO feature_record(owner_id,kind,record_id,payload,version,created_at,updated_at) VALUES (?,?,?,?,1,?,?)",
                    owner, type.name(), id, json, now, now);
        } catch (DuplicateKeyException e) { throw new ApiException(ErrorCode.CONFLICT, "이미 존재하는 기록입니다."); }
        return get(owner, type, id);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> get(String owner, FeatureType type, String id) {
        return optional(owner, type, id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> optional(String owner, FeatureType type, String id) {
        List<Map<String, Object>> rows = jdbc.query("SELECT * FROM feature_record WHERE owner_id=? AND kind=? AND record_id=?", this::row, owner, type.name(), id);
        return rows.stream().findFirst();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> all(String owner, FeatureType type) {
        return jdbc.query("SELECT * FROM feature_record WHERE owner_id=? AND kind=? ORDER BY created_at DESC,record_id", this::row, owner, type.name());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> allOwners(FeatureType type) {
        return jdbc.query("SELECT * FROM feature_record WHERE kind=? ORDER BY created_at DESC,record_id", (rs, index) -> {
            var data = row(rs, index); data.put("ownerId", rs.getString("owner_id")); return data;
        }, type.name());
    }

    public Map<String, Object> replace(String owner, FeatureType type, String id, long version, Map<String, Object> body) {
        String json = encode(body);
        int changed = jdbc.update("UPDATE feature_record SET payload=?,version=version+1,updated_at=? WHERE owner_id=? AND kind=? AND record_id=? AND version=?",
                json, Instant.now().toString(), owner, type.name(), id, version);
        if (changed == 0) conflict(owner, type, id);
        return get(owner, type, id);
    }

    public void delete(String owner, FeatureType type, String id, long version) {
        if (version < 1) FeatureInput.fail("version은 1 이상입니다.");
        if (jdbc.update("DELETE FROM feature_record WHERE owner_id=? AND kind=? AND record_id=? AND version=?", owner, type.name(), id, version) == 0) conflict(owner, type, id);
    }

    public Map<String, Object> lock(String owner, FeatureType type, String id) {
        return jdbc.query("SELECT * FROM feature_record WHERE owner_id=? AND kind=? AND record_id=? FOR UPDATE", this::row, owner, type.name(), id)
                .stream().findFirst().orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    public void deleteAll(String owner, FeatureType type) { jdbc.update("DELETE FROM feature_record WHERE owner_id=? AND kind=?", owner, type.name()); }

    public static Map<String, Object> payload(Map<String, Object> record) {
        Map<String, Object> body = new LinkedHashMap<>(record);
        for (String key : List.of("id", "version", "createdAt", "updatedAt")) body.remove(key);
        return body;
    }

    private Map<String, Object> row(java.sql.ResultSet rs, int index) throws java.sql.SQLException {
        try {
            Map<String, Object> body = mapper.readValue(rs.getString("payload"), new TypeReference<LinkedHashMap<String, Object>>() { });
            body.put("id", rs.getString("record_id")); body.put("version", rs.getLong("version"));
            body.put("createdAt", rs.getString("created_at")); body.put("updatedAt", rs.getString("updated_at"));
            return body;
        } catch (java.io.IOException e) { throw new IllegalStateException("저장된 JSON을 읽을 수 없습니다.", e); }
    }

    private String encode(Map<String, Object> body) {
        try {
            String json = mapper.writeValueAsString(body);
            if (json.getBytes(StandardCharsets.UTF_8).length > 131072) FeatureInput.fail("기록 크기는 최대 128 KiB입니다.");
            return json;
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalArgumentException("JSON 형식이 올바르지 않습니다."); }
    }
    private void conflict(String owner, FeatureType type, String id) {
        get(owner, type, id); throw new ApiException(ErrorCode.CONFLICT, "다른 요청에서 변경되었습니다. 다시 조회해주세요.");
    }
}
