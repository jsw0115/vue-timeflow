package kr.timebar.diary.chat.application;

import kr.timebar.diary.chat.domain.ChatModels.Person;
import java.util.Optional;

/** Only this port crosses the core identity boundary. No chat SQL references core tables. */
public interface ChatIdentity {
    Person requireActive(String userId);
    Optional<Person> findByEmail(String email);
}
