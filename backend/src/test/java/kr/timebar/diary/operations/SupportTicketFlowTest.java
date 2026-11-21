// 1:1 문의를 사용자가 남기고 관리자가 답한 뒤 사용자가 답변을 보는 흐름과 권한·version 경계를 검증한다(PR-10 UF-117).
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(FeatureTestConfig.class)
class SupportTicketFlowTest {
    @Autowired RecordService records;
    @Autowired FeatureStore store;
    @Autowired AdminService admin;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    MockMvc mvc;
    String member;
    String operator;

    @BeforeEach void setup() {
        var user = new UserEntity("member@example.test", "회원", "hash", UserRole.USER, UserStatus.ACTIVE);
        var manager = new UserEntity("admin@example.test", "운영자", "hash", UserRole.ADMIN, UserStatus.ACTIVE);
        member = user.getId(); operator = manager.getId();
        when(users.findById(member)).thenReturn(Optional.of(user));
        when(users.findById(operator)).thenReturn(Optional.of(manager));
        mvc = MockMvcBuilders.standaloneSetup(new SupportController(records, store), new AdminController(admin))
                .setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void memberAsksAdminAnswersAndMemberSeesTheAnswer() throws Exception {
        authenticate(member, "USER");
        String created = mvc.perform(post("/api/support/tickets").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"알림이 안 와요\",\"body\":\"루틴 알림이 오지 않아요\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = mapper.readTree(created).path("data").path("id").asText();
        // 일반 계정은 관리자 목록을 볼 수 없다
        mvc.perform(get("/api/admin/tickets")).andExpect(status().isForbidden());

        authenticate(operator, "ADMIN");
        mvc.perform(get("/api/admin/tickets")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].ownerId").value(member));
        String path = "/api/admin/tickets/" + id;
        // 답변 완료는 답변이 있어야 한다
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(Map.of("userId", member, "version", 1, "reply", " ", "status", "ANSWERED")))).andExpect(status().isBadRequest());
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(Map.of("userId", member, "version", 1, "reply", "확인하고 있어요", "status", "IN_PROGRESS"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.version").value(2)).andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
        // 받은 version이 오래되면 409다
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(Map.of("userId", member, "version", 1, "reply", "다른 답변", "status", "ANSWERED")))).andExpect(status().isConflict());
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body(Map.of("userId", member, "version", 2, "reply", "고쳤어요", "status", "ANSWERED")))).andExpect(status().isOk());

        authenticate(member, "USER");
        mvc.perform(get("/api/support/tickets")).andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.items[0].reply").value("고쳤어요")).andExpect(jsonPath("$.data.items[0].status").value("ANSWERED"));
    }

    @Test void memberCannotSetStatusOrReplyThemselves() throws Exception {
        authenticate(member, "USER");
        mvc.perform(post("/api/support/tickets").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"x\",\"body\":\"y\",\"status\":\"ANSWERED\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/support/tickets").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"x\",\"body\":\"y\",\"reply\":\"z\"}")).andExpect(status().isBadRequest());
    }

    private String body(Map<String, Object> value) throws Exception { return mapper.writeValueAsString(value); }
    private void authenticate(String user, String role) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, "test@example.test", role), null, List.of()));
    }
}
