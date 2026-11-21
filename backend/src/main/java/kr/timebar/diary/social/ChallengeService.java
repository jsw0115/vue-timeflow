// 커뮤니티 챌린지의 참여·인증·인증 내역·랭킹을 다룬다. 실제 기록으로 그 시간에 했는지 확인하고, 기록 공개 챌린지는 동의한 참여자의 기록만 보인다(PR-10 3b, Q-26).
package kr.timebar.diary.social;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.feature.FeatureInput;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.records.DayPolicy;
import kr.timebar.diary.records.RecordingTime;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class ChallengeService {
    private final FeatureStore store;
    private final JdbcTemplate jdbc;
    private final SocialService social;
    private final DayPolicy days;
    private final UserRepository users;

    public ChallengeService(FeatureStore store, JdbcTemplate jdbc, SocialService social, DayPolicy days, UserRepository users) {
        this.store = store; this.jdbc = jdbc; this.social = social; this.days = days; this.users = users;
    }

    public Map<String,Object> create(String user, String community, Map<String,Object> body) {
        store.lock(FeatureStore.SYSTEM, FeatureType.COMMUNITY, community); social.require(user, FeatureType.COMMUNITY, community, false);
        var data = FeatureInput.validate(FeatureType.CHALLENGE, body); data.put("authorId", user);
        return store.create(community, FeatureType.CHALLENGE, data);
    }

    /** 챌린지마다 참여 인원, 내 참여 여부, 내 인증 일수와 마지막 인증 날짜를 더한다. */
    public List<Map<String,Object>> list(String user, String community) {
        return social.posts(user, community, FeatureType.CHALLENGE).stream().map(row -> {
            String id = row.get("id").toString();
            var result = new LinkedHashMap<String,Object>(row);
            result.put("members", participants(community, id).size());
            result.put("joined", joined(id, user));
            result.put("myDays", jdbc.queryForObject("SELECT COUNT(*) FROM challenge_checkin WHERE challenge_id=? AND user_id=?", Integer.class, id, user));
            LocalDate last = jdbc.queryForObject("SELECT MAX(check_date) FROM challenge_checkin WHERE challenge_id=? AND user_id=?", LocalDate.class, id, user);
            result.put("myLastDate", last == null ? null : last.toString());
            return (Map<String,Object>) result;
        }).toList();
    }

    /** 기록 공개 챌린지는 공개에 동의해야 참여한다. 동의는 참여 행의 share_level을 detail로 남긴다. */
    public void join(String user, String community, String id, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("consent"));
        social.require(user, FeatureType.COMMUNITY, community, false);
        var challenge = store.lock(community, FeatureType.CHALLENGE, id);
        if (joined(id, user)) return;
        if (LocalDate.now(days.zone(user)).isAfter(lastDay(challenge))) throw new ApiException(ErrorCode.CONFLICT, "끝난 챌린지에는 참여할 수 없습니다.");
        boolean open = open(challenge);
        if (open && !Boolean.TRUE.equals(body.get("consent"))) FeatureInput.fail("기록 공개에 동의해야 이 챌린지에 참여할 수 있습니다.");
        jdbc.update("INSERT INTO feature_member(space_type,space_id,user_id,role,status,message,updated_at,share_level) VALUES ('CHALLENGE',?,?,'viewer','ACTIVE','',?,?)",
                id, user, Instant.now().toString(), open ? "detail" : "none");
    }

    /** 참여를 취소하면 내 인증과 근거를 함께 지운다. 기록 공개 챌린지의 동의 철회도 이것으로 한다. */
    public void leave(String user, String community, String id) {
        social.require(user, FeatureType.COMMUNITY, community, false);
        store.lock(community, FeatureType.CHALLENGE, id);
        if (!joined(id, user)) throw new ApiException(ErrorCode.NOT_FOUND);
        jdbc.update("DELETE FROM feature_member WHERE space_type='CHALLENGE' AND space_id=? AND user_id=?", id, user);
        jdbc.update("DELETE FROM challenge_checkin WHERE challenge_id=? AND user_id=?", id, user);
    }

    /** 하루 인증을 저장한다. 실제 기록을 붙이면 그 기록으로 확인한 인증(record), 없으면 직접 인증(self)이다. 같은 날짜는 덮어쓴다. */
    public Map<String,Object> checkin(String user, String community, String id, String date, Map<String,Object> body) {
        FeatureInput.keys(body, Set.of("sessionId"));
        social.require(user, FeatureType.COMMUNITY, community, false);
        var challenge = store.lock(community, FeatureType.CHALLENGE, id);
        if (!joined(id, user)) throw new ApiException(ErrorCode.FORBIDDEN);
        ZoneId zone = days.zone(user);
        LocalDate day = FeatureInput.date(date), start = FeatureInput.date(challenge.get("startDate").toString());
        if (day.isBefore(start) || day.isAfter(lastDay(challenge)) || day.isAfter(LocalDate.now(zone))) FeatureInput.fail("챌린지 기간과 인증 날짜를 확인해주세요.");
        String sessionId = FeatureInput.text(body, "sessionId");
        jdbc.update("DELETE FROM challenge_checkin WHERE challenge_id=? AND user_id=? AND check_date=?", id, user, day);
        if (sessionId.isEmpty()) {
            if ("record".equals(challenge.get("verify"))) FeatureInput.fail("이 챌린지는 실시간으로 남긴 실제 기록으로 인증합니다.");
            jdbc.update("INSERT INTO challenge_checkin(challenge_id,user_id,check_date,method,created_at) VALUES (?,?,?,'self',?)", id, user, day, now());
        } else {
            var proof = evidence(user, challenge, day, zone, sessionId);
            if (Boolean.TRUE.equals(jdbc.queryForObject("SELECT COUNT(*)>0 FROM challenge_checkin WHERE challenge_id=? AND user_id=? AND session_id=?", Boolean.class, id, user, sessionId)))
                throw new ApiException(ErrorCode.CONFLICT, "이 기록은 이미 다른 날짜의 인증에 썼습니다.");
            // 기록 제목은 다른 참여자에게 보일 수 있는 기록 공개 챌린지에서만 복사해 둔다
            jdbc.update("INSERT INTO challenge_checkin(challenge_id,user_id,check_date,method,session_id,session_title,started_at,ended_at,minutes,created_at) VALUES (?,?,?,'record',?,?,?,?,?,?)",
                    id, user, day, sessionId, open(challenge) ? proof.title() : null, timestamp(proof.from()), timestamp(proof.to()), proof.minutes(), now());
        }
        return checkins(user, community, id, user).stream().filter(row -> day.toString().equals(row.get("date"))).findFirst().orElseThrow();
    }

    /**
     * 인증 내역. 다른 참여자에게는 날짜와 인증 방식만 보이고, 기록 제목·시각·분은 본인과 기록 공개에 동의한 참여자 것만 보인다.
     * 커뮤니티를 떠났거나 참여를 취소한 사람, 서로 차단한 사람의 인증은 빠진다.
     */
    public List<Map<String,Object>> checkins(String user, String community, String id, String target) {
        social.require(user, FeatureType.COMMUNITY, community, false);
        var challenge = store.get(community, FeatureType.CHALLENGE, id);
        var people = new HashSet<>(participants(community, id));
        var consented = new HashSet<>(jdbc.queryForList("SELECT user_id FROM feature_member WHERE space_type='CHALLENGE' AND space_id=? AND share_level='detail'", String.class, id));
        boolean open = open(challenge);
        var names = new HashMap<String,String>();
        String sql = "SELECT user_id,check_date,method,session_id,session_title,started_at,ended_at,minutes FROM challenge_checkin WHERE challenge_id=?" + (target == null ? "" : " AND user_id=?") + " ORDER BY check_date DESC, user_id";
        Object[] args = target == null ? new Object[] { id } : new Object[] { id, target };
        // 시각은 getTimestamp로 읽어 드라이버가 연결 시간대(chat-local은 UTC)를 반영하게 한다
        var rows = jdbc.query(sql, (rs, i) -> new Checkin(rs.getString("user_id"), rs.getObject("check_date", LocalDate.class), rs.getString("method"), rs.getString("session_id"), rs.getString("session_title"),
                instant(rs.getTimestamp("started_at")), instant(rs.getTimestamp("ended_at")), rs.getInt("minutes")), args);
        List<Map<String,Object>> result = new ArrayList<>();
        for (var row : rows) {
            if (!people.contains(row.user()) || social.blocked(user, row.user())) continue;
            var item = new LinkedHashMap<String,Object>();
            item.put("userId", row.user()); item.put("nickname", names.computeIfAbsent(row.user(), this::nickname));
            item.put("date", row.date().toString()); item.put("method", row.method());
            boolean mine = row.user().equals(user);
            if ("record".equals(row.method()) && (mine || open && consented.contains(row.user()))) {
                item.put("minutes", row.minutes());
                item.put("startedAt", row.from()); item.put("endedAt", row.to());
                item.put("title", open ? row.title() : title(row.user(), Objects.toString(row.session(), "")));
            }
            result.add(item);
        }
        return result;
    }

    /**
     * 참여자별 인증 일수와 그중 실제 기록으로 확인한 일수. 개인 기록 자체는 집계하지 않는다.
     * 랭킹 참여를 끈 회원(share-visibility.rankingVisible=false)은 다른 회원의 응답에서 뺀다. 본인 응답에는 rankingHidden과 함께 남긴다(PR-19 UF-136).
     */
    public List<Map<String,Object>> ranking(String user, String community, String id) {
        social.require(user, FeatureType.COMMUNITY, community, false);
        store.get(community, FeatureType.CHALLENGE, id);
        var counts = new HashMap<String,int[]>();
        for (var row : jdbc.queryForList("SELECT user_id, COUNT(*) AS done, SUM(CASE WHEN method='record' THEN 1 ELSE 0 END) AS verified FROM challenge_checkin WHERE challenge_id=? GROUP BY user_id", id))
            counts.put(row.get("user_id").toString(), new int[] { ((Number)row.get("done")).intValue(), ((Number)row.get("verified")).intValue() });
        return participants(community, id).stream().filter(person -> !social.blocked(user, person)).filter(person -> person.equals(user) || !rankingHidden(person)).map(person -> {
            int[] count = counts.getOrDefault(person, new int[2]);
            var item = new LinkedHashMap<String,Object>();
            item.put("userId", person); item.put("nickname", nickname(person)); item.put("doneDays", count[0]); item.put("verifiedDays", count[1]);
            if (person.equals(user) && rankingHidden(person)) item.put("rankingHidden", true);
            return (Map<String,Object>) item;
        }).sorted(Comparator.<Map<String,Object>>comparingInt(row -> -(int)row.get("doneDays")).thenComparingInt(row -> -(int)row.get("verifiedDays")).thenComparing(row -> row.get("nickname").toString())).toList();
    }

    private record Evidence(String title, Instant from, Instant to, long minutes) { }
    private record Checkin(String user, LocalDate date, String method, String session, String title, String from, String to, int minutes) { }

    /**
     * 실시간 종료 API만 finishKey를 남긴다. 그런 기록은 시작 시각을 서버가 찍었고 종료 시각이 현재를 넘을 수 없어 나중에 지어낼 수 없다.
     * 백업에서 복원한 기록은 finishKey가 없어 근거로 쓰지 않는다. 시간대 조건이 있으면 그 구간과 겹친 시간만 센다.
     * 일시정지한 시간은 어느 경우든 뺀다(PR-09 UF-122).
     */
    private Evidence evidence(String user, Map<String,Object> challenge, LocalDate day, ZoneId zone, String sessionId) {
        var session = store.optional(user, FeatureType.ACTUAL_SESSION, sessionId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "실제 기록을 찾을 수 없습니다."));
        if (!"COMPLETED".equals(session.get("state")) || FeatureInput.text(session, "finishKey").isEmpty()) FeatureInput.fail("실시간으로 시작하고 끝낸 실제 기록만 인증에 쓸 수 있습니다.");
        Instant from = Instant.parse(session.get("startedAt").toString()), to = Instant.parse(session.get("endedAt").toString());
        String windowStart = FeatureInput.text(challenge, "windowStart");
        long seconds;
        if (windowStart.isEmpty()) {
            if (!days.dateOf(user, from).equals(day)) FeatureInput.fail("기록을 시작한 날짜와 인증 날짜가 다릅니다.");
            seconds = RecordingTime.seconds(session);
        } else {
            Instant open = day.atTime(LocalTime.parse(windowStart)).atZone(zone).toInstant();
            Instant close = day.atTime(LocalTime.parse(challenge.get("windowEnd").toString())).atZone(zone).toInstant();
            seconds = RecordingTime.seconds(session, open, close);
        }
        long minutes = seconds / 60, need = challenge.get("minMinutes") instanceof Number number ? number.longValue() : 1;
        if (minutes < need) FeatureInput.fail(windowStart.isEmpty() ? "기록 시간이 " + need + "분보다 짧습니다." : "인증 시간대 안에서 기록한 시간이 " + need + "분보다 짧습니다.");
        return new Evidence(Objects.toString(session.get("title"), ""), from, to, minutes);
    }

    /** 챌린지에 참여 중이면서 지금 커뮤니티 활성 회원인 사람. 커뮤니티를 떠나면 랭킹·내역에서 빠진다. */
    private List<String> participants(String community, String id) {
        return jdbc.queryForList("SELECT m.user_id FROM feature_member m JOIN feature_member c ON c.space_type='COMMUNITY' AND c.space_id=? AND c.user_id=m.user_id AND c.status='ACTIVE' WHERE m.space_type='CHALLENGE' AND m.space_id=? ORDER BY m.user_id", String.class, community, id);
    }
    private boolean joined(String id, String user) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT COUNT(*)>0 FROM feature_member WHERE space_type='CHALLENGE' AND space_id=? AND user_id=?", Boolean.class, id, user));
    }
    private static boolean open(Map<String,Object> challenge) { return Boolean.TRUE.equals(challenge.get("openRecords")); }
    private static LocalDate lastDay(Map<String,Object> challenge) {
        return FeatureInput.date(challenge.get("startDate").toString()).plusDays(((Number)challenge.get("days")).longValue() - 1);
    }
    /** 계정 설정 share-visibility의 rankingVisible이 false일 때만 숨긴다. 설정이 없으면 기존처럼 참여한다. */
    private boolean rankingHidden(String person) {
        return store.optional(person, FeatureType.SETTING, "share-visibility").map(row -> row.get("value")).filter(Map.class::isInstance)
            .map(value -> Boolean.FALSE.equals(((Map<?,?>) value).get("rankingVisible"))).orElse(false);
    }
    private String nickname(String user) { return users.findById(user).map(UserEntity::getNickname).orElse(""); }
    private String title(String user, String session) { return store.optional(user, FeatureType.ACTUAL_SESSION, session).map(row -> Objects.toString(row.get("title"), "")).orElse(""); }
    private static Timestamp now() { return Timestamp.from(Instant.now()); }
    private static Timestamp timestamp(Instant instant) { return Timestamp.from(instant); }
    private static String instant(Timestamp value) { return value == null ? null : value.toInstant().toString(); }
}
