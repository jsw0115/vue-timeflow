package kr.timebar.diary.auth;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LoginThrottleRepository extends JpaRepository<LoginThrottleEntity, String> {

    /** 동시 로그인 실패 카운트 경합을 막기 위해 비관적 락(PESSIMISTIC_WRITE)으로 조회한다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from LoginThrottleEntity t where t.keyType = :keyType and t.keyVal = :keyVal")
    Optional<LoginThrottleEntity> findForUpdate(@Param("keyType") ThrottleKeyType keyType, @Param("keyVal") String keyVal);
}
