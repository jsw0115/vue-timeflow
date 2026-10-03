package kr.timebar.diary.planner.preferences;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import kr.timebar.diary.auth.UserEntity;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlannerPreferenceService {
    private final PlannerPreferenceRepository preferenceRepository;
    private final EntityManager entityManager;

    public PlannerPreferenceService(PlannerPreferenceRepository preferenceRepository, EntityManager entityManager) {
        this.preferenceRepository = preferenceRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public PlannerPreferenceResponse get(String userId) {
        requireActiveUser(entityManager.find(UserEntity.class, userId));
        return preferenceRepository.findById(userId)
                .map(PlannerPreferenceResponse::from)
                .orElseGet(PlannerPreferenceResponse::defaults);
    }

    @Transactional
    public PlannerPreferenceResponse update(String userId, PlannerPreferenceRequest request) {
        validateRequest(request);
        // 설정 행이 아직 없을 때에도 동일 사용자의 최초 삽입 경쟁을 직렬화한다.
        requireActiveUser(entityManager.find(UserEntity.class, userId, LockModeType.PESSIMISTIC_WRITE));
        PlannerPreferenceEntity preference = preferenceRepository.findById(userId).orElse(null);
        if (preference == null) {
            requireMatchingVersion(request.version(), 0);
            PlannerPreferenceEntity created = new PlannerPreferenceEntity(userId, request.defaultView());
            return PlannerPreferenceResponse.from(preferenceRepository.saveAndFlush(created));
        }
        requireMatchingVersion(request.version(), preference.getPublicVersion());
        preference.changeDefaultView(request.defaultView());
        preferenceRepository.flush();
        return PlannerPreferenceResponse.from(preference);
    }

    private void requireActiveUser(UserEntity user) {
        if (user == null) {
            throw new ApiException(ErrorCode.TOKEN_INVALID);
        }
        if (!user.isActive() || Integer.valueOf(0).equals(user.getIsEnabled())) {
            throw new ApiException(ErrorCode.ACCOUNT_DISABLED);
        }
    }

    private void validateRequest(PlannerPreferenceRequest request) {
        if (request == null || request.defaultView() == null || request.version() == null || request.version() < 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED);
        }
    }

    private void requireMatchingVersion(long expectedVersion, long actualVersion) {
        if (expectedVersion != actualVersion) {
            throw new ApiException(ErrorCode.CONFLICT, "플래너 설정이 변경되었습니다. 다시 조회해 주세요.");
        }
    }
}
