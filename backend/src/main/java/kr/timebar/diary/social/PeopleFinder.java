// 친구·공유 그룹에 초대할 사람을 이메일 정확 일치로 찾는다. 계정마다 1분에 20번까지만 찾을 수 있다(PR-10).
package kr.timebar.diary.social;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureInput;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PeopleFinder {
    static final int MAX_PER_WINDOW = 20;
    static final long WINDOW_MS = 60_000;
    private final UserRepository users;
    private final SocialService social;
    // 서버 한 대의 메모리에 둔다. 여러 대로 늘리면 공유 저장소로 옮겨야 한다
    private final Map<String, Deque<Long>> calls = new ConcurrentHashMap<>();

    public PeopleFinder(UserRepository users, SocialService social) { this.users = users; this.social = social; }

    /**
     * 정확히 같은 이메일의 활성 계정 하나를 { id, nickname }으로 돌려준다. 자기 자신, 없는 계정, 서로 차단한 계정은 모두 같은 404라 차이가 드러나지 않는다.
     * 가입 여부를 대량으로 알아내지 못하게 횟수를 묶는다(429).
     */
    @Transactional(readOnly = true)
    public Map<String,Object> find(String user, String email) {
        limit(user);
        String value = email == null ? "" : email.trim();
        if (value.length() > 255 || !value.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) FeatureInput.fail("이메일을 확인해주세요.");
        UserEntity found = users.findByEmail(value).filter(UserEntity::isActive)
                .filter(account -> !account.getId().equals(user) && !social.blocked(user, account.getId()))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "그 이메일로 찾은 사람이 없어요."));
        return Map.of("id", found.getId(), "nickname", found.getNickname());
    }

    private void limit(String user) {
        long now = System.currentTimeMillis();
        Deque<Long> recent = calls.computeIfAbsent(user, key -> new ArrayDeque<>());
        synchronized (recent) {
            while (!recent.isEmpty() && now - recent.peekFirst() >= WINDOW_MS) recent.pollFirst();
            if (recent.size() >= MAX_PER_WINDOW) throw new ApiException(ErrorCode.RATE_LIMITED, "사람 찾기를 너무 자주 했어요. 1분 뒤에 다시 해 주세요.");
            recent.addLast(now);
        }
    }
}
