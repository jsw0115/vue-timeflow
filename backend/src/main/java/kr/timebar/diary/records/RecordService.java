// 개인 기록의 생성·수정·날짜별 저장과 금액 집계를 처리한다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.IdempotencyKeys;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
public class RecordService {
    private final FeatureStore store;
    private final IdempotencyKeys idempotency;
    private final RoutineRules routines;
    public RecordService(FeatureStore store, IdempotencyKeys idempotency) { this(store, idempotency, null); }
    @org.springframework.beans.factory.annotation.Autowired
    public RecordService(FeatureStore store, IdempotencyKeys idempotency, RoutineRules routines) { this.store = store; this.idempotency = idempotency; this.routines = routines; }

    public FeaturePage list(String user, FeatureType type, String from, String to, String q, String category, int page, int size) {
        return FeaturePage.of(store.all(user, type), from, to, q, category, page, size);
    }
    public Map<String, Object> get(String user, FeatureType type, String id) { return store.get(user, type, id); }
    public Map<String, Object> create(String user, FeatureType type, Map<String, Object> body) {
        Map<String, Object> data = FeatureInput.validate(type, body);
        if (type == FeatureType.MEMO && !data.containsKey("date")) data.put("date", LocalDate.now(java.time.ZoneId.of("Asia/Seoul")).toString());
        if (type == FeatureType.ROUTINE_RECORD && routines != null) data = routines.prepare(user, null, data);
        // 연락처의 계정 연결은 연결 API(ContactAccounts.link)로만 정한다(Q-21)
        if (type == FeatureType.CONTACT) data = ContactAccounts.prepare(null, data);
        return store.create(user, type, data);
    }
    /** 멱등 키가 있으면 같은 키로 다시 온 요청에 처음 만든 기록을 돌려준다(로컬 자료 이전, Q-13). */
    public Map<String, Object> create(String user, FeatureType type, Map<String, Object> body, String idempotencyKey) {
        return idempotency.create(user, idempotencyKey, body, () -> create(user, type, body), row -> row.get("id").toString(), id -> get(user, type, id));
    }
    public Map<String, Object> update(String user, FeatureType type, String id, Map<String, Object> body) {
        Map<String, Object> data = FeatureInput.validate(type, body);
        // 루틴은 수정 전 저장값과 비교해 지난 날짜 쉬는 날·중지 기간을 서버가 정한다(Q-19·Q-20)
        if (type == FeatureType.ROUTINE_RECORD && routines != null) data = routines.prepare(user, store.get(user, type, id), data);
        if (type == FeatureType.CONTACT) data = ContactAccounts.prepare(store.get(user, type, id), data);
        return store.replace(user, type, id, FeatureInput.version(body), data);
    }
    /** 멱등 키가 있으면 응답을 잃어 다시 보낸 같은 수정에 처음 결과의 기록을 돌려준다(PR-12). 키는 수정할 기록 ID와 함께 해시한다. */
    public Map<String, Object> update(String user, FeatureType type, String id, Map<String, Object> body, String idempotencyKey) {
        var request = new LinkedHashMap<String, Object>(); request.put("id", id); request.put("body", body);
        return idempotency.apply(user, idempotencyKey, request, 200, () -> update(user, type, id, body), row -> row.get("id").toString(), recordId -> get(user, type, recordId));
    }
    public void delete(String user, FeatureType type, String id, long version) { store.delete(user, type, id, version); }

    public Map<String, Object> saveDate(String user, FeatureType type, String date, Map<String, Object> body) {
        FeatureInput.date(date);
        Map<String, Object> data = new LinkedHashMap<>(body); data.put("date", date);
        Map<String, Object> validated = FeatureInput.validate(type, data);
        if (store.optional(user, type, date).isEmpty()) return store.create(user, type, date, validated);
        return store.replace(user, type, date, FeatureInput.version(body), validated);
    }

    public Map<String, Object> moneySummary(String user, String from, String to) {
        FeaturePage page = list(user, FeatureType.MONEY, from, to, null, null, 0, 100);
        List<Map<String, Object>> rows = store.all(user, FeatureType.MONEY);
        long income = 0, expense = 0;
        Map<String, Long> categories = new TreeMap<>();
        for (var row : rows) {
            String date = FeatureInput.text(row, "date");
            if (from != null && date.compareTo(from) < 0 || to != null && date.compareTo(to) > 0) continue;
            long amount = ((Number) row.get("amount")).longValue();
            if (amount > 0) income += amount;
            else { expense -= amount; categories.merge(FeatureInput.text(row, "category"), -amount, Long::sum); }
        }
        return Map.of("income", income, "expense", expense, "balance", income - expense, "categories", categories, "count", page.total());
    }

    public List<Map<String, Object>> calendar(String user, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1), end = start.plusMonths(1).minusDays(1);
        Map<String, Long> days = new TreeMap<>();
        for (var row : store.all(user, FeatureType.DIARY)) {
            String date = FeatureInput.text(row, "date");
            if (date.compareTo(start.toString()) >= 0 && date.compareTo(end.toString()) <= 0) days.merge(date, 1L, Long::sum);
        }
        return days.entrySet().stream().map(e -> Map.<String, Object>of("date", e.getKey(), "count", e.getValue())).toList();
    }

    public Map<String, Object> setRead(String user, String id) {
        var row = store.lock(user, FeatureType.NOTIFICATION, id);
        if (Boolean.TRUE.equals(row.get("read"))) return row;
        var body = FeatureStore.payload(row); body.put("read", true);
        return store.replace(user, FeatureType.NOTIFICATION, id, ((Number) row.get("version")).longValue(), body);
    }
    public void readAll(String user) { for (var row : store.all(user, FeatureType.NOTIFICATION)) setRead(user, row.get("id").toString()); }
}
