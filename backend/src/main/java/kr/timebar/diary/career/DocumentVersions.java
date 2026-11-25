// 이력서·경력기술서·포트폴리오의 지금 저장된 내용을 고정한 문서 버전과, 지원 건에 제출한 버전 연결(PR-25, IM-15 5단계).
// 원본을 나중에 고쳐도 버전 내용은 바뀌지 않는다(개편안 REQ-F36). 지원에 연결된 버전은 지울 수 없다.
package kr.timebar.diary.career;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.records.RecordLinks;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional
public class DocumentVersions {
    /** 버전으로 고정할 수 있는 문서. 자기소개서는 PR-25 후속(Q-41)에서 더했다. */
    public static final List<String> DOCUMENTS = List.of("resume", "career", "portfolio", "cover-letter");
    private static final Map<String, String> NAMES = Map.of("resume", "이력서", "career", "경력기술서", "portfolio", "포트폴리오", "cover-letter", "자기소개서");
    /** 문서마다 남길 수 있는 버전 수. 원문에 없는 제안값이다. */
    public static final int MAX_VERSIONS = 100;
    public static final int MAX_LABEL = 100, MAX_NOTE = 500;
    /** 버전 언어 표시(PR-32, 09 Q-38 (3)). 원문을 번역으로 덮어쓰지 않고 언어별 버전을 따로 남긴다. 예전 버전은 ko로 본다. */
    public static final List<String> LANGUAGES = List.of("ko", "en");
    public static final String DEFAULT_LANGUAGE = "ko";
    private final FeatureStore store;
    private final RecordLinks links;
    private final JdbcTemplate jdbc;
    public DocumentVersions(FeatureStore store, RecordLinks links, JdbcTemplate jdbc) { this.store = store; this.links = links; this.jdbc = jdbc; }

    /** 목록·연결에 보일 이름. 이름표가 없으면 "이력서 v3"처럼 문서 이름과 번호다. */
    public static String title(Map<String, Object> row) {
        String label = Objects.toString(row.get("label"), "").trim();
        if (!label.isEmpty()) return label;
        return NAMES.getOrDefault(Objects.toString(row.get("document"), ""), "문서") + " v" + Objects.toString(row.get("number"), "");
    }

    /** 지금 저장된 문서 내용을 복사해 새 버전을 만든다. 저장된 내용이 없으면 만들지 않는다(409). */
    public Map<String, Object> create(String owner, Map<String, Object> body) {
        if (body == null) FeatureInput.fail("요청 본문이 필요합니다.");
        FeatureInput.keys(body, Set.of("document", "label", "note", "language"));
        String document = FeatureInput.requiredText(body, "document");
        if (!DOCUMENTS.contains(document)) FeatureInput.fail("문서는 resume·career·portfolio·cover-letter 중 하나입니다.");
        String label = FeatureInput.text(body, "label").trim(), note = FeatureInput.text(body, "note").trim();
        if (body.get("label") != null && !(body.get("label") instanceof String)) FeatureInput.fail("label은 문자열이어야 합니다.");
        if (body.get("note") != null && !(body.get("note") instanceof String)) FeatureInput.fail("note는 문자열이어야 합니다.");
        if (label.length() > MAX_LABEL) FeatureInput.fail("버전 이름은 " + MAX_LABEL + "자까지예요.");
        if (note.length() > MAX_NOTE) FeatureInput.fail("바뀐 점 메모는 " + MAX_NOTE + "자까지예요.");
        if (body.get("language") != null && !(body.get("language") instanceof String)) FeatureInput.fail("language는 문자열이어야 합니다.");
        String language = body.get("language") == null ? DEFAULT_LANGUAGE : ((String) body.get("language")).trim();
        if (!LANGUAGES.contains(language)) FeatureInput.fail("언어는 ko·en 중 하나입니다.");
        var existing = rows(owner, document);
        if (existing.size() >= MAX_VERSIONS) throw new ApiException(ErrorCode.CONFLICT, NAMES.get(document) + " 버전은 " + MAX_VERSIONS + "개까지 남길 수 있어요. 쓰지 않는 버전을 먼저 지워 주세요.");
        int number = existing.stream().mapToInt(row -> ((Number) row.get("number")).intValue()).max().orElse(0) + 1;
        var data = new LinkedHashMap<String, Object>();
        data.put("document", document); data.put("number", number);
        if (!label.isEmpty()) data.put("label", label);
        if (!note.isEmpty()) data.put("note", note);
        data.put("language", language);
        data.put("content", content(owner, document));
        // 같은 번호를 두 요청이 함께 만들면 기본 키가 겹쳐 뒤 요청이 409로 끝난다
        return view(store.create(owner, FeatureType.DOC_VERSION, document + "-" + number, data), true);
    }

    /** 버전 목록(내용 없이). document를 주면 그 문서만, 번호가 큰 것부터다. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(String owner, String document) {
        if (document != null && !document.isBlank() && !DOCUMENTS.contains(document)) FeatureInput.fail("문서는 resume·career·portfolio·cover-letter 중 하나입니다.");
        var counts = attachedCounts(owner);
        return store.all(owner, FeatureType.DOC_VERSION).stream()
                .filter(row -> document == null || document.isBlank() || document.equals(row.get("document")))
                .sorted(Comparator.comparing((Map<String, Object> row) -> Objects.toString(row.get("document"), "")).thenComparing(row -> -((Number) row.get("number")).intValue()))
                .map(row -> withCount(view(row, false), counts)).toList();
    }

    /** 버전 하나를 내용과 함께 돌려준다. 없거나 다른 계정 것이면 404다. */
    @Transactional(readOnly = true)
    public Map<String, Object> get(String owner, String id) {
        return withCount(view(store.get(owner, FeatureType.DOC_VERSION, id), true), attachedCounts(owner));
    }

    /** 지원 건에 연결되지 않은 버전만 지운다. */
    public void delete(String owner, String id) {
        var row = store.get(owner, FeatureType.DOC_VERSION, id);
        if (attachedCounts(owner).getOrDefault(id, 0) > 0) throw new ApiException(ErrorCode.CONFLICT, "지원 기록에 제출본으로 연결한 버전은 지울 수 없어요. 지원 기록에서 먼저 빼 주세요.");
        store.delete(owner, FeatureType.DOC_VERSION, id, ((Number) row.get("version")).longValue());
        links.forget(owner, RecordLinks.DOC_VERSION, id);
    }

    /** 지원 건에 제출한 버전(내용 없이). 지원 건이 이 계정 것이 아니면 404다. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> attached(String owner, String applicationId) {
        links.requireTitle(owner, RecordLinks.APPLICATION, applicationId);
        var result = new ArrayList<Map<String, Object>>();
        for (String id : attachedIds(owner, applicationId)) {
            store.optional(owner, FeatureType.DOC_VERSION, id).ifPresentOrElse(row -> result.add(view(row, false)), () -> {
                var broken = new LinkedHashMap<String, Object>(); broken.put("id", id); broken.put("broken", true); result.add(broken);
            });
        }
        return result;
    }

    /** 지원 건에 버전을 제출본으로 잇는다. 같은 문서의 다른 버전이 이미 있으면 이 버전으로 바꾼다(지원마다 문서 종류별 하나). */
    public List<Map<String, Object>> attach(String owner, String applicationId, Map<String, Object> body) {
        if (body == null) FeatureInput.fail("요청 본문이 필요합니다.");
        FeatureInput.keys(body, Set.of("versionId"));
        String versionId = FeatureInput.requiredText(body, "versionId");
        links.requireTitle(owner, RecordLinks.APPLICATION, applicationId);
        var version = store.optional(owner, FeatureType.DOC_VERSION, versionId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        for (String id : attachedIds(owner, applicationId)) {
            if (id.equals(versionId)) continue;
            var other = store.optional(owner, FeatureType.DOC_VERSION, id);
            if (other.isEmpty() || version.get("document").equals(other.get().get("document"))) unlink(owner, applicationId, id);
        }
        links.link(owner, RecordLinks.APPLICATION, applicationId, RecordLinks.DOC_VERSION, versionId);
        return attached(owner, applicationId);
    }

    /** 제출본 연결 하나를 뺀다. 버전은 지우지 않는다. */
    public List<Map<String, Object>> detach(String owner, String applicationId, String versionId) {
        links.requireTitle(owner, RecordLinks.APPLICATION, applicationId);
        unlink(owner, applicationId, versionId);
        return attached(owner, applicationId);
    }

    private void unlink(String owner, String applicationId, String versionId) {
        jdbc.update("DELETE FROM record_link WHERE owner_id=? AND source_kind=? AND source_id=? AND target_kind=? AND target_id=?", owner, RecordLinks.APPLICATION, applicationId, RecordLinks.DOC_VERSION, versionId);
    }
    private List<String> attachedIds(String owner, String applicationId) {
        return jdbc.queryForList("SELECT target_id FROM record_link WHERE owner_id=? AND source_kind=? AND source_id=? AND target_kind=? ORDER BY created_at,target_id", String.class, owner, RecordLinks.APPLICATION, applicationId, RecordLinks.DOC_VERSION);
    }
    private Map<String, Integer> attachedCounts(String owner) {
        var counts = new HashMap<String, Integer>();
        for (var row : jdbc.queryForList("SELECT target_id, COUNT(*) AS n FROM record_link WHERE owner_id=? AND source_kind=? AND target_kind=? GROUP BY target_id", owner, RecordLinks.APPLICATION, RecordLinks.DOC_VERSION)) {
            String id = null; Number n = null;
            for (var entry : row.entrySet()) { if (entry.getKey().equalsIgnoreCase("target_id")) id = Objects.toString(entry.getValue()); if (entry.getKey().equalsIgnoreCase("n")) n = (Number) entry.getValue(); }
            if (id != null && n != null) counts.put(id, n.intValue());
        }
        return counts;
    }
    private List<Map<String, Object>> rows(String owner, String document) {
        return store.all(owner, FeatureType.DOC_VERSION).stream().filter(row -> document.equals(row.get("document"))).toList();
    }

    /** 고정할 내용. 원본 기록의 ID를 함께 남겨 어느 기록에서 왔는지 알 수 있게 한다(REQ-F28 원천 기록 참조 보존). */
    private Map<String, Object> content(String owner, String document) {
        var content = new LinkedHashMap<String, Object>();
        if (document.equals("resume")) {
            var resume = store.optional(owner, FeatureType.RESUME, "default").orElseThrow(() -> new ApiException(ErrorCode.CONFLICT, "저장한 이력서가 없어요. 이력서를 먼저 저장해 주세요."));
            content.put("resume", FeatureStore.payload(resume));
            content.put("sourceVersion", resume.get("version"));
            return content;
        }
        if (document.equals("cover-letter")) {
            var letter = store.optional(owner, FeatureType.COVER_LETTER, "default").orElseThrow(() -> new ApiException(ErrorCode.CONFLICT, "저장한 자기소개서가 없어요. 자기소개서를 먼저 저장해 주세요."));
            content.put("coverLetter", FeatureStore.payload(letter));
            content.put("sourceVersion", letter.get("version"));
            return content;
        }
        var type = document.equals("career") ? FeatureType.CAREER : FeatureType.PORTFOLIO;
        var items = new ArrayList<Map<String, Object>>();
        for (var row : store.all(owner, type)) {
            var item = new LinkedHashMap<String, Object>(); item.put("id", row.get("id")); item.put("sourceVersion", row.get("version"));
            item.putAll(FeatureStore.payload(row)); items.add(item);
        }
        if (items.isEmpty()) throw new ApiException(ErrorCode.CONFLICT, "저장한 " + NAMES.get(document) + " 항목이 없어요. 먼저 항목을 추가해 주세요.");
        content.put("items", items);
        return content;
    }
    private static Map<String, Object> view(Map<String, Object> row, boolean withContent) {
        var result = new LinkedHashMap<String, Object>();
        for (String key : List.of("id", "document", "number", "label", "note", "createdAt")) if (row.get(key) != null) result.put(key, row.get(key));
        result.put("title", title(row));
        Object language = row.get("language");
        result.put("language", language != null && LANGUAGES.contains(language) ? language : DEFAULT_LANGUAGE);
        if (withContent) result.put("content", row.get("content"));
        return result;
    }
    private static Map<String, Object> withCount(Map<String, Object> view, Map<String, Integer> counts) {
        view.put("applicationCount", counts.getOrDefault(Objects.toString(view.get("id")), 0));
        return view;
    }
}
