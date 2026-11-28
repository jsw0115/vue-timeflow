package kr.timebar.diary.chat.application;

import kr.timebar.diary.chat.domain.ChatModels.Person;
import java.util.Optional;

/** Only this port crosses the core identity boundary. No chat SQL references core tables. */
public interface ChatIdentity {
    Person requireActive(String userId);
    Optional<Person> findByEmail(String email);
    /** 두 계정 사이에 어느 쪽이든 차단이 있으면 true다. 차단 관계면 찾기·새 대화·개인 대화 메시지를 막는다. */
    boolean blocked(String userId, String otherId);
}
