// 커리어 활동 원장과 지원 관리 API의 소유권·입력 검증·버전 충돌·멱등 생성을 실제 SQL 저장으로 검증한다.
package kr.timebar.diary.career;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.contract.SettingsController;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.operations.SettingsService;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(FeatureTestConfig.class)
class CareerHttpTest {
    @Autowired FeatureStore store;
    @Autowired RecordService records;
    @Autowired CareerService career;
    @Autowired SettingsService settings;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    MockMvc mvc;
    // 테스트 컨텍스트가 같은 H2 DB를 공유하므로 테스트마다 새 계정으로 집계를 분리한다
    String owner;

    @BeforeEach void setup() {
        owner = kr.timebar.diary.common.UlidGenerator.newUlid();
        authenticate(owner);
        mvc = MockMvcBuilders.standaloneSetup(new CareerController(records, career), new SettingsController(settings))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void activityCrudKeepsOwnershipVersionAndPrivateDefault() throws Exception {
        String id = create("/api/career/activities", Map.of("title", "결제 화면 개선", "activityType", "work", "date", "2026-11-02", "skillTags", List.of("Vue", "Spring"), "links", List.of("https://example.test/pr/1")));
        mvc.perform(get("/api/career/activities/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.data.visibility").value("private")).andExpect(jsonPath("$.data.skillTags[1]").value("Spring"));
        mvc.perform(get("/api/career/activities").param("from", "2026-11-01").param("to", "2026-11-30")).andExpect(jsonPath("$.data.total").value(1));
        var update = new LinkedHashMap<String, Object>(Map.of("title", "결제 화면 개선", "activityType", "work", "date", "2026-11-02", "version", 1));
        mvc.perform(put("/api/career/activities/" + id).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(update))).andExpect(status().isOk()).andExpect(jsonPath("$.data.version").value(2));
        mvc.perform(put("/api/career/activities/" + id).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(update))).andExpect(status().isConflict());
        authenticate(other());
        mvc.perform(get("/api/career/activities/" + id)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/career/activities/" + id).param("version", "2")).andExpect(status().isNotFound());
        authenticate(owner);
        mvc.perform(delete("/api/career/activities/" + id).param("version", "1")).andExpect(status().isConflict());
        mvc.perform(delete("/api/career/activities/" + id).param("version", "2")).andExpect(status().isNoContent());
        mvc.perform(get("/api/career/activities/" + id)).andExpect(status().isNotFound());
    }

    @Test void activityRejectsUnsafeLinksUnknownTypesPublicVisibilityAndOwnerFields() throws Exception {
        rejects("/api/career/activities", Map.of("title", "x", "activityType", "work", "date", "2026-11-02", "links", List.of("javascript:alert(1)")));
        rejects("/api/career/activities", Map.of("title", "x", "activityType", "work", "date", "2026-11-02", "links", List.of("/relative/path")));
        rejects("/api/career/activities", Map.of("title", "x", "activityType", "work", "date", "2026-11-02", "links", java.util.Collections.nCopies(11, "https://example.test")));
        rejects("/api/career/activities", Map.of("title", "x", "activityType", "hobby", "date", "2026-11-02"));
        rejects("/api/career/activities", Map.of("title", "x", "activityType", "work", "date", "2026-11-02", "visibility", "public"));
        rejects("/api/career/activities", Map.of("title", "x", "activityType", "work", "date", "2026-11-02", "endDate", "2026-11-01"));
        rejects("/api/career/activities", Map.of("title", "x", "activityType", "work", "date", "2026-11-02", "userId", other()));
    }

    @Test void activityLinksOnlyTheSignedInAccountsExperience() throws Exception {
        var mine = store.create(owner, FeatureType.CAREER, Map.of("title", "타임바", "role", "개발"));
        var theirs = store.create(other(), FeatureType.CAREER, Map.of("title", "다른 회사", "role", "기획"));
        String id = create("/api/career/activities", Map.of("title", "인수인계 문서", "activityType", "work", "date", "2026-11-03", "experienceId", mine.get("id")));
        mvc.perform(get("/api/career/activities/" + id)).andExpect(jsonPath("$.data.experienceId").value(mine.get("id")));
        rejects("/api/career/activities", Map.of("title", "x", "activityType", "work", "date", "2026-11-03", "experienceId", theirs.get("id")));
        rejects("/api/career/activities", Map.of("title", "x", "activityType", "work", "date", "2026-11-03", "experienceId", "missing-id"));
        assertEquals(1, store.all(owner, FeatureType.CAREER_ACTIVITY).size());
    }

    @Test void applicationCrudValidatesStatusAndPostingUrl() throws Exception {
        String longUrl = "https://jobs.example.test/posting?" + "q=1&".repeat(80);
        String id = create("/api/career/applications", Map.of("title", "프런트엔드 개발자", "company", "예시 회사", "status", "interested", "deadline", "2026-12-01", "postingUrl", longUrl));
        mvc.perform(get("/api/career/applications/" + id)).andExpect(jsonPath("$.data.status").value("interested")).andExpect(jsonPath("$.data.postingUrl").value(longUrl));
        var update = new LinkedHashMap<String, Object>(Map.of("title", "프런트엔드 개발자", "company", "예시 회사", "status", "applied", "appliedDate", "2026-11-20", "interviewDate", "2026-11-28", "version", 1));
        mvc.perform(put("/api/career/applications/" + id).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(update))).andExpect(jsonPath("$.data.status").value("applied"));
        rejects("/api/career/applications", Map.of("title", "x", "company", "y", "status", "hired"));
        rejects("/api/career/applications", Map.of("title", "x", "company", "y", "status", "applied", "postingUrl", "ftp://example.test/job"));
        rejects("/api/career/applications", Map.of("title", "x", "company", "y", "status", "applied", "deadline", "2026-02-30"));
        authenticate(other());
        mvc.perform(get("/api/career/applications/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/career/applications")).andExpect(jsonPath("$.data.total").value(0));
    }

    @Test void sameIdempotencyKeyCreatesOneActivity() throws Exception {
        String body = mapper.writeValueAsString(Map.of("title", "스터디 발표", "activityType", "study", "date", "2026-11-04"));
        String first = mvc.perform(post("/api/career/activities").header("Idempotency-Key", "career-key-000001").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String second = mvc.perform(post("/api/career/activities").header("Idempotency-Key", "career-key-000001").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        assertEquals(mapper.readTree(first).path("data").path("id").asText(), mapper.readTree(second).path("data").path("id").asText());
        assertEquals(1, store.all(owner, FeatureType.CAREER_ACTIVITY).size());
    }

    /** 활동의 기술 목록(skillTags) 배열 규칙이 이력서의 보유 기술(skills, 문자열)에 번지지 않는다. */
    @Test void resumeSkillsStayAPlainString() {
        var resume = kr.timebar.diary.feature.FeatureInput.validate(FeatureType.RESUME, Map.of("name", "김", "skills", "Vue 3 · Spring Boot"));
        assertEquals("Vue 3 · Spring Boot", resume.get("skills"));
    }

    @Test void careerGoalSettingAcceptsOnlyKnownGoals() throws Exception {
        mvc.perform(post("/api/settings/career").contentType(MediaType.APPLICATION_JSON).content("{\"value\":{\"goal\":\"job-changer\"}}")).andExpect(status().isOk());
        mvc.perform(get("/api/settings/career")).andExpect(jsonPath("$.data.value.goal").value("job-changer"));
        mvc.perform(post("/api/settings/career").contentType(MediaType.APPLICATION_JSON).content("{\"value\":{\"goal\":\"admin\"},\"version\":1}")).andExpect(status().isBadRequest());
    }

    private String create(String path, Map<String, Object> body) throws Exception {
        String response = mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.version").value(1)).andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).path("data").path("id").asText();
    }
    private void rejects(String path, Map<String, Object> body) throws Exception {
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body))).andExpect(status().isBadRequest());
    }
    private String other() { return "other-" + owner; }
    private void authenticate(String user) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, "test@example.test", "USER"), null, List.of()));
    }
}
