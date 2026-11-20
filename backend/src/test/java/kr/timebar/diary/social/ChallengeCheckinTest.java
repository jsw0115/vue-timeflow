// 커뮤니티 챌린지 인증이 실제 기록으로 그 시간에 했는지 확인하고, 기록 공개 동의 범위를 지키는지 검증한다(PR-10 3b, Q-26).
package kr.timebar.diary.social;

import kr.timebar.diary.auth.*;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(FeatureTestConfig.class)
class ChallengeCheckinTest {
    static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    @Autowired SocialService social;
    @Autowired ChallengeService challenges;
    @Autowired FeatureStore store;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    String owner, runner, outsider, community;
    LocalDate yesterday;

    @BeforeEach void setup() {
        owner = account("방장"); runner = account("러너"); outsider = account("외부인");
        community = social.createSpace(owner, FeatureType.COMMUNITY, Map.of("title", "아침 러닝", "joinPolicy", "open", "visibility", "public", "capacity", 10)).get("id").toString();
        social.join(runner, FeatureType.COMMUNITY, community, Map.of());
        yesterday = LocalDate.now(SEOUL).minusDays(1);
    }
    private String account(String name) {
        var user = new UserEntity(UUID.randomUUID() + "@example.test", name, "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        return user.getId();
    }
    private String challenge(Map<String,Object> extra) {
        var body = new LinkedHashMap<String,Object>(Map.of("title", "아침 달리기", "startDate", yesterday.minusDays(1).toString(), "days", 10));
        body.putAll(extra);
        return challenges.create(owner, community, body).get("id").toString();
    }
    /** 실시간 기록 API로 시작·종료한 실제 기록과 같은 모양을 만든다. finishKey는 종료 API만 남긴다. */
    private String session(String user, LocalDate date, String from, String to, boolean live) {
        var data = new LinkedHashMap<String,Object>();
        Instant start = date.atTime(LocalTime.parse(from)).atZone(SEOUL).toInstant(), end = date.atTime(LocalTime.parse(to)).atZone(SEOUL).toInstant();
        data.put("title", "한강 러닝"); data.put("timeZone", "Asia/Seoul"); data.put("state", "COMPLETED");
        data.put("startedAt", start.toString()); data.put("endedAt", end.toString()); data.put("elapsedSeconds", Duration.between(start, end).getSeconds());
        if (live) data.put("finishKey", UUID.randomUUID().toString());
        return store.create(user, FeatureType.ACTUAL_SESSION, data).get("id").toString();
    }
    private ErrorCode error(Runnable action) { return assertThrows(ApiException.class, action::run).errorCode(); }

    /** 기록 확인 챌린지는 시간대 안에서 정한 분 이상 기록한 실시간 기록으로만 인증한다. */
    @Test void recordChallengeChecksTheWindowAndMinutes() {
        String c = challenge(Map.of("verify", "record", "minMinutes", 20, "windowStart", "06:00", "windowEnd", "08:00"));
        challenges.join(runner, community, c, Map.of());
        String day = yesterday.toString();
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> challenges.checkin(runner, community, c, day, Map.of())));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> challenges.checkin(runner, community, c, day, Map.of("sessionId", session(runner, yesterday, "05:00", "06:10", true)))));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> challenges.checkin(runner, community, c, day, Map.of("sessionId", session(runner, yesterday, "06:30", "07:00", false)))));
        assertEquals(ErrorCode.NOT_FOUND, error(() -> challenges.checkin(runner, community, c, day, Map.of("sessionId", session(owner, yesterday, "06:30", "07:00", true)))));
        var result = challenges.checkin(runner, community, c, day, Map.of("sessionId", session(runner, yesterday, "05:40", "06:40", true)));
        assertEquals("record", result.get("method"));
        assertEquals(40, ((Number)result.get("minutes")).intValue());
    }

    /** 일시정지한 시간은 인증 시간에서 뺀다(PR-09 UF-122). 06:30~07:00 기록이라도 06:40~06:55에 쉬었다면 15분이다. */
    @Test void pausedMinutesDoNotCountTowardCheckin() {
        Instant start = yesterday.atTime(6, 30).atZone(SEOUL).toInstant();
        var data = new LinkedHashMap<String,Object>(Map.of("title", "한강 러닝", "timeZone", "Asia/Seoul", "state", "COMPLETED", "mode", "stopwatch", "finishKey", UUID.randomUUID().toString(),
                "startedAt", start.toString(), "endedAt", start.plusSeconds(30 * 60).toString(), "elapsedSeconds", 15 * 60,
                "pauses", List.of(Map.of("from", start.plusSeconds(10 * 60).toString(), "to", start.plusSeconds(25 * 60).toString()))));
        String paused = store.create(runner, FeatureType.ACTUAL_SESSION, data).get("id").toString();
        String whole = challenge(Map.of("verify", "record", "minMinutes", 20));
        challenges.join(runner, community, whole, Map.of());
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> challenges.checkin(runner, community, whole, yesterday.toString(), Map.of("sessionId", paused))));
        // 06:00~06:45 시간대와 겹친 15분에서 06:40~06:45 일시정지 5분을 빼 10분이다
        String window = challenge(Map.of("verify", "record", "minMinutes", 5, "windowStart", "06:00", "windowEnd", "06:45"));
        challenges.join(runner, community, window, Map.of());
        assertEquals(10, ((Number)challenges.checkin(runner, community, window, yesterday.toString(), Map.of("sessionId", paused)).get("minutes")).intValue());
    }

    /** 시간대가 없는 기록 확인은 기록을 시작한 날짜에만 인증된다. 직접 인증 챌린지도 기록을 붙이면 기록 확인이 된다. */
    @Test void recordDateMustMatchAndSelfChallengeAcceptsRecords() {
        String record = challenge(Map.of("verify", "record", "minMinutes", 10));
        challenges.join(runner, community, record, Map.of());
        String other = session(runner, yesterday.minusDays(1), "21:00", "21:30", true);
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> challenges.checkin(runner, community, record, yesterday.toString(), Map.of("sessionId", other))));
        String self = challenge(Map.of());
        challenges.join(runner, community, self, Map.of());
        assertEquals("self", challenges.checkin(runner, community, self, yesterday.minusDays(1).toString(), Map.of()).get("method"));
        assertEquals("record", challenges.checkin(runner, community, self, yesterday.toString(), Map.of("sessionId", session(runner, yesterday, "21:00", "21:30", true))).get("method"));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> challenges.checkin(runner, community, self, LocalDate.now(SEOUL).plusDays(1).toString(), Map.of())));
    }

    /** 일반 챌린지에서는 다른 회원에게 인증 방식만 보이고, 기록 제목·시각은 본인만 본다. */
    @Test void ordinaryChallengeHidesRecordDetails() {
        String c = challenge(Map.of("verify", "record", "minMinutes", 10));
        challenges.join(runner, community, c, Map.of());
        challenges.checkin(runner, community, c, yesterday.toString(), Map.of("sessionId", session(runner, yesterday, "06:00", "06:30", true)));
        var seen = challenges.checkins(owner, community, c, null).get(0);
        assertEquals("record", seen.get("method"));
        assertEquals("러너", seen.get("nickname"));
        assertFalse(seen.containsKey("title")); assertFalse(seen.containsKey("startedAt")); assertFalse(seen.containsKey("minutes"));
        var mine = challenges.checkins(runner, community, c, null).get(0);
        assertEquals("한강 러닝", mine.get("title"));
        assertEquals(30, ((Number)mine.get("minutes")).intValue());
    }

    /** 기록 공개 챌린지는 동의해야 참여하고, 참여를 취소하면 인증과 기록이 바로 보이지 않는다. */
    @Test void openRecordChallengeNeedsConsentAndLeavingHidesRecords() {
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> challenge(Map.of("openRecords", true))));
        String c = challenge(Map.of("verify", "record", "minMinutes", 10, "openRecords", true));
        assertEquals(ErrorCode.VALIDATION_FAILED, error(() -> challenges.join(runner, community, c, Map.of())));
        challenges.join(runner, community, c, Map.of("consent", true));
        challenges.checkin(runner, community, c, yesterday.toString(), Map.of("sessionId", session(runner, yesterday, "06:00", "06:45", true)));
        var seen = challenges.checkins(owner, community, c, null).get(0);
        assertEquals("한강 러닝", seen.get("title"));
        assertEquals(45, ((Number)seen.get("minutes")).intValue());
        assertNotNull(seen.get("startedAt"));
        challenges.leave(runner, community, c);
        assertTrue(challenges.checkins(owner, community, c, null).isEmpty());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM challenge_checkin WHERE challenge_id=?", Integer.class, c));
    }

    /** 랭킹은 참여자 이름과 기록 확인 일수를 함께 주고, 커뮤니티를 떠난 사람은 뺀다. 비회원은 볼 수 없다. */
    @Test void rankingNamesVerifiedDaysAndDropsFormerMembers() {
        String c = challenge(Map.of());
        challenges.join(owner, community, c, Map.of());
        challenges.join(runner, community, c, Map.of());
        challenges.checkin(runner, community, c, yesterday.minusDays(1).toString(), Map.of());
        challenges.checkin(runner, community, c, yesterday.toString(), Map.of("sessionId", session(runner, yesterday, "06:00", "06:30", true)));
        var ranking = challenges.ranking(owner, community, c);
        assertEquals("러너", ranking.get(0).get("nickname"));
        assertEquals(2, ((Number)ranking.get(0).get("doneDays")).intValue());
        assertEquals(1, ((Number)ranking.get(0).get("verifiedDays")).intValue());
        assertEquals(0, ((Number)ranking.get(1).get("doneDays")).intValue());
        var listed = challenges.list(runner, community).get(0);
        assertEquals(true, listed.get("joined")); assertEquals(2, ((Number)listed.get("members")).intValue()); assertEquals(2, ((Number)listed.get("myDays")).intValue());
        assertEquals(yesterday.toString(), listed.get("myLastDate"));
        assertEquals(ErrorCode.FORBIDDEN, error(() -> challenges.ranking(outsider, community, c)));
        social.removeMember(owner, FeatureType.COMMUNITY, community, runner);
        assertEquals(1, challenges.ranking(owner, community, c).size());
    }
}
