// 주소록 연락처와 가입 계정의 연결(Q-21). 연결은 연락처 이메일을 정확 일치로 찾아 서버만 정하고, 이메일이 바뀌면 끊는다.
package kr.timebar.diary.records;

import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.social.PeopleFinder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional
public class ContactAccounts {
    static final String ACCOUNT = "accountId", NICKNAME = "accountNickname";
    private final FeatureStore store;
    private final PeopleFinder people;
    public ContactAccounts(FeatureStore store, PeopleFinder people) { this.store = store; this.people = people; }

    /** 연락처 이메일과 같은 활성 계정을 찾아 연결한다. 없거나 차단·자기 자신이면 PeopleFinder와 같은 404, 너무 자주 찾으면 429다. */
    public Map<String,Object> link(String user, String id, Map<String,Object> body) {
        var contact = store.get(user, FeatureType.CONTACT, id);
        String email = Objects.toString(contact.get("email"), "");
        if (email.isBlank()) FeatureInput.fail("계정과 연결하려면 연락처에 이메일이 필요해요.");
        var found = people.find(user, email);
        var data = fields(contact);
        data.put(ACCOUNT, found.get("id")); data.put(NICKNAME, found.get("nickname"));
        return store.replace(user, FeatureType.CONTACT, id, FeatureInput.version(body), data);
    }

    public Map<String,Object> unlink(String user, String id, long version) {
        var data = fields(store.get(user, FeatureType.CONTACT, id));
        data.remove(ACCOUNT); data.remove(NICKNAME);
        return store.replace(user, FeatureType.CONTACT, id, version, data);
    }

    /**
     * 일반 저장(만들기·수정)에서 연결 값은 클라이언트가 보낸 것을 쓰지 않는다. 수정이면 이전 연결을 지키되, 이메일이 바뀌었으면 끊는다.
     * previous는 수정 전 저장값(새로 만들 때 null), data는 검증을 마친 요청 값이다.
     */
    public static Map<String,Object> prepare(Map<String,Object> previous, Map<String,Object> data) {
        var result = new LinkedHashMap<String,Object>(data);
        result.remove(ACCOUNT); result.remove(NICKNAME);
        if (previous != null && previous.get(ACCOUNT) != null && Objects.equals(previous.get("email"), result.get("email"))) {
            result.put(ACCOUNT, previous.get(ACCOUNT));
            if (previous.get(NICKNAME) != null) result.put(NICKNAME, previous.get(NICKNAME));
        }
        return result;
    }

    /** 저장값에서 기록 메타 정보(id·version·시각)를 뺀 필드만 남긴다. */
    private static Map<String,Object> fields(Map<String,Object> row) {
        var data = new LinkedHashMap<String,Object>();
        for (String key : FeatureType.CONTACT.fields()) if (row.get(key) != null) data.put(key, row.get(key));
        return data;
    }
}
