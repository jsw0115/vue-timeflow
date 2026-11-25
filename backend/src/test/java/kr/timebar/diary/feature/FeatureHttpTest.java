// 신규 기능의 실제 SQL 기반 HTTP 계약과 입력·권한·파일 경계를 검증한다.
package kr.timebar.diary.feature;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.auth.*;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.records.*;
import kr.timebar.diary.work.*;
import kr.timebar.diary.social.*;
import kr.timebar.diary.operations.*;
import kr.timebar.diary.integration.IntegrationController;
import kr.timebar.diary.contract.*;
import kr.timebar.diary.security.*;
import kr.timebar.diary.task.TaskService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.*;
import java.util.stream.Stream;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringJUnitConfig(FeatureTestConfig.class)
class FeatureHttpTest {
    @Autowired FeatureStore store;
    @Autowired RecordService records;
    @Autowired WorkService work;
    @Autowired SocialService social;
    @Autowired kr.timebar.diary.social.ChallengeService challenges;
    @Autowired kr.timebar.diary.social.ShareCalendar shareCalendar;
    @Autowired kr.timebar.diary.social.PeopleFinder peopleFinder;
    @Autowired AdminService admin;
    @Autowired SettingsService settings;
    @Autowired ScheduleService schedules;
    @Autowired RecordLinks links;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    MockMvc mvc;
    String owner;
    String other;
    @BeforeEach void setup() {
        var user = new UserEntity("http@example.test", "테스터", "hash", UserRole.USER, UserStatus.ACTIVE);
        owner = user.getId(); when(users.findById(owner)).thenReturn(Optional.of(user));
        var second = new UserEntity("http-other@example.test", "다른 사람", "hash", UserRole.USER, UserStatus.ACTIVE);
        other = second.getId(); when(users.findById(other)).thenReturn(Optional.of(second));
        authenticate(owner, "USER");
        var actions = new RecordActionsController(records, store, mock(TaskService.class), mock(kr.timebar.diary.planner.PlannerService.class), work);
        mvc = MockMvcBuilders.standaloneSetup(new RecordsController(records), new ContactsController(records), new WorkController(records, work), actions,
                new EventDiaryMemoController(records), new SettingsController(settings), new UserProfileController(settings), new ShareController(social, shareCalendar, peopleFinder),
                new CommunityController(social, challenges), new AdminController(admin), new SupportController(records, store), new IntegrationController(admin), new AttachmentController(jdbc, social), new ScheduleController(records, schedules, links), new PortfolioLinkController(store, users))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    static Stream<Object[]> resources() {
        return Stream.of(
            new Object[]{"schedules", Map.of("title", "여러 날", "startDate", "2026-10-10", "endDate", "2026-10-11", "startTime", "23:00", "endTime", "01:00")},
            new Object[]{"routine-records", Map.of("title", "루틴", "startDate", "2026-10-10", "time", "09:00", "duration", 30, "days", List.of(0,1,2,3,4,5,6), "goal", Map.of("count", 1, "unit", "회"))},
            new Object[]{"diaries", Map.of("title", "일기", "date", "2026-10-10")},
            new Object[]{"memos", Map.of("title", "메모", "body", "내용")},
            new Object[]{"ddays", Map.of("title", "시험", "date", "2026-10-10")},
            new Object[]{"money/entries", Map.of("title", "점심", "date", "2026-10-10", "type", "out", "amount", -1000)},
            new Object[]{"focus/sessions", Map.of("title", "집중", "date", "2026-10-10", "mode", "pomodoro", "duration", 25, "startedAt", "2026-10-10T01:00:00Z")},
            new Object[]{"events/templates", Map.of("title", "회의", "duration", 60)},
            new Object[]{"planner/templates", Map.of("title", "아침", "blocks", List.of(Map.of("title", "운동", "time", "09:00")))},
            new Object[]{"work/records", Map.of("title", "연차", "owner", "나", "type", "연차", "startDate", "2026-10-10", "endDate", "2026-10-10", "startTime", "09:00", "endTime", "18:00", "leaveDays", 1)},
            new Object[]{"work/wiki", Map.of("title", "위키", "space", "개발")},
            new Object[]{"work/wbs/nodes", Map.of("title", "작업", "md", 1, "progress", 20)},
            new Object[]{"work/career/projects", Map.of("title", "프로젝트", "role", "개발")},
            new Object[]{"work/portfolio", Map.of("title", "사례", "kind", "문서")},
            new Object[]{"contacts", Map.of("name", "동료", "email", "person@example.test")}
        );
    }
    @ParameterizedTest(name="CRUD /api/{0}") @MethodSource("resources")
    void everyRecordResourceHasWorkingCreateReadUpdatePageIsolationAndDelete(String path, Map<String,Object> body) throws Exception {
        String response = mvc.perform(post("/api/" + path).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.version").value(1)).andReturn().getResponse().getContentAsString();
        String id = mapper.readTree(response).path("data").path("id").asText();
        mvc.perform(get("/api/" + path + "/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id));
        mvc.perform(get("/api/" + path).param("page", "0").param("size", "100")).andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(1));
        var update = new LinkedHashMap<>(body); update.put("version", 1);
        mvc.perform(put("/api/" + path + "/" + id).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(update))).andExpect(status().isOk()).andExpect(jsonPath("$.data.version").value(2));
        mvc.perform(put("/api/" + path + "/" + id).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(update))).andExpect(status().isConflict());
        authenticate("other", "USER");
        mvc.perform(get("/api/" + path + "/" + id)).andExpect(status().isNotFound());
        authenticate(owner, "USER");
        mvc.perform(delete("/api/" + path + "/" + id).param("version", "2")).andExpect(status().isNoContent());
        mvc.perform(get("/api/" + path + "/" + id)).andExpect(status().isNotFound());
    }
    @Test void invalidInputAndMissingAuthenticationReturnHonestErrors() throws Exception {
        mvc.perform(post("/api/diaries").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"일기\",\"date\":\"2026-02-30\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/memos").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"메모\",\"ownerId\":\"other\"}")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/memos").param("size", "101")).andExpect(status().isBadRequest());
        SecurityContextHolder.clearContext(); mvc.perform(get("/api/memos")).andExpect(status().isUnauthorized());
    }
    @Test void settingsPersistVersionAndRejectProviderSecrets() throws Exception {
        mvc.perform(post("/api/settings/appearance").contentType(MediaType.APPLICATION_JSON).content("{\"value\":{\"fontSize\":\"md\"}}")).andExpect(status().isOk());
        mvc.perform(get("/api/settings/appearance")).andExpect(jsonPath("$.data.value.fontSize").value("md"));
        mvc.perform(post("/api/settings/appearance").contentType(MediaType.APPLICATION_JSON).content("{\"value\":{\"fontSize\":\"lg\"},\"version\":1}")).andExpect(jsonPath("$.data.version").value(2));
        mvc.perform(post("/api/settings/ai").contentType(MediaType.APPLICATION_JSON).content("{\"value\":{\"apiKey\":\"secret\"}}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/settings/security").contentType(MediaType.APPLICATION_JSON).content("{\"value\":{\"twoFactor\":true}}")).andExpect(status().isServiceUnavailable());
    }
    /** PR-03: 일정 템플릿 적용은 폐지 예정인 구형 events가 아니라 신형 SCHEDULE을 만든다. */
    @Test void applyingAnEventTemplateCreatesANewModelSchedule() throws Exception {
        var template = records.create(owner, FeatureType.EVENT_TEMPLATE, new LinkedHashMap<>(Map.of("title", "주간 회의", "category", "업무", "duration", 90)));
        String path = "/api/events/templates/" + template.get("id") + "/apply";
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{\"date\":\"2026-11-18\",\"startTime\":\"10:00\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.title").value("주간 회의")).andExpect(jsonPath("$.data.category").value("업무"))
                .andExpect(jsonPath("$.data.startDate").value("2026-11-18")).andExpect(jsonPath("$.data.endDate").value("2026-11-18"))
                .andExpect(jsonPath("$.data.startTime").value("10:00")).andExpect(jsonPath("$.data.endTime").value("11:30")).andExpect(jsonPath("$.data.version").value(1));
        assertEquals(1, schedules.occurrences(owner, "2026-11-18", "2026-11-18").size());
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{\"date\":\"2026-11-18\",\"startTime\":\"23:00\"}")).andExpect(status().isBadRequest());
        authenticate("other", "USER");
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{\"date\":\"2026-11-18\",\"startTime\":\"10:00\"}")).andExpect(status().isNotFound());
        authenticate(owner, "USER");
        assertEquals(1, schedules.occurrences(owner, "2026-11-18", "2026-11-18").size());
    }
    @Test void diaryAllowsSeveralEntriesPerDayAndCalendarCountsThem() throws Exception {
        records.create(owner, FeatureType.DIARY, Map.of("title", "아침", "date", "2026-10-10"));
        records.create(owner, FeatureType.DIARY, Map.of("title", "저녁", "date", "2026-10-10"));
        mvc.perform(get("/api/diary/2026-10-10")).andExpect(jsonPath("$.data.total").value(2));
        mvc.perform(get("/api/diary/calendar").param("year", "2026").param("month", "10")).andExpect(jsonPath("$.data[0].count").value(2));
    }
    @Test void uploadDownloadsActualBytesRejectsPrivateSharingAndAppliesExpiry() throws Exception {
        byte[] content = "실제 파일 데이터".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        var file = new MockMultipartFile("file", "test.txt", "text/plain", content);
        String response = mvc.perform(multipart("/api/attachments").file(file)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = mapper.readTree(response).path("data").path("id").asText();
        mvc.perform(get("/api/attachments/" + id + "/download")).andExpect(status().isOk()).andExpect(content().bytes(content)).andExpect(header().string("Cache-Control", "no-store"));
        // 공유 첨부 화면은 올린 사람 이름과 올린 시각을 보인다(PR-10 5단계, UF-116)
        mvc.perform(get("/api/attachments")).andExpect(jsonPath("$.data[0].id").value(id)).andExpect(jsonPath("$.data[0].ownerName").value("테스터")).andExpect(jsonPath("$.data[0].createdAt").isNotEmpty());
        authenticate("other", "USER"); mvc.perform(get("/api/attachments/" + id + "/download")).andExpect(status().isNotFound()); authenticate(owner, "USER");
        mvc.perform(multipart("/api/attachments").file(file).param("domain", "work")).andExpect(status().isBadRequest());
        jdbc.update("UPDATE feature_file SET expires_at='2000-01-01T00:00:00Z' WHERE id=?", id);
        mvc.perform(get("/api/attachments/" + id + "/download")).andExpect(status().isNotFound());
        mvc.perform(post("/api/attachments/purge-expired")).andExpect(jsonPath("$.data.deleted").value(1));
    }
    @Test void uploadAcceptsExactlyTenMebibytesAndRejectsEmptyOrLargerFiles() throws Exception {
        int limit = 10 * 1024 * 1024;
        mvc.perform(multipart("/api/attachments").file(new MockMultipartFile("file", "limit.bin", "application/octet-stream", new byte[limit])))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.sizeBytes").value(limit));
        mvc.perform(multipart("/api/attachments").file(new MockMultipartFile("file", "over.bin", "application/octet-stream", new byte[limit + 1])))
                .andExpect(status().isBadRequest());
        mvc.perform(multipart("/api/attachments").file(new MockMultipartFile("file", "empty.bin", "application/octet-stream", new byte[0])))
                .andExpect(status().isBadRequest());
    }
    @Test void providerDependentRequestsAreUnavailableAndAdminRoutesDenyNormalUsers() throws Exception {
        mvc.perform(post("/api/insight/generate").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.success").value(false));
        mvc.perform(post("/api/billing/checkout").contentType(MediaType.APPLICATION_JSON).content("{\"planId\":\"premium\"}")).andExpect(status().isServiceUnavailable());
        mvc.perform(get("/api/integrations/capabilities")).andExpect(jsonPath("$.data[0].available").value(false));
        mvc.perform(get("/api/admin/users")).andExpect(status().isForbidden());
    }
    @Test void portfolioLinkPublishesOnlySelectedItemsAndCanBeRevoked() throws Exception {
        var selected = work.create(owner, FeatureType.PORTFOLIO, Map.of("title", "선택한 항목", "kind", "사례"));
        work.create(owner, FeatureType.CAREER, Map.of("title", "민감한 경력", "role", "개발"));
        String response = mvc.perform(post("/api/work/portfolio-links").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("itemIds", List.of(selected.get("id")))))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        var data = mapper.readTree(response).path("data"); String token = data.path("token").asText(), id = data.path("id").asText();
        SecurityContextHolder.clearContext();
        mvc.perform(get("/api/public/portfolios/" + token)).andExpect(status().isOk()).andExpect(jsonPath("$.data.items.length()").value(1)).andExpect(jsonPath("$.data.items[0].kind").value("사례"));
        authenticate(owner, "USER"); mvc.perform(delete("/api/work/portfolio-links/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/public/portfolios/" + token)).andExpect(status().isNotFound());
    }
    /** PR-26: 공개 화면에는 정한 공개 필드만 나가고, 근거 연결 ID(activityIds·experienceId)는 나가지 않는다. */
    @Test void publicPortfolioShowsOnlyPublicFields() throws Exception {
        var activity = store.create(owner, FeatureType.CAREER_ACTIVITY, Map.of("title", "사내 결제 개선", "activityType", "work", "date", "2026-10-01", "visibility", "private"));
        var career = work.create(owner, FeatureType.CAREER, Map.of("title", "민감한 경력", "role", "개발"));
        var item = work.create(owner, FeatureType.PORTFOLIO, Map.of("title", "결제 개선", "kind", "케이스 스터디", "problem", "결제 실패율", "outcome", "실패율 30% 감소",
                "links", List.of("https://example.com/demo"), "activityIds", List.of(activity.get("id")), "experienceId", career.get("id")));
        String token = mapper.readTree(mvc.perform(post("/api/work/portfolio-links").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("itemIds", List.of(item.get("id"))))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("data").path("token").asText();
        SecurityContextHolder.clearContext();
        mvc.perform(get("/api/public/portfolios/" + token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].problem").value("결제 실패율"))
                .andExpect(jsonPath("$.data.items[0].links[0]").value("https://example.com/demo"))
                .andExpect(jsonPath("$.data.items[0].activityIds").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].experienceId").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].id").doesNotExist());
    }
    /** Q-22: 링크 공개는 만료가 있고 목록에 주소가 없으며, 전체 공개는 만료 없이 목록에 주소가 남는다. 남의 링크는 목록에 없고 닫을 수 없다. */
    @Test void portfolioLinksHaveTwoScopesAndAreListedOnlyToTheirOwner() throws Exception {
        var item = work.create(owner, FeatureType.PORTFOLIO, Map.of("title", "공개 항목", "kind", "사례"));
        String link = mvc.perform(post("/api/work/portfolio-links").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("itemIds", List.of(item.get("id")), "scope", "link", "expiresInDays", 1)))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.scope").value("link")).andExpect(jsonPath("$.data.expiresAt").isString()).andReturn().getResponse().getContentAsString();
        String linkToken = mapper.readTree(link).path("data").path("token").asText();
        String open = mvc.perform(post("/api/work/portfolio-links").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("itemIds", List.of(item.get("id")), "scope", "public")))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.scope").value("public")).andExpect(jsonPath("$.data.expiresAt").doesNotExist()).andReturn().getResponse().getContentAsString();
        String publicToken = mapper.readTree(open).path("data").path("token").asText(), publicId = mapper.readTree(open).path("data").path("id").asText();
        var listed = mapper.readTree(mvc.perform(get("/api/work/portfolio-links")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("data");
        int mine = 0;
        for (var row : listed) {
            if (row.path("scope").asText().equals("link")) assertTrue(row.path("token").isMissingNode(), "링크 공개 주소는 다시 보이지 않는다");
            if (row.path("id").asText().equals(publicId)) assertEquals(publicToken, row.path("token").asText());
            mine++;
        }
        assertTrue(mine >= 2);
        SecurityContextHolder.clearContext();
        mvc.perform(get("/api/public/portfolios/" + linkToken)).andExpect(status().isOk()).andExpect(jsonPath("$.data.scope").value("link"));
        mvc.perform(get("/api/public/portfolios/" + publicToken)).andExpect(status().isOk()).andExpect(jsonPath("$.data.scope").value("public")).andExpect(jsonPath("$.data.expiresAt").doesNotExist());
        authenticate(other, "USER");
        mvc.perform(get("/api/work/portfolio-links")).andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(delete("/api/work/portfolio-links/" + publicId)).andExpect(status().isNotFound());
        authenticate(owner, "USER");
        mvc.perform(post("/api/work/portfolio-links").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("itemIds", List.of(item.get("id")), "scope", "everyone")))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/work/portfolio-links").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("itemIds", List.of(item.get("id")), "expiresInDays", 3)))).andExpect(status().isBadRequest());
    }
    /** 로컬 자료 이전(UF-86)이 같은 멱등 키로 다시 보내도 업무 기록·위키·WBS가 하나만 생긴다(PR-10 4단계). */
    @Test void workCreatesReplayTheSameRecordForTheSameIdempotencyKey() throws Exception {
        var bodies = Map.of(
            "work/records", Map.of("title", "연차", "owner", "나", "type", "연차", "startDate", "2026-11-20", "endDate", "2026-11-20", "startTime", "09:00", "endTime", "18:00", "leaveDays", 1),
            "work/wiki", Map.of("title", "배포", "space", "개발"),
            "work/wbs/nodes", Map.of("title", "설계", "md", 2, "progress", 0));
        for (var entry : bodies.entrySet()) {
            String json = mapper.writeValueAsString(entry.getValue()), key = "local:" + entry.getKey().replace('/', '-') + ":7";
            String first = mapper.readTree(mvc.perform(post("/api/" + entry.getKey()).header("Idempotency-Key", key).contentType("application/json").content(json)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).at("/data/id").asText();
            String again = mapper.readTree(mvc.perform(post("/api/" + entry.getKey()).header("Idempotency-Key", key).contentType("application/json").content(json)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).at("/data/id").asText();
            assertEquals(first, again, entry.getKey());
        }
        assertEquals(1, store.all(owner, FeatureType.WORK_RECORD).size());
        assertEquals(1, store.all(owner, FeatureType.WIKI).size());
        assertEquals(1, store.all(owner, FeatureType.WBS).size());
    }
    private void authenticate(String user, String role) { SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, "test@example.test", role), null, List.of())); }
}
