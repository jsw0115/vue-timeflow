// 그룹별 공유 범위에 따른 그룹 캘린더 응답, 상대방 시점 미리보기, 철회·차단, 이메일로 사람 찾기를 검증한다(PR-10 1단계, TS-37).
package kr.timebar.diary.social;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.auth.*;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.contract.ShareController;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.records.RecordService;
import kr.timebar.diary.security.AuthUserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(FeatureTestConfig.class)
class ShareCalendarTest {
    @Autowired SocialService social;
    @Autowired ShareCalendar calendar;
    @Autowired PeopleFinder people;
    @Autowired RecordService records;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    String alice, bob, carol;
    final Map<String, String> emails = new HashMap<>();
    MockMvc mvc;

    @BeforeEach void setup() {
        alice = account("alice"); bob = account("bob"); carol = account("carol");
        mvc = MockMvcBuilders.standaloneSetup(new ShareController(social, calendar, people), new CommunityController(social)).setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    private String account(String name) {
        String email = name + "-" + UUID.randomUUID() + "@example.test";
        var user = new UserEntity(email, name, "hash", UserRole.USER, UserStatus.ACTIVE);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        when(users.findByEmail(email)).thenReturn(Optional.of(user));
        emails.put(user.getId(), email);
        return user.getId();
    }
    private String group(String owner, String... members) {
        String id = social.createSpace(owner, FeatureType.GROUP, Map.of("title", "그룹")).get("id").toString();
        for (String member : members) { social.addMember(owner, FeatureType.GROUP, id, Map.of("userId", member)); social.join(member, FeatureType.GROUP, id, Map.of()); }
        return id;
    }
    private void schedule(String owner, String title) {
        records.create(owner, FeatureType.SCHEDULE, new LinkedHashMap<>(Map.of("title", title, "body", "비밀 메모", "category", "병원", "startDate", "2026-11-20", "endDate", "2026-11-20", "startTime", "10:00", "endTime", "11:00")));
    }
    private List<Map<String,Object>> view(String viewer, String groupId) { return calendar.schedules(viewer, groupId, "2026-11-20", "2026-11-20"); }
    private void authenticate(String user) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, emails.get(user), "USER"), null, List.of()));
    }

    /** 기본값은 공유 안 함이라, 그룹에 들어가기만 해서는 일정이 보이지 않는다. 그룹 설명에 내 범위가 담긴다. */
    @Test void membersShareNothingUntilTheyChooseALevel() {
        String g = group(alice, bob);
        schedule(alice, "병원 예약");
        assertTrue(view(bob, g).isEmpty());
        assertEquals("none", social.space(alice, FeatureType.GROUP, g).get("shareLevel"));
        calendar.setLevel(alice, g, Map.of("level", "title"));
        assertEquals("title", social.space(alice, FeatureType.GROUP, g).get("shareLevel"));
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> calendar.setLevel(alice, g, Map.of("level", "everything"))).errorCode());
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> calendar.setLevel(carol, g, Map.of("level", "busy"))).errorCode());
    }

    /** UT-192: 바쁜 시간만이면 B가 받는 응답에 시간대만 있고 제목·내용·분류·일정 ID가 없다. */
    @Test void busyLevelReturnsOnlyTimes() throws Exception {
        String g = group(alice, bob);
        schedule(alice, "병원 예약");
        calendar.setLevel(alice, g, Map.of("level", "busy"));
        authenticate(bob);
        var body = mapper.readTree(mvc.perform(get("/api/share/groups/" + g + "/schedules").param("from", "2026-11-20").param("to", "2026-11-20")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        var item = body.path("data").get(0);
        Set<String> fields = new TreeSet<>(); item.fieldNames().forEachRemaining(fields::add);
        assertEquals(new TreeSet<>(List.of("ownerId", "ownerName", "level", "startDate", "endDate", "startTime", "endTime")), fields);
        assertFalse(body.toString().contains("병원 예약"));
        assertFalse(body.toString().contains("비밀 메모"));
    }

    /** UT-193: 같은 일정을 C가 있는 다른 그룹에는 제목 포함으로 보이면 C의 응답에는 제목이 있고 내용은 없다. 상세 포함이면 내용도 있다. */
    @Test void titleAndDetailLevelsDifferPerGroup() {
        String withBob = group(alice, bob), withCarol = group(alice, carol);
        schedule(alice, "병원 예약");
        calendar.setLevel(alice, withBob, Map.of("level", "busy"));
        calendar.setLevel(alice, withCarol, Map.of("level", "title"));
        var seenByCarol = view(carol, withCarol).get(0);
        assertEquals("병원 예약", seenByCarol.get("title"));
        assertFalse(seenByCarol.containsKey("body"));
        assertFalse(view(bob, withBob).get(0).containsKey("title"));
        calendar.setLevel(alice, withCarol, Map.of("level", "detail"));
        assertEquals("비밀 메모", view(carol, withCarol).get(0).get("body"));
    }

    /** UT-191: A가 고른 B 시점 미리보기는 B가 실제로 받는 응답 중 A의 일정과 같다. B가 그룹 멤버가 아니면 404다. */
    @Test void previewEqualsWhatTheViewerActuallyReceives() throws Exception {
        String g = group(alice, bob, carol);
        schedule(alice, "병원 예약"); schedule(carol, "carol 일정");
        calendar.setLevel(alice, g, Map.of("level", "title")); calendar.setLevel(carol, g, Map.of("level", "busy"));
        authenticate(alice);
        String preview = mvc.perform(get("/api/share/groups/" + g + "/preview").param("viewerId", bob).param("from", "2026-11-20").param("to", "2026-11-20")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        authenticate(bob);
        String actual = mvc.perform(get("/api/share/groups/" + g + "/schedules").param("from", "2026-11-20").param("to", "2026-11-20")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var mine = new ArrayList<Object>();
        for (var row : mapper.readTree(actual).path("data")) if (alice.equals(row.path("ownerId").asText())) mine.add(row);
        assertEquals(mapper.readTree(mapper.writeValueAsString(mine)), mapper.readTree(preview).path("data"));
        assertEquals(1, mine.size());
        authenticate(alice);
        mvc.perform(get("/api/share/groups/" + g + "/preview").param("viewerId", account("outsider")).param("from", "2026-11-20").param("to", "2026-11-20")).andExpect(status().isNotFound());
    }

    /** UT-194: 공유를 철회(공유 안 함)한 직후 B의 그룹 캘린더에서 빠지고, 그룹에서 빼면 그룹 캘린더 자체를 볼 수 없다. */
    @Test void revokingRemovesSchedulesImmediately() throws Exception {
        String g = group(alice, bob);
        schedule(alice, "병원 예약");
        authenticate(alice);
        mvc.perform(put("/api/share/groups/" + g + "/share-level").contentType(MediaType.APPLICATION_JSON).content("{\"level\":\"detail\"}")).andExpect(status().isOk());
        assertEquals(1, view(bob, g).size());
        mvc.perform(put("/api/share/groups/" + g + "/share-level").contentType(MediaType.APPLICATION_JSON).content("{\"level\":\"none\"}")).andExpect(status().isOk());
        assertTrue(view(bob, g).isEmpty());
        calendar.setLevel(alice, g, Map.of("level", "detail"));
        social.removeMember(alice, FeatureType.GROUP, g, bob);
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(ApiException.class, () -> view(bob, g)).errorCode());
    }

    /** UT-195: A가 B를 차단하면 B는 A의 일정도, 이메일로 A도 찾을 수 없다. 다른 사람이 만든 그룹에서도 A의 일정이 빠진다. */
    @Test void blockingHidesSchedulesAndProfile() {
        String g = group(carol, alice, bob);
        schedule(alice, "병원 예약");
        calendar.setLevel(alice, g, Map.of("level", "title"));
        assertEquals(1, view(bob, g).size());
        assertEquals(alice, people.find(bob, emails.get(alice)).get("id"));
        social.block(alice, bob);
        assertTrue(view(bob, g).isEmpty());
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> people.find(bob, emails.get(alice))).errorCode());
    }

    /** 사람 찾기: 정확한 이메일만, 자기 자신·없는 계정은 같은 404, 형식 오류는 400, 1분에 20번을 넘으면 429다. */
    @Test void peopleLookupIsExactAndLimited() throws Exception {
        authenticate(alice);
        mvc.perform(get("/api/share/people").param("email", emails.get(bob))).andExpect(status().isOk());
        assertEquals(Map.of("id", bob, "nickname", "bob"), people.find(alice, emails.get(bob)));
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> people.find(alice, emails.get(alice))).errorCode());
        assertEquals(ErrorCode.NOT_FOUND, assertThrows(ApiException.class, () -> people.find(alice, "nobody@example.test")).errorCode());
        assertEquals(ErrorCode.VALIDATION_FAILED, assertThrows(ApiException.class, () -> people.find(alice, "bob")).errorCode());
        String heavy = account("heavy");
        for (int i = 0; i < PeopleFinder.MAX_PER_WINDOW; i++) assertThrows(ApiException.class, () -> people.find(heavy, "nobody@example.test"));
        assertEquals(ErrorCode.RATE_LIMITED, assertThrows(ApiException.class, () -> people.find(heavy, emails.get(bob))).errorCode());
    }

    /** UT-196: 비회원이 비공개 커뮤니티 ID로 상세를 부르면 존재 여부가 드러나지 않는 404다(없는 ID와 같다). */
    @Test void privateCommunityIsNotFoundForOutsiders() throws Exception {
        String id = social.createSpace(alice, FeatureType.COMMUNITY, Map.of("title", "비공개", "joinPolicy", "open", "visibility", "private", "capacity", 10)).get("id").toString();
        authenticate(bob);
        String hidden = mvc.perform(get("/api/communities/" + id)).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();
        String missing = mvc.perform(get("/api/communities/" + "0".repeat(26))).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();
        assertEquals(hidden, missing);
    }
}
