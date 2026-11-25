// 비공개 업무 기록과 위키·WBS 계층 및 수정 이력을 관리한다.
package kr.timebar.diary.work;

import kr.timebar.diary.feature.*;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.IdempotencyKeys;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional
public class WorkService {
    private final FeatureStore store;
    private final IdempotencyKeys idempotency;
    public WorkService(FeatureStore store, IdempotencyKeys idempotency) { this.store = store; this.idempotency = idempotency; }

    public Map<String, Object> create(String user, FeatureType type, Map<String, Object> body) {
        var data = FeatureInput.validate(type, body);
        parent(user, type, null, data);
        evidence(user, type, data);
        return store.create(user, type, data);
    }

    /** 멱등 키가 있으면 같은 키로 다시 온 요청에 처음 만든 기록을 돌려준다(로컬 자료 이전, Q-13). */
    public Map<String, Object> create(String user, FeatureType type, Map<String, Object> body, String idempotencyKey) {
        return idempotency.create(user, idempotencyKey, body, () -> create(user, type, body), row -> row.get("id").toString(), id -> store.get(user, type, id));
    }

    public Map<String, Object> update(String user, FeatureType type, String id, Map<String, Object> body) {
        if (type == FeatureType.WIKI && id.contains("@")) throw new ApiException(ErrorCode.NOT_FOUND);
        var old = store.lock(user, type, id);
        long version = FeatureInput.version(body);
        if (((Number) old.get("version")).longValue() != version) throw new ApiException(ErrorCode.CONFLICT);
        var data = FeatureInput.validate(type, body);
        parent(user, type, id, data);
        evidence(user, type, data);
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

    /**
     * 포트폴리오 근거(PR-26): 이 계정의 커리어 활동·경력만 남긴다. 지워졌거나 다른 계정의 ID는 저장할 때 빼서
     * 지워진 근거가 있어도 수정이 막히지 않고, 다른 계정 기록이 있는지도 드러나지 않는다. 중복 ID는 하나만 남긴다.
     */
    private void evidence(String user, FeatureType type, Map<String, Object> data) {
        if (type != FeatureType.PORTFOLIO) return;
        if (data.get("activityIds") instanceof List<?> ids) {
            var kept = new ArrayList<String>();
            for (Object id : ids) if (!kept.contains(id.toString()) && store.optional(user, FeatureType.CAREER_ACTIVITY, id.toString()).isPresent()) kept.add(id.toString());
            data.put("activityIds", kept);
        }
        String experience = FeatureInput.text(data, "experienceId").trim();
        if (experience.isEmpty() || store.optional(user, FeatureType.CAREER, experience).isEmpty()) data.remove("experienceId");
        else data.put("experienceId", experience);
    }

    private void parent(String user, FeatureType type, String id, Map<String, Object> data) {
        if (type != FeatureType.WIKI && type != FeatureType.WBS) return;
        String parent = FeatureInput.text(data, "parentId");
        if (parent.isBlank()) { data.put("parentId", null); return; }
        // 계층은 최대 100단계다(08 UF-51). 조상이 100개가 되면 101단계라 거부한다
        Set<String> visited = new HashSet<>();
        while (!parent.isEmpty()) {
            if (parent.contains("@") || parent.equals(id) || !visited.add(parent) || visited.size() >= 100) FeatureInput.fail("부모 계층이 순환하거나 100단계를 넘습니다.");
            var row = store.lock(user, type, parent);
            parent = FeatureInput.text(row, "parentId");
        }
    }
}
