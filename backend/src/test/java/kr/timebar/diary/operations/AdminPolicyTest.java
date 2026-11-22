// 관리자 정책 보기가 관리자에게만, 서버가 실제로 쓰는 값만, 비밀값 없이 보이는지 검사한다(Q-30).
package kr.timebar.diary.operations;

import kr.timebar.diary.auth.LoginThrottleEntity;
import kr.timebar.diary.auth.PasswordPolicy;
import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.auth.UserRole;
import kr.timebar.diary.auth.UserStatus;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.contract.AdminPolicyController;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.security.AuthUserPrincipal;
import kr.timebar.diary.security.JwtProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(FeatureTestConfig.class)
class AdminPolicyTest {
    @Autowired AdminService admin;
    @Autowired UserRepository users;
    MockMvc mvc;
    String member;
    String operator;

    @BeforeEach void setup() {
        var user = new UserEntity("policy-member@example.test", "회원", "hash", UserRole.USER, UserStatus.ACTIVE);
        var manager = new UserEntity("policy-admin@example.test", "운영자", "hash", UserRole.ADMIN, UserStatus.ACTIVE);
        member = user.getId(); operator = manager.getId();
        when(users.findById(member)).thenReturn(Optional.of(user));
        when(users.findById(operator)).thenReturn(Optional.of(manager));
        var jwt = new JwtProperties(); jwt.setSecret("never-shown-secret-value"); jwt.setAccessTtlSeconds(600);
        mvc = MockMvcBuilders.standaloneSetup(new AdminPolicyController(admin, jwt)).setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void adminSeesTheValuesTheServerEnforcesWithoutSecrets() throws Exception {
        authenticate(operator, "ADMIN");
        mvc.perform(get("/api/admin/policy")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.password.minLength").value(PasswordPolicy.MIN_LENGTH))
                .andExpect(jsonPath("$.data.password.maxLength").value(PasswordPolicy.MAX_LENGTH))
                .andExpect(jsonPath("$.data.login.maxFailures").value(LoginThrottleEntity.MAX_ATTEMPTS))
                .andExpect(jsonPath("$.data.login.lockMinutes").value(LoginThrottleEntity.LOCK_MINUTES))
                .andExpect(jsonPath("$.data.session.accessTtlSeconds").value(600))
                .andExpect(jsonPath("$.data.uploads.attachmentMaxBytes").value(10 * 1024 * 1024))
                .andExpect(jsonPath("$.data.roles.length()").value(2))
                .andExpect(jsonPath("$.data.unsupported[0]").value("adminTwoFactor"))
                .andExpect(content().string(not(containsString("never-shown-secret-value"))))
                .andExpect(content().string(not(containsString("secret"))));
    }

    @Test void membersCannotReadPolicyAndThereIsNoWriteEndpoint() throws Exception {
        authenticate(member, "USER");
        mvc.perform(get("/api/admin/policy")).andExpect(status().isForbidden());
        authenticate(operator, "ADMIN");
        mvc.perform(put("/api/admin/policy")).andExpect(status().isMethodNotAllowed());
    }

    private void authenticate(String user, String role) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, "test@example.test", role), null, List.of()));
    }
}
