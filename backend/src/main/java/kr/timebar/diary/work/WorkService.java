// 비공개 업무 기록과 위키·WBS 계층 및 수정 이력을 관리한다.
package kr.timebar.diary.work;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional
public class WorkService {
    private final FeatureStore store;
    public WorkService(FeatureStore store) { this.store = store; }

    public Map<String, Object> create(String user, FeatureType type, Map<String, Object> body) {
        var data = FeatureInput.validate(type, body);
        parent(user, type, null, data);
        return store.create(user, type, data);
    }

    public Map<String, Object> update(String user, FeatureType type, String id, Map<String, Object> body) {
        if (type == FeatureType.WIKI && id.contains("@")) throw new ApiException(ErrorCode.NOT_FOUND);
        var old = store.lock(user, type, id);
        long version = FeatureInput.version(body);
        if (((Number) old.get("version")).longValue() != version) throw new ApiException(ErrorCode.CONFLICT);
        var data = FeatureInput.validate(type, body);
        parent(user, type, id, data);
        if (type == FeatureType.WIKI) {
            store.create(user, FeatureType.WIKI, id + "@" + version, FeatureStore.payload(old));
        }
        return store.replace(user, type, id, version, data);
    }

    public void delete(String user, FeatureType type, String id, long version) {
        // 부모를 먼저 삭제해 새 자식 추가 요청과 동일한 잠금 순서를 유지한다.
        if (type == FeatureType.WIKI && id.contains("@")) throw new ApiException(ErrorCode.NOT_FOUND);
        var old = store.lock(user, type, id);
        if (((Number) old.get("version")).longValue() != version) throw new ApiException(ErrorCode.CONFLICT);
        List<Map<String, Object>> rows = current(user, type);
        if (type == FeatureType.WBS) {
            Set<String> doomed = new HashSet<>(); doomed.add(id);
            boolean changed;
            do {
                changed = false;
                for (var row : rows) if (doomed.contains(row.get("parentId")) && doomed.add(row.get("id").toString())) changed = true;
            } while (changed);
            for (var row : rows) if (doomed.contains(row.get("id"))) store.delete(user, type, row.get("id").toString(), ((Number) row.get("version")).longValue());
        } else {
            if (type == FeatureType.WIKI) for (var row : rows) if (id.equals(row.get("parentId"))) {
                var data = FeatureStore.payload(row); data.put("parentId", old.get("parentId"));
                store.replace(user, type, row.get("id").toString(), ((Number) row.get("version")).longValue(), data);
            }
            store.delete(user, type, id, version);
        }
    }

    public List<Map<String, Object>> current(String user, FeatureType type) {
        return store.all(user, type).stream().filter(row -> !row.get("id").toString().contains("@")).toList();
    }

    public List<Map<String, Object>> history(String user, String id) {
        store.get(user, FeatureType.WIKI, id);
        return store.all(user, FeatureType.WIKI).stream().filter(row -> row.get("id").toString().startsWith(id + "@")).toList();
    }

    public Map<String, Object> wbs(String user) {
        List<Map<String, Object>> rows = current(user, FeatureType.WBS);
        Map<String, List<Map<String, Object>>> children = new HashMap<>();
        for (var row : rows) children.computeIfAbsent(Objects.toString(row.get("parentId"), ""), key -> new ArrayList<>()).add(row);
        double totalMd = 0, weighted = 0;
        List<Map<String, Object>> result = new ArrayList<>();
        for (var root : children.getOrDefault("", List.of())) {
            double[] value = rollup(root, children, result, 0);
            totalMd += value[0]; weighted += value[0] * value[1];
        }
        return Map.of("items", result, "totalMd", totalMd, "totalProgress", totalMd == 0 ? 0 : Math.round(weighted / totalMd));
    }

    private double[] rollup(Map<String, Object> row, Map<String, List<Map<String, Object>>> children, List<Map<String, Object>> result, int depth) {
        if (depth > 100) throw new ApiException(ErrorCode.CONFLICT, "WBS 계층 깊이를 확인해주세요.");
        List<Map<String, Object>> kids = children.getOrDefault(row.get("id").toString(), List.of());
        double md = 0, weighted = 0, progress;
        if (kids.isEmpty()) { md = ((Number) row.get("md")).doubleValue(); progress = ((Number) row.get("progress")).doubleValue(); }
        else {
            for (var child : kids) { double[] value = rollup(child, children, result, depth + 1); md += value[0]; weighted += value[0] * value[1]; }
            progress = md == 0 ? 0 : weighted / md;
        }
        var data = new LinkedHashMap<>(row); data.put("rollupMd", md); data.put("rollupProgress", Math.round(progress)); result.add(data);
        return new double[] {md, progress};
    }

    private void parent(String user, FeatureType type, String id, Map<String, Object> data) {
        if (type != FeatureType.WIKI && type != FeatureType.WBS) return;
        String parent = FeatureInput.text(data, "parentId");
        if (parent.isBlank()) { data.put("parentId", null); return; }
        Set<String> visited = new HashSet<>();
        while (!parent.isEmpty()) {
            if (parent.contains("@") || parent.equals(id) || !visited.add(parent) || visited.size() > 100) FeatureInput.fail("부모 계층이 순환하거나 너무 깊습니다.");
            var row = store.lock(user, type, parent);
            parent = FeatureInput.text(row, "parentId");
        }
    }
}
