// 관리자가 등록한 공지가 노출 여부·기간 조건대로 사용자 공지 목록에 보이는지와 권한·version 경계를 검증한다(PR-10 UF-117 7-2).
package kr.timebar.diary.operations;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.auth.UserRole;
import kr.timebar.diary.auth.UserStatus;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.contract.AdminController;
import kr.timebar.diary.feature.FeatureStore;
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
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(FeatureTestConfig.class)
class NoticeFlowTest {
    @Autowired RecordService records;
    @Autowired FeatureStore store;
    @Autowired AdminService admin;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    MockMvc mvc;
    String member;
    String operator;
    final LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));

    @BeforeEach void setup() {
        // 공지는 시스템 공용 기록이라 테스트끼리 섞이지 않게 먼저 비운다
        store.deleteAll(FeatureStore.SYSTEM, FeatureType.NOTICE);
        var user = new UserEntity("member@example.test", "회원", "hash", UserRole.USER, UserStatus.ACTIVE);
        var manager = new UserEntity("admin@example.test", "운영자", "hash", UserRole.ADMIN, UserStatus.ACTIVE);
        member = user.getId(); operator = manager.getId();
        when(users.findById(member)).thenReturn(Optional.of(user));
        when(users.findById(operator)).thenReturn(Optional.of(manager));
        mvc = MockMvcBuilders.standaloneSetup(new SupportController(records, store), new AdminController(admin))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void onlyPublishedNoticesInsideThePeriodReachMembers() throws Exception {
        authenticate(operator, "ADMIN");
        String live = create(Map.of("title", "점검 안내", "body", "오늘 밤 점검", "published", true, "popup", false, "from", today.toString(), "to", today.plusDays(1).toString()));
        create(Map.of("title", "숨긴 공지", "body", "아직 내림", "published", false));
        create(Map.of("title", "예정 공지", "body", "내일부터", "published", true, "from", today.plusDays(1).toString()));
        create(Map.of("title", "지난 공지", "body", "어제까지", "published", true, "to", today.minusDays(1).toString()));
        String popup = create(Map.of("title", "새 기능", "body", "팝업 공지", "published", true, "popup", true));
        mvc.perform(get("/api/admin/notices").param("size", "100")).andExpect(jsonPath("$.data.total").value(5));

        authenticate(member, "USER");
        mvc.perform(get("/api/notices")).andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[?(@.id == '" + live + "')].popup").value(false))
                .andExpect(jsonPath("$.data[?(@.id == '" + popup + "')].popup").value(true));
        mvc.perform(post("/api/admin/notices").contentType(MediaType.APPLICATION_JSON).content(body(Map.of("title", "x", "body", "y")))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/notices")).andExpect(status().isForbidden());
    }

    @Test void unpublishingUsesVersionAndHidesTheNotice() throws Exception {
        authenticate(operator, "ADMIN");
        String id = create(Map.of("title", "안내", "body", "내용", "published", true));
        var off = new LinkedHashMap<String, Object>(Map.of("title", "안내", "body", "내용", "published", false, "version", 1));
        mvc.perform(put("/api/admin/notices/" + id).contentType(MediaType.APPLICATION_JSON).content(body(off))).andExpect(jsonPath("$.data.version").value(2));
        mvc.perform(put("/api/admin/notices/" + id).contentType(MediaType.APPLICATION_JSON).content(body(off))).andExpect(status().isConflict());
        mvc.perform(post("/api/admin/notices").contentType(MediaType.APPLICATION_JSON).content(body(Map.of("title", "x", "body", "y", "from", "2026-12-02", "to", "2026-12-01")))).andExpect(status().isBadRequest());
        authenticate(member, "USER");
        mvc.perform(get("/api/notices")).andExpect(jsonPath("$.data.length()").value(0));
        authenticate(operator, "ADMIN");
        mvc.perform(delete("/api/admin/notices/" + id).param("version", "2")).andExpect(status().isNoContent());
    }

    private String create(Map<String, Object> value) throws Exception {
        String response = mvc.perform(post("/api/admin/notices").contentType(MediaType.APPLICATION_JSON).content(body(value))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).path("data").path("id").asText();
    }
    private String body(Map<String, Object> value) throws Exception { return mapper.writeValueAsString(value); }
    private void authenticate(String user, String role) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, "test@example.test", role), null, List.of()));
    }
}
