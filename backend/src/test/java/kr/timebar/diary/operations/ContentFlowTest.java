// 관리자 콘텐츠의 저장·공개 전환과 권한·version 경계, 사용자 조회의 공개 조건을 검증한다(PR-10 UF-117 7-3).
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
class ContentFlowTest {
    @Autowired RecordService records;
    @Autowired FeatureStore store;
    @Autowired AdminService admin;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    MockMvc mvc;
    String member;
    String operator;

    @BeforeEach void setup() {
        // 콘텐츠는 시스템 공용 기록이라 테스트끼리 섞이지 않게 먼저 비운다
        store.deleteAll(FeatureStore.SYSTEM, FeatureType.CONTENT);
        var user = new UserEntity("member@example.test", "회원", "hash", UserRole.USER, UserStatus.ACTIVE);
        var manager = new UserEntity("admin@example.test", "운영자", "hash", UserRole.ADMIN, UserStatus.ACTIVE);
        member = user.getId(); operator = manager.getId();
        when(users.findById(member)).thenReturn(Optional.of(user));
        when(users.findById(operator)).thenReturn(Optional.of(manager));
        mvc = MockMvcBuilders.standaloneSetup(new SupportController(records, store), new AdminController(admin))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void adminSavesContentAndOnlyLiveContentIsReadable() throws Exception {
        authenticate(operator, "ADMIN");
        String id = create(Map.of("title", "오늘의 문장", "body", "작은 진전", "kind", "명언", "where", "홈", "live", false));
        create(Map.of("title", "숨긴 팩", "body", "스티커 12종", "kind", "스티커팩"));
        mvc.perform(post("/api/admin/content").contentType(MediaType.APPLICATION_JSON).content(body(Map.of("title", "x", "body", "y")))).andExpect(status().isBadRequest());
        var on = new LinkedHashMap<String, Object>(Map.of("title", "오늘의 문장", "body", "작은 진전", "kind", "명언", "where", "홈", "live", true, "version", 1));
        mvc.perform(put("/api/admin/content/" + id).contentType(MediaType.APPLICATION_JSON).content(body(on))).andExpect(jsonPath("$.data.version").value(2)).andExpect(jsonPath("$.data.live").value(true));
        mvc.perform(put("/api/admin/content/" + id).contentType(MediaType.APPLICATION_JSON).content(body(on))).andExpect(status().isConflict());
        mvc.perform(get("/api/admin/content").param("size", "100")).andExpect(jsonPath("$.data.total").value(2));

        authenticate(member, "USER");
        mvc.perform(get("/api/content")).andExpect(jsonPath("$.data.length()").value(1)).andExpect(jsonPath("$.data[0].id").value(id));
        mvc.perform(get("/api/admin/content")).andExpect(status().isForbidden());
        mvc.perform(delete("/api/admin/content/" + id).param("version", "2")).andExpect(status().isForbidden());

        authenticate(operator, "ADMIN");
        mvc.perform(delete("/api/admin/content/" + id).param("version", "2")).andExpect(status().isNoContent());
        authenticate(member, "USER");
        mvc.perform(get("/api/content")).andExpect(jsonPath("$.data.length()").value(0));
    }

    private String create(Map<String, Object> value) throws Exception {
        String response = mvc.perform(post("/api/admin/content").contentType(MediaType.APPLICATION_JSON).content(body(value))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).path("data").path("id").asText();
    }
    private String body(Map<String, Object> value) throws Exception { return mapper.writeValueAsString(value); }
    private void authenticate(String user, String role) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, "test@example.test", role), null, List.of()));
    }
}
