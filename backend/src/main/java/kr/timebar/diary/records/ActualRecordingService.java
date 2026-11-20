// 플래너의 실제 기록과 집중 타이머를 서버 시각으로 시작·일시정지·재개하고 계정별 멱등 종료·취소와 복구를 제공한다.
package kr.timebar.diary.records;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.ChronoUnit;
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
        result.put("active", list(user).stream().filter(ActualRecordingService::active).findFirst().orElse(null));
        result.put("serverTime", Instant.now().toString());
        return result;
    }
    public Map<String,Object> start(String user, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("requestId", "title", "timeZone", "sourceKind", "sourceId", "mode", "targetMinutes"));
        String id = requestId(body, "requestId");
        String title = FeatureInput.requiredText(body, "title");
        if (title.length() > 200) FeatureInput.fail("기록 제목은 200자 이하입니다.");
        String zone = FeatureInput.requiredText(body, "timeZone");
        try { ZoneId.of(zone); } catch (DateTimeException e) { FeatureInput.fail("유효한 IANA 시간대가 필요합니다."); }
        // 할 일·일정에서 시작한 기록은 원본 종류와 ID를 남긴다(UF-91). 둘 다 보내거나 둘 다 빼야 한다
        String sourceKind = FeatureInput.text(body, "sourceKind"), sourceId = FeatureInput.text(body, "sourceId");
        if (sourceKind.isEmpty() != sourceId.isEmpty()) FeatureInput.fail("sourceKind와 sourceId는 함께 보내야 합니다.");
        if (!sourceKind.isEmpty() && !Set.of(RecordLinks.TASK, RecordLinks.SCHEDULE).contains(sourceKind)) FeatureInput.fail("sourceKind는 task 또는 schedule입니다.");
        // 집중 타이머는 모드와 목표 시간을 남긴다. 스톱워치·플래너 기록에는 목표 시간을 채우지 않는다(UF-120)
        RecordingTime.validateTimer(body);
        String mode = FeatureInput.text(body, "mode");
        Integer target = body.get("targetMinutes") instanceof Number number ? number.intValue() : null;
        lockAccount(user);
        var previous = store.optional(user, FeatureType.ACTUAL_SESSION, id);
        if (previous.isPresent()) {
            if (!title.equals(previous.get().get("title")) || !zone.equals(previous.get().get("timeZone"))
                    || !sourceKind.equals(FeatureInput.text(previous.get(), "sourceKind")) || !sourceId.equals(FeatureInput.text(previous.get(), "sourceId"))
                    || !mode.equals(FeatureInput.text(previous.get(), "mode")) || !Objects.equals(target, previous.get().get("targetMinutes") instanceof Number number ? number.intValue() : null)) conflict();
            return previous.get();
        }
        // 다른 계정의 할 일·일정이면 404이고 기록을 만들지 않는다(UT-145)
        if (!sourceKind.isEmpty()) links.requireTitle(user, sourceKind, sourceId);
        if (list(user).stream().anyMatch(ActualRecordingService::active))
            throw new ApiException(ErrorCode.CONFLICT, "진행 중인 기록을 먼저 복구해 종료해주세요.");
        var data = new LinkedHashMap<String,Object>(Map.of("title", title, "timeZone", zone, "state", "RUNNING", "startedAt", stamp().toString()));
        if (!mode.isEmpty()) data.put("mode", mode);
        if (target != null) data.put("targetMinutes", target);
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
        // 마지막 일시정지·재개보다 이른 종료는 음수 시간을 만들므로 받지 않는다(UF-122)
        if (end.isBefore(RecordingTime.lastBoundary(row))) FeatureInput.fail("종료 시각은 마지막 일시정지·재개 이후여야 합니다.");
        var data = FeatureStore.payload(row);
        // 일시정지한 채 끝내면 그 일시정지를 종료 시각에서 닫는다
        if ("PAUSED".equals(row.get("state"))) data.put("pauses", closeLast(row, end));
        data.put("state", "COMPLETED"); data.put("endedAt", end.toString()); data.put("finishKey", key);
        data.put("elapsedSeconds", RecordingTime.seconds(data));
        return store.replace(user, FeatureType.ACTUAL_SESSION, id, version, data);
    }
    /** 진행 중 기록을 서버 시각으로 일시정지한다. 일시정지 구간은 기록 시간에서 뺀다(UF-122). */
    public Map<String,Object> pause(String user, String id, Map<String,Object> body) {
        var row = command(user, id, body, "RUNNING", "진행 중인 기록만 일시정지할 수 있습니다.");
        var pauses = new ArrayList<Object>(row.get("pauses") instanceof List<?> list ? list : List.of());
        if (pauses.size() >= RecordingTime.MAX_PAUSES) FeatureInput.fail("일시정지는 한 기록에 " + RecordingTime.MAX_PAUSES + "번까지입니다.");
        Instant now = stamp();
        if (now.isBefore(RecordingTime.lastBoundary(row))) conflict();
        pauses.add(new LinkedHashMap<>(Map.of("from", now.toString())));
        var data = FeatureStore.payload(row);
        data.put("pauses", pauses); data.put("state", "PAUSED");
        return store.replace(user, FeatureType.ACTUAL_SESSION, id, FeatureInput.version(body), data);
    }
    /** 일시정지한 기록을 서버 시각으로 다시 시작한다. */
    public Map<String,Object> resume(String user, String id, Map<String,Object> body) {
        var row = command(user, id, body, "PAUSED", "일시정지한 기록만 다시 시작할 수 있습니다.");
        Instant now = stamp();
        if (now.isBefore(RecordingTime.lastBoundary(row))) conflict();
        var data = FeatureStore.payload(row);
        data.put("pauses", closeLast(row, now)); data.put("state", "RUNNING");
        return store.replace(user, FeatureType.ACTUAL_SESSION, id, FeatureInput.version(body), data);
    }
    /** 끝내지 않은 기록을 버린다. 기록과 원본 연결을 남기지 않는다(UT-215). 끝낸 기록은 취소할 수 없다. */
    public void cancel(String user, String id, Map<String,Object> body) {
        command(user, id, body, null, "끝낸 기록은 취소할 수 없습니다.");
        store.delete(user, FeatureType.ACTUAL_SESSION, id, FeatureInput.version(body));
        links.forget(user, RecordLinks.ACTUAL, id);
    }
    /** 일시정지·재개·취소 공통. 본인 기록을 잠그고 version과 상태를 확인한다. expected가 null이면 끝내지 않은 기록이면 된다. */
    private Map<String,Object> command(String user, String id, Map<String,Object> body, String expected, String message) {
        FeatureInput.keys(body, Set.of("version"));
        long version = FeatureInput.version(body);
        lockAccount(user);
        var row = store.lock(user, FeatureType.ACTUAL_SESSION, id);
        if (((Number)row.get("version")).longValue() != version) throw new ApiException(ErrorCode.CONFLICT, "기록이 다른 곳에서 바뀌었습니다. 기록 상태를 다시 확인해주세요.");
        if (expected == null ? !active(row) : !expected.equals(row.get("state"))) throw new ApiException(ErrorCode.CONFLICT, message);
        return row;
    }
    private static List<Object> closeLast(Map<String,Object> row, Instant at) {
        var pauses = new ArrayList<Object>((List<?>)row.get("pauses"));
        var last = new LinkedHashMap<String,Object>(FeatureInput.object(pauses.get(pauses.size() - 1)));
        last.put("to", at.toString());
        pauses.set(pauses.size() - 1, last);
        return pauses;
    }
    /**
     * 서버가 기록에 찍는 시각. 화면(JavaScript)은 밀리초까지만 계산하므로 밀리초로 자른다.
     * 그래야 화면이 계산한 목표 도달 시각·마지막 일시정지 시각으로 끝낼 때 1초 모자라거나 400이 되지 않는다(PR-09 2단계).
     */
    private static Instant stamp() { return Instant.now().truncatedTo(ChronoUnit.MILLIS); }
    /** 진행 중이거나 일시정지한 기록. 한 계정에 하나만 있을 수 있다. */
    private static boolean active(Map<String,Object> row) { return "RUNNING".equals(row.get("state")) || "PAUSED".equals(row.get("state")); }
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
