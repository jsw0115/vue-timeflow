// 플래너의 실제 기록을 서버 시각으로 시작하고 계정별 멱등 종료와 복구를 제공한다.
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class ActualRecordingService {
    private final FeatureStore store;
    private final JdbcTemplate jdbc;
    private final RecordLinks links;

    public ActualRecordingService(FeatureStore store, JdbcTemplate jdbc, RecordLinks links) { this.store = store; this.jdbc = jdbc; this.links = links; }

    public List<Map<String,Object>> list(String user) { return store.all(user, FeatureType.ACTUAL_SESSION); }
    public Map<String,Object> get(String user, String id) { return store.get(user, FeatureType.ACTUAL_SESSION, id); }
    public Map<String,Object> current(String user) {
        var result = new LinkedHashMap<String,Object>();
        result.put("active", list(user).stream().filter(row -> "RUNNING".equals(row.get("state"))).findFirst().orElse(null));
        result.put("serverTime", Instant.now().toString());
        return result;
    }
    public Map<String,Object> start(String user, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("requestId", "title", "timeZone", "sourceKind", "sourceId"));
        String id = requestId(body, "requestId");
        String title = FeatureInput.requiredText(body, "title");
        if (title.length() > 200) FeatureInput.fail("기록 제목은 200자 이하입니다.");
        String zone = FeatureInput.requiredText(body, "timeZone");
        try { ZoneId.of(zone); } catch (DateTimeException e) { FeatureInput.fail("유효한 IANA 시간대가 필요합니다."); }
        // 할 일·일정에서 시작한 기록은 원본 종류와 ID를 남긴다(UF-91). 둘 다 보내거나 둘 다 빼야 한다
        String sourceKind = FeatureInput.text(body, "sourceKind"), sourceId = FeatureInput.text(body, "sourceId");
        if (sourceKind.isEmpty() != sourceId.isEmpty()) FeatureInput.fail("sourceKind와 sourceId는 함께 보내야 합니다.");
        if (!sourceKind.isEmpty() && !Set.of(RecordLinks.TASK, RecordLinks.SCHEDULE).contains(sourceKind)) FeatureInput.fail("sourceKind는 task 또는 schedule입니다.");
        lockAccount(user);
        var previous = store.optional(user, FeatureType.ACTUAL_SESSION, id);
        if (previous.isPresent()) {
            if (!title.equals(previous.get().get("title")) || !zone.equals(previous.get().get("timeZone"))
                    || !sourceKind.equals(FeatureInput.text(previous.get(), "sourceKind")) || !sourceId.equals(FeatureInput.text(previous.get(), "sourceId"))) conflict();
            return previous.get();
        }
        // 다른 계정의 할 일·일정이면 404이고 기록을 만들지 않는다(UT-145)
        if (!sourceKind.isEmpty()) links.requireTitle(user, sourceKind, sourceId);
        if (list(user).stream().anyMatch(row -> "RUNNING".equals(row.get("state"))))
            throw new ApiException(ErrorCode.CONFLICT, "진행 중인 기록을 먼저 복구해 종료해주세요.");
        var data = new LinkedHashMap<String,Object>(Map.of("title", title, "timeZone", zone, "state", "RUNNING", "startedAt", Instant.now().toString()));
        if (sourceKind.isEmpty()) return store.create(user, FeatureType.ACTUAL_SESSION, id, data);
        data.put("sourceKind", sourceKind); data.put("sourceId", sourceId);
        var created = store.create(user, FeatureType.ACTUAL_SESSION, id, data);
        links.link(user, sourceKind, sourceId, RecordLinks.ACTUAL, id);
        return created;
    }
    public Map<String,Object> finish(String user, String id, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("requestId", "version", "endedAt"));
        String key = requestId(body, "requestId");
        long version = FeatureInput.version(body);
        Instant end = FeatureInput.instant(FeatureInput.requiredText(body, "endedAt"));
        lockAccount(user);
        var row = store.lock(user, FeatureType.ACTUAL_SESSION, id);
        if ("COMPLETED".equals(row.get("state"))) {
            if (!key.equals(row.get("finishKey")) || !end.toString().equals(row.get("endedAt"))) conflict();
            return row;
        }
        Instant start = Instant.parse(row.get("startedAt").toString());
        if (end.isBefore(start) || end.isAfter(Instant.now().plusSeconds(5))) FeatureInput.fail("종료 시각은 기록 시작 이후이며 현재 시각을 넘을 수 없습니다.");
        var data = FeatureStore.payload(row);
        data.put("state", "COMPLETED"); data.put("endedAt", end.toString()); data.put("finishKey", key);
        data.put("elapsedSeconds", Duration.between(start, end).getSeconds());
        return store.replace(user, FeatureType.ACTUAL_SESSION, id, version, data);
    }
    private void lockAccount(String user) {
        if (jdbc.queryForList("SELECT id FROM users WHERE id=? FOR UPDATE", user).isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND);
    }
    private String requestId(Map<String,Object> body, String field) {
        String value = FeatureInput.requiredText(body, field);
        if (!value.matches("[a-zA-Z0-9_-]{16,80}")) FeatureInput.fail("요청 식별자는 16~80자의 영문·숫자·밑줄·하이픈입니다.");
        return value;
    }
    private void conflict() { throw new ApiException(ErrorCode.CONFLICT, "같은 요청 식별자에 다른 내용이 전달됐습니다."); }
}
