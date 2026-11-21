// 커리어 활동 원장과 취업·이직 지원 기록을 계정 범위로 저장하고 연결 경력의 소유권을 확인한다.
package kr.timebar.diary.career;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.common.IdempotencyKeys;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class CareerService {
    static final Set<FeatureType> TYPES = Set.of(FeatureType.CAREER_ACTIVITY, FeatureType.JOB_APPLICATION);
    private final FeatureStore store;
    private final IdempotencyKeys idempotency;

    public CareerService(FeatureStore store, IdempotencyKeys idempotency) { this.store = store; this.idempotency = idempotency; }

    /** 멱등 키가 있으면 같은 키로 다시 온 요청에 처음 만든 기록을 돌려준다. */
    public Map<String, Object> create(String user, FeatureType type, Map<String, Object> body, String idempotencyKey) {
        return idempotency.create(user, idempotencyKey, body, () -> create(user, type, body), row -> row.get("id").toString(), id -> store.get(user, type, id));
    }

    public Map<String, Object> create(String user, FeatureType type, Map<String, Object> body) {
        var data = FeatureInput.validate(supported(type), body);
        experience(user, data);
        return store.create(user, type, data);
    }

    public Map<String, Object> update(String user, FeatureType type, String id, Map<String, Object> body) {
        var old = store.lock(user, supported(type), id);
        long version = FeatureInput.version(body);
        if (((Number) old.get("version")).longValue() != version) throw new ApiException(ErrorCode.CONFLICT);
        var data = FeatureInput.validate(type, body);
        experience(user, data);
        return store.replace(user, type, id, version, data);
    }

    public void delete(String user, FeatureType type, String id, long version) {
        store.get(user, supported(type), id);
        store.delete(user, type, id, version);
    }

    /**
     * 연결한 경력은 본인 경력(CAREER)이어야 한다. 요청 본문의 소유자 값은 믿지 않고 인증 계정으로 찾는다.
     * 없는 경력과 다른 계정의 경력은 같은 응답으로 거부해 존재 여부를 드러내지 않는다.
     */
    private void experience(String user, Map<String, Object> data) {
        String id = FeatureInput.text(data, "experienceId").trim();
        if (id.isEmpty()) { data.remove("experienceId"); return; }
        if (store.optional(user, FeatureType.CAREER, id).isEmpty()) FeatureInput.fail("연결할 경력을 찾을 수 없습니다.");
        data.put("experienceId", id);
    }

    private static FeatureType supported(FeatureType type) {
        if (!TYPES.contains(type)) throw new IllegalArgumentException("커리어 기록 종류가 아닙니다.");
        return type;
    }
}
