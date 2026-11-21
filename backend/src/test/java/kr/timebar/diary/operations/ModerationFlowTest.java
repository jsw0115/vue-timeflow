// 회원이 커뮤니티 글을 신고하면 관리자가 글 내용과 함께 보고 처리하며, 처리 뒤에는 다시 처리할 수 없는지 검증한다(PR-10 UF-117 7-7).
package kr.timebar.diary.operations;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.auth.UserRepository;
import kr.timebar.diary.auth.UserRole;
import kr.timebar.diary.auth.UserStatus;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.feature.FeatureStore;
import kr.timebar.diary.feature.FeatureTestConfig;
import kr.timebar.diary.feature.FeatureType;
import kr.timebar.diary.social.SocialService;
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
class ModerationFlowTest {
    @Autowired FeatureStore store;
    @Autowired SocialService social;
    @Autowired AdminService admin;
    @Autowired UserRepository users;
    @Autowired ObjectMapper mapper;
    MockMvc mvc;
    String writer;
    String reporter;
    String operator;

    @BeforeEach void setup() {
        store.deleteAll(FeatureStore.SYSTEM, FeatureType.AUDIT);
        var author = new UserEntity("writer@example.test", "작성자", "hash", UserRole.USER, UserStatus.ACTIVE);
        var viewer = new UserEntity("reporter@example.test", "신고자", "hash", UserRole.USER, UserStatus.ACTIVE);
        var manager = new UserEntity("admin@example.test", "운영자", "hash", UserRole.ADMIN, UserStatus.ACTIVE);
        writer = author.getId(); reporter = viewer.getId(); operator = manager.getId();
        when(users.findById(writer)).thenReturn(Optional.of(author));
        when(users.findById(reporter)).thenReturn(Optional.of(viewer));
        when(users.findById(operator)).thenReturn(Optional.of(manager));
        mvc = MockMvcBuilders.standaloneSetup(new ModerationController(store, social, admin)).setControllerAdvice(new ApiExceptionHandler()).build();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void memberReportsAdminSeesThePostAndRemovesItOnce() throws Exception {
        var community = social.createSpace(writer, FeatureType.COMMUNITY, Map.of("title", "운동 인증방", "joinPolicy", "open", "visibility", "public", "capacity", 10));
        String id = community.get("id").toString();
        social.join(reporter, FeatureType.COMMUNITY, id, Map.of());
        var post = social.createPost(writer, id, FeatureType.POST, Map.of("body", "광고 링크입니다"));
        String postId = post.get("id").toString();

        authenticate(reporter, "USER");
        String created = mvc.perform(post("/api/communities/" + id + "/posts/" + postId + "/report").contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"광고성 게시물\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String reportId = mapper.readTree(created).path("data").path("id").asText();
        mvc.perform(get("/api/admin/moderation")).andExpect(status().isForbidden());

        authenticate(operator, "ADMIN");
        mvc.perform(get("/api/admin/moderation")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + reportId + "')].postBody").value("광고 링크입니다"))
                .andExpect(jsonPath("$.data[?(@.id == '" + reportId + "')].communityTitle").value("운동 인증방"))
                .andExpect(jsonPath("$.data[?(@.id == '" + reportId + "')].ownerId").value(reporter));
        String decide = mapper.writeValueAsString(Map.of("userId", reporter, "version", 1, "action", "REMOVE"));
        mvc.perform(put("/api/admin/moderation/" + reportId).contentType(MediaType.APPLICATION_JSON).content(decide)).andExpect(status().isOk()).andExpect(jsonPath("$.data.decision").value("REMOVE"));
        // 글은 지워지고, 같은 신고를 다시 처리하면 409다
        org.junit.jupiter.api.Assertions.assertTrue(store.optional(id, FeatureType.POST, postId).isEmpty());
        mvc.perform(get("/api/admin/moderation")).andExpect(jsonPath("$.data[?(@.id == '" + reportId + "')].postBody").value(org.hamcrest.Matchers.contains((Object) null)));
        String again = mapper.writeValueAsString(Map.of("userId", reporter, "version", 2, "action", "IGNORE"));
        mvc.perform(put("/api/admin/moderation/" + reportId).contentType(MediaType.APPLICATION_JSON).content(again)).andExpect(status().isConflict());
    }

    private void authenticate(String user, String role) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(new AuthUserPrincipal(user, "test@example.test", role), null, List.of()));
    }
}
