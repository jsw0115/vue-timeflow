// 주소록 연락처의 계정 연결·해제와, 일반 저장에서 연결 값을 서버만 정하는지 검사한다(Q-21).
package kr.timebar.diary.records;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.auth.UserRole;
import kr.timebar.diary.auth.UserStatus;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(FeatureTestConfig.class)
class ContactAccountsTest {
    @Autowired RecordService records;
    @Autowired ContactAccounts accounts;
    @Autowired UserRepository users;
    String me, friend, friendEmail;

    @BeforeEach void setup() {
        me = account("me").getId();
        var other = account("friend"); friend = other.getId(); friendEmail = other.getEmail();
    }

    private UserEntity account(String name) {
        String email = name + "-" + UUID.randomUUID() + "@example.test";
        var user = new UserEntity(email, name, "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        when(users.findByEmail(email)).thenReturn(Optional.of(user));
        return user;
    }

    /** 연결은 연락처 이메일로 찾은 계정 ID·닉네임을 서버가 넣고, 해제하면 지운다. */
    @Test void linkUsesTheContactEmailAndUnlinkRemovesIt() {
        var contact = records.create(me, FeatureType.CONTACT, new HashMap<>(Map.of("name", "친구", "email", friendEmail)));
        var linked = accounts.link(me, contact.get("id").toString(), Map.of("version", contact.get("version")));
        assertEquals(friend, linked.get("accountId"));
        assertEquals("friend", linked.get("accountNickname"));
        assertEquals("친구", linked.get("name"));
        var unlinked = accounts.unlink(me, contact.get("id").toString(), ((Number) linked.get("version")).longValue());
        assertNull(unlinked.get("accountId"));
        assertNull(unlinked.get("accountNickname"));
    }

    /** 클라이언트가 보낸 accountId는 쓰지 않는다. 수정 때는 연결을 지키고, 이메일이 바뀌면 끊는다. */
    @Test void plainSavesNeverSetTheLinkAndEmailChangeDropsIt() {
        var forged = records.create(me, FeatureType.CONTACT, new HashMap<>(Map.of("name", "가짜", "email", "x@example.test", "accountId", friend)));
        assertNull(forged.get("accountId"));
        var contact = records.create(me, FeatureType.CONTACT, new HashMap<>(Map.of("name", "친구", "email", friendEmail)));
        var linked = accounts.link(me, contact.get("id").toString(), Map.of("version", contact.get("version")));
        var renamed = records.update(me, FeatureType.CONTACT, contact.get("id").toString(), new HashMap<>(Map.of("name", "오랜 친구", "email", friendEmail, "accountId", "someone-else", "version", linked.get("version"))));
        assertEquals(friend, renamed.get("accountId"));
        var moved = records.update(me, FeatureType.CONTACT, contact.get("id").toString(), new HashMap<>(Map.of("name", "오랜 친구", "email", "new@example.test", "version", renamed.get("version"))));
        assertNull(moved.get("accountId"));
    }

    /** 이메일이 없거나 가입 계정이 없으면 연결하지 않는다(없는 계정은 찾기와 같은 404). */
    @Test void linkNeedsAnEmailThatBelongsToAnAccount() {
        var noEmail = records.create(me, FeatureType.CONTACT, new HashMap<>(Map.of("name", "이메일 없음")));
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> accounts.link(me, noEmail.get("id").toString(), Map.of("version", noEmail.get("version")))).errorCode());
        var stranger = records.create(me, FeatureType.CONTACT, new HashMap<>(Map.of("name", "모름", "email", "nobody@example.test")));
        when(users.findByEmail("nobody@example.test")).thenReturn(Optional.empty());
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> accounts.link(me, stranger.get("id").toString(), Map.of("version", stranger.get("version")))).errorCode());
    }
}
