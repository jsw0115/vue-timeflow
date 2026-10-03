package kr.timebar.diary.task.checklist;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ApiExceptionHandler;
import kr.timebar.diary.common.ErrorCode;
import kr.timebar.diary.security.AuthUserPrincipal;
import kr.timebar.diary.task.checklist.dto.ChecklistItemResponse;
import kr.timebar.diary.task.checklist.dto.CreateChecklistItemRequest;
import kr.timebar.diary.task.checklist.dto.SetChecklistCompletionRequest;
import kr.timebar.diary.task.checklist.dto.TaskAssigneeResponse;
import kr.timebar.diary.task.checklist.dto.UpdateChecklistItemRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TaskChecklistControllerTest {

    private static final String OWNER = "01J00000000000000000000001";
    private static final String CANDIDATE = "01J00000000000000000000002";
    private static final String ITEMS_PATH = "/api/tasks/task/checklist-items";
    private static final String ASSIGNEES_PATH = "/api/tasks/task/assignees";

    private TaskChecklistService checklistService;
    private TaskAssigneeService assigneeService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        checklistService = mock(TaskChecklistService.class);
        assigneeService = mock(TaskAssigneeService.class);
        mvc = MockMvcBuilders.standaloneSetup(new TaskChecklistController(checklistService),
                        new TaskAssigneeController(assigneeService))
                .setControllerAdvice(new ApiExceptionHandler()).build();
        var principal = new AuthUserPrincipal(OWNER, "owner@example.test", "USER");
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(principal, null, List.of()));
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void allEightEndpointsUseAuthenticatedOwnerAndExpectedResponseShapes() throws Exception {
        ChecklistItemResponse item = new ChecklistItemResponse("item", "검토", false, CANDIDATE, 1);
        TaskAssigneeResponse candidate = new TaskAssigneeResponse(CANDIDATE, "담당자");
        when(checklistService.list(OWNER, "task")).thenReturn(List.of(item));
        when(checklistService.create(OWNER, "task", new CreateChecklistItemRequest("검토", CANDIDATE)))
                .thenReturn(item);
        when(assigneeService.list(OWNER, "task")).thenReturn(List.of(candidate));
        when(assigneeService.add(OWNER, "task", CANDIDATE)).thenReturn(candidate);
        mvc.perform(get(ITEMS_PATH)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].assigneeId").value(CANDIDATE));
        mvc.perform(post(ITEMS_PATH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"검토\",\"assigneeId\":\"" + CANDIDATE + "\",\"ownerId\":\"other\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.version").value(1));
        mvc.perform(put(ITEMS_PATH + "/item").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"수정\",\"assigneeId\":null,\"version\":1}"))
                .andExpect(status().isOk());
        mvc.perform(put(ITEMS_PATH + "/item/completion").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true,\"version\":1}"))
                .andExpect(status().isOk());
        mvc.perform(delete(ITEMS_PATH + "/item").param("version", "1"))
                .andExpect(status().isNoContent()).andExpect(content().string(""));
        mvc.perform(get(ASSIGNEES_PATH)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].nickname").value("담당자"));
        mvc.perform(put(ASSIGNEES_PATH + "/" + CANDIDATE)).andExpect(status().isOk());
        mvc.perform(delete(ASSIGNEES_PATH + "/" + CANDIDATE))
                .andExpect(status().isNoContent()).andExpect(content().string(""));
        verify(checklistService).update(OWNER, "task", "item", new UpdateChecklistItemRequest("수정", null, 1L));
        verify(checklistService).setCompletion(OWNER, "task", "item", new SetChecklistCompletionRequest(true, 1L));
        verify(checklistService).delete(OWNER, "task", "item", 1);
        verify(assigneeService).remove(OWNER, "task", CANDIDATE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"title\":\" \"}", "{\"title\":\"title\",\"assigneeId\":\"invalid\"}", "{"})
    void invalidCreateBodyFailsBeforeCallingService(String body) throws Exception {
        mvc.perform(post(ITEMS_PATH).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.success").value(false));
        verifyNoInteractions(checklistService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"title\":\"title\"}", "{\"title\":\"title\",\"version\":0}",
            "{\"title\":\"title\",\"version\":-1}", "{\"title\":\"title\",\"version\":\"invalid\"}"})
    void missingOrInvalidVersionForUpdateIsBadRequest(String body) throws Exception {
        mvc.perform(put(ITEMS_PATH + "/item").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(checklistService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"version\":1}", "{\"completed\":true}", "{\"completed\":null,\"version\":1}"})
    void completionRequiresBothExplicitStateAndVersion(String body) throws Exception {
        mvc.perform(put(ITEMS_PATH + "/item/completion").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(checklistService);
    }

    @Test
    void oversizedTitleIsBadRequest() throws Exception {
        mvc.perform(post(ITEMS_PATH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + "x".repeat(201) + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(checklistService);
    }

    @Test
    void deleteMissingOrNonNumericVersionIsBadRequest() throws Exception {
        mvc.perform(delete(ITEMS_PATH + "/item")).andExpect(status().isBadRequest());
        mvc.perform(delete(ITEMS_PATH + "/item").param("version", "invalid"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(checklistService);
    }

    @Test
    void ownershipAndDatabaseVersionErrorsKeepTheirHttpStatuses() throws Exception {
        when(checklistService.list(OWNER, "task")).thenThrow(new ApiException(ErrorCode.NOT_FOUND));
        doThrow(new OptimisticLockingFailureException("private database information"))
                .when(checklistService).delete(OWNER, "task", "item", 1);
        mvc.perform(get(ITEMS_PATH)).andExpect(status().isNotFound());
        mvc.perform(delete(ITEMS_PATH + "/item").param("version", "1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("다른 요청에서 변경되었습니다. 다시 조회해주세요."));
    }

    @Test
    void unauthenticatedRequestIsRejectedWithoutCallingEitherService() throws Exception {
        SecurityContextHolder.clearContext();
        mvc.perform(get(ITEMS_PATH)).andExpect(status().isUnauthorized());
        mvc.perform(put(ASSIGNEES_PATH + "/" + CANDIDATE)).andExpect(status().isUnauthorized());
        verifyNoInteractions(checklistService, assigneeService);
    }

    @Test
    void unexpectedFailureDoesNotExposeExceptionDetails() throws Exception {
        when(assigneeService.list(OWNER, "task")).thenThrow(new IllegalStateException("secret-sql"));
        mvc.perform(get(ASSIGNEES_PATH)).andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value(ErrorCode.INTERNAL_ERROR.defaultMessage()));
    }

    @Test
    void unsupportedMethodAndMediaKeepHttp405And415() throws Exception {
        mvc.perform(patch(ITEMS_PATH)).andExpect(status().isMethodNotAllowed());
        mvc.perform(post(ITEMS_PATH).contentType(MediaType.TEXT_PLAIN).content("title"))
                .andExpect(status().isUnsupportedMediaType());
        verifyNoInteractions(checklistService);
    }

    @Test
    void rawJpaLockFailureBecomesConflictWithoutSqlDetails() throws Exception {
        doThrow(new jakarta.persistence.PessimisticLockException("private-sql"))
                .when(checklistService).delete(OWNER, "task", "item", 1);
        mvc.perform(delete(ITEMS_PATH + "/item").param("version", "1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("다른 요청에서 변경되었습니다. 다시 조회해주세요."));
    }

    @Test
    void legacyUuidAssigneeIsAcceptedWithoutReassigningTheirAccountId() throws Exception {
        String legacyId = "6e41b3ca-ec09-4a7b-a42a-cfb41525e3c7";
        CreateChecklistItemRequest request = new CreateChecklistItemRequest("UUID 담당", legacyId);
        when(checklistService.create(OWNER, "task", request))
                .thenReturn(new ChecklistItemResponse("item", "UUID 담당", false, legacyId, 1));
        mvc.perform(post(ITEMS_PATH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"UUID 담당\",\"assigneeId\":\"" + legacyId + "\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.assigneeId").value(legacyId));
        verify(checklistService).create(OWNER, "task", request);
    }
}
