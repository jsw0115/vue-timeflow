package kr.timebar.diary.planner.preferences;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;
import org.mockito.InOrder;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class PlannerPreferenceServiceTest {
    private static final String USER_ID = "01USER00000000000000000000";

    private PlannerPreferenceRepository repository;
    private EntityManager entityManager;
    private PlannerPreferenceService service;
    private UserEntity user;

    @BeforeEach
    void setUp() {
        repository = mock(PlannerPreferenceRepository.class);
        entityManager = mock(EntityManager.class);
        service = new PlannerPreferenceService(repository, entityManager);
        user = mock(UserEntity.class);
        when(user.isActive()).thenReturn(true);
        when(user.getIsEnabled()).thenReturn(1);
        when(entityManager.find(UserEntity.class, USER_ID)).thenReturn(user);
        when(entityManager.find(UserEntity.class, USER_ID, LockModeType.PESSIMISTIC_WRITE)).thenReturn(user);
        when(repository.findById(USER_ID)).thenReturn(Optional.empty());
    }

    @Test
    void absentPreferenceReturnsDailyWithoutCreatingARow() {
        assertEquals(PlannerPreferenceResponse.defaults(), service.get(USER_ID));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void storedPreferenceExposesPublicVersion() {
        when(repository.findById(USER_ID)).thenReturn(Optional.of(stored(PlannerDefaultView.YEARLY, 2)));

        assertEquals(new PlannerPreferenceResponse(PlannerDefaultView.YEARLY, 3), service.get(USER_ID));
    }

    @Test
    void firstSaveLocksUserAndReturnsVersionOneAfterFlush() {
        when(repository.saveAndFlush(any())).thenAnswer(invocation -> {
            PlannerPreferenceEntity preference = invocation.getArgument(0);
            ReflectionTestUtils.setField(preference, "version", 0L);
            assertEquals(USER_ID, preference.getUserId());
            return preference;
        });

        PlannerPreferenceResponse response = service.update(USER_ID, request(PlannerDefaultView.WEEKLY, 0));

        assertEquals(new PlannerPreferenceResponse(PlannerDefaultView.WEEKLY, 1), response);
        InOrder order = inOrder(entityManager, repository);
        order.verify(entityManager).find(UserEntity.class, USER_ID, LockModeType.PESSIMISTIC_WRITE);
        order.verify(repository).findById(USER_ID);
        order.verify(repository).saveAndFlush(any());
    }

    @Test
    void nonzeroVersionCannotCreateAnAbsentPreference() {
        assertError(ErrorCode.CONFLICT, () -> service.update(USER_ID, request(PlannerDefaultView.WEEKLY, 1)));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void versionZeroCannotOverwriteTheFirstStoredPreference() {
        PlannerPreferenceEntity preference = stored(PlannerDefaultView.WEEKLY, 0);
        when(repository.findById(USER_ID)).thenReturn(Optional.of(preference));

        assertError(ErrorCode.CONFLICT, () -> service.update(USER_ID, request(PlannerDefaultView.MONTHLY, 0)));

        assertEquals(PlannerDefaultView.WEEKLY, preference.getDefaultView());
        verify(repository, never()).flush();
    }

    @Test
    void updateFlushesBeforeReturningTheNewOptimisticVersion() {
        PlannerPreferenceEntity preference = stored(PlannerDefaultView.WEEKLY, 2);
        when(repository.findById(USER_ID)).thenReturn(Optional.of(preference));
        doAnswer(invocation -> {
            ReflectionTestUtils.setField(preference, "version", 3L);
            return null;
        }).when(repository).flush();

        assertEquals(new PlannerPreferenceResponse(PlannerDefaultView.MONTHLY, 4),
                service.update(USER_ID, request(PlannerDefaultView.MONTHLY, 3)));
        verify(repository).flush();
    }

    @Test
    void missingUserIsUnauthorizedOnReadAndWrite() {
        when(entityManager.find(UserEntity.class, USER_ID)).thenReturn(null);
        when(entityManager.find(UserEntity.class, USER_ID, LockModeType.PESSIMISTIC_WRITE)).thenReturn(null);

        assertError(ErrorCode.TOKEN_INVALID, () -> service.get(USER_ID));
        assertError(ErrorCode.TOKEN_INVALID, () -> service.update(USER_ID, request(PlannerDefaultView.DAILY, 0)));
        verifyNoInteractions(repository);
    }

    @Test
    void inactiveUserCannotReadOrWritePreferences() {
        when(user.isActive()).thenReturn(false);

        assertError(ErrorCode.ACCOUNT_DISABLED, () -> service.get(USER_ID));
        assertError(ErrorCode.ACCOUNT_DISABLED, () -> service.update(USER_ID, request(PlannerDefaultView.DAILY, 0)));
        verifyNoInteractions(repository);
    }

    @Test
    void disabledFlagBlocksAnOtherwiseActiveUser() {
        when(user.getIsEnabled()).thenReturn(0);

        assertError(ErrorCode.ACCOUNT_DISABLED, () -> service.get(USER_ID));
        assertError(ErrorCode.ACCOUNT_DISABLED, () -> service.update(USER_ID, request(PlannerDefaultView.DAILY, 0)));
        verifyNoInteractions(repository);
    }

    @Test
    void invalidServiceInputFailsBeforeAnyDatabaseAccess() {
        List<PlannerPreferenceRequest> invalidRequests = List.of(
                new PlannerPreferenceRequest(null, 0L),
                new PlannerPreferenceRequest(PlannerDefaultView.DAILY, null),
                new PlannerPreferenceRequest(PlannerDefaultView.DAILY, -1L));

        for (PlannerPreferenceRequest request : invalidRequests) {
            assertError(ErrorCode.VALIDATION_FAILED, () -> service.update(USER_ID, request));
        }
        assertError(ErrorCode.VALIDATION_FAILED, () -> service.update(USER_ID, null));
        verifyNoInteractions(entityManager, repository);
    }

    @Test
    void databaseOptimisticConflictIsPropagatedForTheHttpHandler() {
        when(repository.findById(USER_ID)).thenReturn(Optional.of(stored(PlannerDefaultView.DAILY, 0)));
        OptimisticLockingFailureException failure = new OptimisticLockingFailureException("stale version");
        doThrow(failure).when(repository).flush();

        assertSame(failure, assertThrows(OptimisticLockingFailureException.class,
                () -> service.update(USER_ID, request(PlannerDefaultView.WEEKLY, 1))));
    }

    private PlannerPreferenceEntity stored(PlannerDefaultView defaultView, long version) {
        PlannerPreferenceEntity preference = new PlannerPreferenceEntity(USER_ID, defaultView);
        ReflectionTestUtils.setField(preference, "version", version);
        return preference;
    }

    private PlannerPreferenceRequest request(PlannerDefaultView defaultView, long version) {
        return new PlannerPreferenceRequest(defaultView, version);
    }

    private void assertError(ErrorCode expected, Executable executable) {
        assertEquals(expected, assertThrows(ApiException.class, executable).errorCode());
    }
}
