package kr.timebar.diary.chat.infrastructure;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.chat.application.ChatIdentity;
import kr.timebar.diary.chat.domain.ChatModels.Person;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import java.util.Locale;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "app.chat.enabled", havingValue = "true")
public class CoreChatIdentity implements ChatIdentity {
    private final UserRepository users;
    public CoreChatIdentity(UserRepository users) { this.users = users; }
    private boolean active(UserEntity user) { return user.isActive() && !Integer.valueOf(0).equals(user.getIsEnabled()); }
    @Override public Person requireActive(String id) {
        return users.findById(id).filter(this::active).map(u -> new Person(u.getId(), u.getNickname()))
                .orElseThrow(() -> new ApiException(ErrorCode.FORBIDDEN, "사용할 수 없는 계정입니다."));
    }
    @Override public Optional<Person> findByEmail(String email) {
        return users.findByEmail(email.trim().toLowerCase(Locale.ROOT)).filter(this::active)
                .map(u -> new Person(u.getId(), u.getNickname()));
    }
}
