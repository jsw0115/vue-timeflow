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
    @Autowired AdminService admin;
    @Autowired SettingsService settings;
    @Autowired ScheduleService schedules;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    MockMvc mvc;
    String owner;
    @BeforeEach void setup() {
        var user = new UserEntity("http@example.test", "테스터", "hash", UserRole.USER, UserStatus.ACTIVE);
        owner = user.getId(); when(users.findById(owner)).thenReturn(Optional.of(user));
        authenticate(owner, "USER");
        var actions = new RecordActionsController(records, store, mock(TaskService.class), mock(kr.timebar.diary.event.EventService.class), mock(kr.timebar.diary.planner.PlannerService.class), work);
        mvc = MockMvcBuilders.standaloneSetup(new RecordsController(records), new ContactsController(records), new WorkController(records, work), actions,
                new EventDiaryMemoController(records), new SettingsController(settings), new UserProfileController(settings), new ShareController(social),
                new CommunityController(social), new AdminController(admin), new SupportController(records, store), new IntegrationController(admin), new AttachmentController(jdbc, social), new ScheduleController(records, schedules), new PortfolioLinkController(store, users))
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
        authenticate("other", "USER"); mvc.perform(get("/api/attachments/" + id + "/download")).andExpect(status().isNotFound()); authenticate(owner, "USER");
        mvc.perform(multipart("/api/attachments").file(file).param("domain", "work")).andExpect(status().isBadRequest());
        jdbc.update("UPDATE feature_file SET expires_at='2000-01-01T00:00:00Z' WHERE id=?", id);
        mvc.perform(get("/api/attachments/" + id + "/download")).andExpect(status().isNotFound());
        mvc.perform(post("/api/attachments/purge-expired")).andExpect(jsonPath("$.data.deleted").value(1));
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
    private void authenticate(String user, String role) { SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, "test@example.test", role), null, List.of())); }
}
