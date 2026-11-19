// 사용자 시간대와 하루 경계(0~6시 정시)로 오늘과 날짜별 시간 범위를 정한다(PR-08 2단계, Q-06·Q-12).
package kr.timebar.diary.records;

import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.Map;

@Service
public class DayPolicy {
    public static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Seoul");
    public static final int MAX_START_HOUR = 6;
    private final UserRepository users;
    private final FeatureStore store;
    private final Clock clock;

    @Autowired
    public DayPolicy(UserRepository users, FeatureStore store) { this(users, store, Clock.systemUTC()); }
    DayPolicy(UserRepository users, FeatureStore store, Clock clock) { this.users = users; this.store = store; this.clock = clock; }

    /** 한 요청 안에서 같은 기준으로 날짜를 계산하도록 사용자의 시간대와 경계를 한 번 읽는다. */
    Day of(String user) {
        ZoneId zone = users.findById(user).map(UserEntity::getTimeZone).map(ZoneId::of).orElse(DEFAULT_ZONE);
        return new Day(zone, startHour(user), clock);
    }

    /** 프로필 추가 정보의 dayStartHour. 저장하지 않았으면 0(자정)이다. */
    private int startHour(String user) {
        return store.optional(user, FeatureType.SETTING, "profile")
                .map(row -> row.get("value") instanceof Map<?,?> value && value.get("dayStartHour") instanceof Number hour ? hour.intValue() : 0)
                .orElse(0);
    }

    /** 날짜 d는 d일 경계 시각부터 다음 날 경계 시각 직전까지다. 저장된 시각은 바꾸지 않고 날짜 배정에만 쓴다. API 응답에 쓰지 않으므로 패키지 안에만 둔다. */
    record Day(ZoneId zone, int startHour, Clock clock) {
        public LocalDate today() { return dateOf(clock.instant()); }
        public Instant start(LocalDate date) { return date.atTime(startHour, 0).atZone(zone).toInstant(); }
        public Instant end(LocalDate date) { return start(date.plusDays(1)); }
        public LocalDate dateOf(Instant instant) {
            LocalDateTime local = instant.atZone(zone).toLocalDateTime();
            return local.getHour() < startHour ? local.toLocalDate().minusDays(1) : local.toLocalDate();
        }
    }
}
