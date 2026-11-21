// 관리자 조치가 감사 로그에 조치한 관리자·동작·대상으로 남고, 일반 계정은 감사 로그를 볼 수 없는지 검증한다(PR-10 UF-117 7-4).
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(FeatureTestConfig.class)
class AuditLogTest {
    @Autowired RecordService records;
    @Autowired FeatureStore store;
    @Autowired AdminService admin;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    MockMvc mvc;
    String member;
    String operator;

    @BeforeEach void setup() {
        // 감사 로그는 시스템 공용 기록이라 테스트끼리 섞이지 않게 먼저 비운다
        store.deleteAll(FeatureStore.SYSTEM, FeatureType.AUDIT);
        var user = new UserEntity("member@example.test", "회원", "hash", UserRole.USER, UserStatus.ACTIVE);
        var manager = new UserEntity("admin@example.test", "운영자", "hash", UserRole.ADMIN, UserStatus.ACTIVE);
        member = user.getId(); operator = manager.getId();
        when(users.findById(member)).thenReturn(Optional.of(user));
        when(users.findById(operator)).thenReturn(Optional.of(manager));
        mvc = MockMvcBuilders.standaloneSetup(new SupportController(records, store), new AdminController(admin))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void adminActionsAreRecordedWithActorAndMembersCannotReadThem() throws Exception {
        authenticate(operator, "ADMIN");
        String response = mvc.perform(post("/api/admin/notices").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("title", "안내", "body", "내용"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String noticeId = mapper.readTree(response).path("data").path("id").asText();
        mvc.perform(get("/api/admin/audit").param("size", "100")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.items[0].action").value("NOTICE_CREATE"))
                .andExpect(jsonPath("$.data.items[0].actor").value(operator))
                .andExpect(jsonPath("$.data.items[0].target").value(noticeId));
        authenticate(member, "USER");
        mvc.perform(get("/api/admin/audit")).andExpect(status().isForbidden());
    }

    private void authenticate(String user, String role) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, "test@example.test", role), null, List.of()));
    }
}
