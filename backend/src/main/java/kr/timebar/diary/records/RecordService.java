// 개인 기록의 생성·수정·날짜별 저장과 금액 집계를 처리한다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
public class RecordService {
    private final FeatureStore store;
    public RecordService(FeatureStore store) { this.store = store; }

    public FeaturePage list(String user, FeatureType type, String from, String to, String q, String category, int page, int size) {
        return FeaturePage.of(store.all(user, type), from, to, q, category, page, size);
    }
    public Map<String, Object> get(String user, FeatureType type, String id) { return store.get(user, type, id); }
    public Map<String, Object> create(String user, FeatureType type, Map<String, Object> body) {
        Map<String, Object> data = FeatureInput.validate(type, body);
        if (type == FeatureType.MEMO && !data.containsKey("date")) data.put("date", LocalDate.now(java.time.ZoneId.of("Asia/Seoul")).toString());
        return store.create(user, type, data);
    }
    public Map<String, Object> update(String user, FeatureType type, String id, Map<String, Object> body) {
        return store.replace(user, type, id, FeatureInput.version(body), FeatureInput.validate(type, body));
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
