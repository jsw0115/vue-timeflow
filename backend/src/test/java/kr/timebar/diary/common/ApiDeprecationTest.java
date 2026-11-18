// 구형 일정·루틴 API가 응답 본문은 유지한 채 폐지 예정 헤더를 붙이는지 검증한다(UT-103).
package kr.timebar.diary.common;

import kr.timebar.diary.event.EventController;
import kr.timebar.diary.event.EventService;
import kr.timebar.diary.routine.RoutineController;
import kr.timebar.diary.routine.RoutineService;
import kr.timebar.diary.security.AuthUserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SuppressWarnings("deprecation")
class ApiDeprecationTest {
    private final EventService events = mock(EventService.class);
    private final RoutineService routines = mock(RoutineService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new EventController(events), new RoutineController(routines))
                .setControllerAdvice(new ApiExceptionHandler()).build();
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                new AuthUserPrincipal("user-1", "test@example.test", "USER"), null, List.of()));
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void legacyEventsKeepTheirBodyAndAnnounceTheSuccessor() throws Exception {
        when(events.search(eq("user-1"), any(), any(), any(), any())).thenReturn(List.of());
        mvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(header().string("Deprecation", "@1794960000"))
                .andExpect(header().string("Link", "</api/schedules>; rel=\"successor-version\""));
    }

    @Test
    void legacyRoutinesKeepTheirBodyAndAnnounceTheSuccessor() throws Exception {
        when(routines.list("user-1")).thenReturn(List.of());
        mvc.perform(get("/api/routines"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(header().string("Deprecation", "@1794960000"))
                .andExpect(header().string("Link", "</api/routine-records>; rel=\"successor-version\""));
    }

    @Test
    void errorResponsesFromLegacyApisAreAlsoMarked() throws Exception {
        SecurityContextHolder.clearContext();
        mvc.perform(get("/api/events"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Deprecation", "@1794960000"));
    }
}
