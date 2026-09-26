package kr.timebar.diary.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import kr.timebar.diary.common.UlidGenerator;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** 기존 auth_db.login_throttle 테이블 매핑. 이메일 또는 IP 기준 로그인 실패 횟수를 세어 5회 실패 시 15분 잠근다. */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "login_throttle")
public class LoginThrottleEntity {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_MINUTES = 15;

    @Id
    @Column(length = 26)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "key_type", nullable = false, length = 10)
    private ThrottleKeyType keyType;

    @Column(name = "key_val", nullable = false)
    private String keyVal;

    @Column(name = "fail_cnt", nullable = false)
    private int failCount;

    @Column(name = "lock_utc")
    private LocalDateTime lockedUntil;

    @Column(name = "last_fail_utc")
    private LocalDateTime lastFailAt;

    @Column(name = "u_at", nullable = false)
    private LocalDateTime updatedAt;

    public LoginThrottleEntity(ThrottleKeyType keyType, String keyVal) {
        this.id = UlidGenerator.newUlid();
        this.keyType = keyType;
        this.keyVal = keyVal;
        this.failCount = 0;
    }

    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }

    public void recordFailure() {
        failCount++;
        lastFailAt = LocalDateTime.now();
        if (failCount >= MAX_ATTEMPTS) {
            lockedUntil = LocalDateTime.now().plusMinutes(LOCK_MINUTES);
        }
    }

    public void recordSuccess() {
        failCount = 0;
        lockedUntil = null;
    }

    @PrePersist
    @PreUpdate
    protected void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
