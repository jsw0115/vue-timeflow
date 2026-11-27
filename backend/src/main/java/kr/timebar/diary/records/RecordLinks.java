// 할 일·일정·실제 기록 사이의 연결을 계정별로 저장하고, 양쪽이 같은 계정의 기록인지 검사한다(PR-08, Q-12).
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.IdempotencyKeys;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class RecordLinks {
    public static final String TASK = "task", SCHEDULE = "schedule", ACTUAL = "actual";
    /** 커리어 활동과 그 근거 원본(PR-24, IM-15 4단계). 활동 → 일정·실제 기록·WBS 작업 방향으로 저장한다. */
    public static final String ACTIVITY = "activity", WBS = "wbs";
    /** 지원 건과 거기에 제출한 문서 버전(PR-25). 지원 → 문서 버전 방향으로 저장한다. */
    public static final String APPLICATION = "application", DOC_VERSION = "doc-version";
    private static final Set<String> KINDS = Set.of(TASK, SCHEDULE, ACTUAL);
    private final JdbcTemplate jdbc;
    private final FeatureStore store;
    private final IdempotencyKeys idempotency;

    public RecordLinks(JdbcTemplate jdbc, FeatureStore store, IdempotencyKeys idempotency) { this.jdbc = jdbc; this.store = store; this.idempotency = idempotency; }

    /** 이 계정의 기록이면 제목을 돌려준다. 없거나 다른 계정의 기록이면 같은 404라 다른 계정의 기록이 있는지 드러나지 않는다. */
    @Transactional(readOnly = true)
    public String requireTitle(String owner, String kind, String id) {
        return title(owner, kind, id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    /** 두 기록이 모두 이 계정의 것일 때만 연결한다. 이미 있는 연결이면 그대로 둔다. */
    public void link(String owner, String sourceKind, String sourceId, String targetKind, String targetId) {
        requireTitle(owner, sourceKind, sourceId); requireTitle(owner, targetKind, targetId);
        try {
            jdbc.update("INSERT INTO record_link(owner_id,source_kind,source_id,target_kind,target_id,created_at) VALUES (?,?,?,?,?,?)",
                    owner, sourceKind, sourceId, targetKind, targetId, Timestamp.from(Instant.now()));
        } catch (DuplicateKeyException ignored) { /* 같은 연결이 이미 있다 */ }
    }

    /** 한 기록에 연결된 기록을 방향과 함께 돌려준다. 기록 자체가 이 계정의 것이 아니면 404다. */
    @Transactional(readOnly = true)
    public List<Map<String,Object>> of(String owner, String kind, String id) {
        requireTitle(owner, kind, id);
        var result = new ArrayList<Map<String,Object>>();
        for (var row : jdbc.queryForList("SELECT source_kind,source_id,target_kind,target_id FROM record_link WHERE owner_id=? AND (source_kind=? AND source_id=? OR target_kind=? AND target_id=?) ORDER BY created_at,source_id,target_id",
                owner, kind, id, kind, id)) {
            boolean outgoing = kind.equals(value(row, "source_kind")) && id.equals(value(row, "source_id"));
            String otherKind = value(row, outgoing ? "target_kind" : "source_kind"), otherId = value(row, outgoing ? "target_id" : "source_id");
            // 지우면서 연결도 함께 지우므로 보통은 없지만, 남은 연결이 있어도 사라진 기록은 보이지 않는다
            title(owner, otherKind, otherId).ifPresent(title -> result.add(Map.of("kind", otherKind, "id", otherId, "title", title, "direction", outgoing ? "target" : "source")));
        }
        return result;
    }

    /**
     * 기록을 지울 때 그 기록이 들어간 연결만 지운다. 연결된 다른 기록은 남는다(UF-93).
     * 커리어 활동의 근거 연결은 남겨, 활동 화면이 "지워진 원본"(깨진 출처)으로 보이게 한다(docs/design 04 FD-85~87). 활동 자신을 지울 때는 모두 지운다.
     */
    public void forget(String owner, String kind, String id) {
        if (ACTIVITY.equals(kind)) {
            jdbc.update("DELETE FROM record_link WHERE owner_id=? AND (source_kind=? AND source_id=? OR target_kind=? AND target_id=?)", owner, kind, id, kind, id);
            return;
        }
        jdbc.update("DELETE FROM record_link WHERE owner_id=? AND (source_kind=? AND source_id=? AND target_kind<>? OR target_kind=? AND target_id=? AND source_kind<>?)", owner, kind, id, ACTIVITY, kind, id, ACTIVITY);
    }

    /** 일정을 지우고 그 일정의 연결도 같은 트랜잭션에서 지운다. 일정에서 시작한 실제 기록은 남는다. */
    public void deleteSchedule(String owner, String id, long version) {
        store.delete(owner, FeatureType.SCHEDULE, id, version);
        forget(owner, SCHEDULE, id);
    }

    /** 할 일을 일정에 배치한다. 제목을 비우면 할 일 제목을 복사하고, 그 뒤 할 일 제목을 바꿔도 일정 제목은 그대로다(UF-90). */
    public Map<String,Object> placeTask(String owner, String taskId, Map<String,Object> body, String idempotencyKey) {
        if (body == null) FeatureInput.fail("요청 본문이 필요합니다.");
        var request = new LinkedHashMap<String,Object>(); request.put("taskId", taskId); request.put("schedule", body);
        return idempotency.create(owner, idempotencyKey, request, () -> {
            // 할 일 행을 잠가 배치하는 동안 할 일이 지워지지 않게 한다
            String title = jdbc.queryForList("SELECT title FROM task WHERE id=? AND user_id=? AND d_at IS NULL FOR UPDATE", String.class, taskId, owner)
                    .stream().findFirst().orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
            var data = new LinkedHashMap<>(body);
            if (FeatureInput.text(data, "title").isBlank()) data.put("title", title);
            var schedule = store.create(owner, FeatureType.SCHEDULE, FeatureInput.validate(FeatureType.SCHEDULE, data));
            link(owner, TASK, taskId, SCHEDULE, schedule.get("id").toString());
            return schedule;
        }, row -> row.get("id").toString(), id -> store.get(owner, FeatureType.SCHEDULE, id));
    }

    public static void requireKind(String kind) { if (!KINDS.contains(kind)) FeatureInput.fail("kind는 task, schedule, actual 중 하나입니다."); }

    /** 연결된 기록의 제목. 없거나 다른 계정의 기록이면 비어 있다. */
    public Optional<String> title(String owner, String kind, String id) {
        if (id == null || id.isBlank() || id.length() > 100) return Optional.empty();
        return switch (kind) {
            case TASK -> jdbc.queryForList("SELECT title FROM task WHERE id=? AND user_id=? AND d_at IS NULL", String.class, id, owner).stream().findFirst();
            case SCHEDULE -> store.optional(owner, FeatureType.SCHEDULE, id).map(row -> Objects.toString(row.get("title"), ""));
            case ACTUAL -> store.optional(owner, FeatureType.ACTUAL_SESSION, id).map(row -> Objects.toString(row.get("title"), ""));
            case ACTIVITY -> store.optional(owner, FeatureType.CAREER_ACTIVITY, id).map(row -> Objects.toString(row.get("title"), ""));
            case WBS -> store.optional(owner, FeatureType.WBS, id).map(row -> Objects.toString(row.get("title"), ""));
            case APPLICATION -> store.optional(owner, FeatureType.JOB_APPLICATION, id).map(row -> Objects.toString(row.get("title"), ""));
            case DOC_VERSION -> store.optional(owner, FeatureType.DOC_VERSION, id).map(kr.timebar.diary.career.DocumentVersions::title);
            default -> Optional.empty();
        };
    }

    /** queryForList의 행은 열 이름의 대소문자를 가리지 않는다. */
    private static String value(Map<String,Object> row, String column) { return Objects.toString(row.get(column), ""); }
}
