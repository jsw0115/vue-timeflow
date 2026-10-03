package kr.timebar.diary.planner.preferences;

import java.util.List;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.security.AuthUserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PlannerPreferenceControllerTest {
    private static final String USER_ID = "01USER00000000000000000000";
    private static final String PATH = "/api/planner/preferences";

    private PlannerPreferenceService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(PlannerPreferenceService.class);
        mvc = MockMvcBuilders.standaloneSetup(new PlannerPreferenceController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
        AuthUserPrincipal principal = new AuthUserPrincipal(USER_ID, "owner@example.com", "USER");
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(principal, null, List.of()));
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getUsesAuthenticatedOwnerAndReturnsDefaultContract() throws Exception {
        when(service.get(USER_ID)).thenReturn(PlannerPreferenceResponse.defaults());

        mvc.perform(get(PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.defaultView").value("DAILY"))
                .andExpect(jsonPath("$.data.version").value(0));
        verify(service).get(USER_ID);
    }

    @ParameterizedTest
    @EnumSource(PlannerDefaultView.class)
    void putAcceptsEverySupportedViewAndReturnsSavedVersion(PlannerDefaultView defaultView) throws Exception {
        PlannerPreferenceRequest request = new PlannerPreferenceRequest(defaultView, 0L);
        when(service.update(USER_ID, request)).thenReturn(new PlannerPreferenceResponse(defaultView, 1));

        mvc.perform(put(PATH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"defaultView\":\"" + defaultView + "\",\"version\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.defaultView").value(defaultView.name()))
                .andExpect(jsonPath("$.data.version").value(1));
        verify(service).update(USER_ID, request);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{}",
            "{\"defaultView\":\"DAILY\"}",
            "{\"version\":0}",
            "{\"defaultView\":null,\"version\":0}",
            "{\"defaultView\":\"DAILY\",\"version\":-1}",
            "{\"defaultView\":\"QUARTERLY\",\"version\":0}",
            "{\"defaultView\":\"DAILY\",\"version\":\"invalid\"}",
            "{"
    })
    void invalidRequestIsBadRequestBeforeTheServiceRuns(String body) throws Exception {
        mvc.perform(put(PATH).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
        verifyNoInteractions(service);
    }

    @Test
    void staleVersionReturnsConflict() throws Exception {
        PlannerPreferenceRequest request = new PlannerPreferenceRequest(PlannerDefaultView.WEEKLY, 0L);
        when(service.update(USER_ID, request)).thenThrow(new ApiException(ErrorCode.CONFLICT));

        mvc.perform(put(PATH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"defaultView\":\"WEEKLY\",\"version\":0}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void missingAuthenticationIsUnauthorized() throws Exception {
        SecurityContextHolder.clearContext();

        mvc.perform(get(PATH))
                .andExpect(status().isUnauthorized());
        mvc.perform(put(PATH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"defaultView\":\"DAILY\",\"version\":0}"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }
}
