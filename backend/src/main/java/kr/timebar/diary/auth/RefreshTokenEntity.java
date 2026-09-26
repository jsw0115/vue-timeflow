package kr.timebar.diary.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import kr.timebar.diary.common.UlidGenerator;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 기존 auth_db.refresh_token(단수) 테이블 매핑. 원문 대신 SHA-256 해시(tok_hash)만 저장한다.
 * device_id는 아직 기기별 세션 구분 UI가 없어 null로 둔다.
 */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "refresh_token")
public class RefreshTokenEntity {

    @Id
    @Column(length = 26)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "device_id", length = 128)
    private String deviceId;

    @Column(name = "tok_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "jti", length = 36)
    private String jti;

    @Column(name = "exp_utc", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "rev_utc")
    private LocalDateTime revokedAt;

    @Column(name = "last_used_utc")
    private LocalDateTime lastUsedAt;

    @Column(name = "c_at", nullable = false)
    private LocalDateTime createdAt;

    public RefreshTokenEntity(String userId, String tokenHash, LocalDateTime expiresAt) {
        this.id = UlidGenerator.newUlid();
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.jti = UUID.randomUUID().toString();
        this.expiresAt = expiresAt;
    }

    public boolean isActive() {
        return revokedAt == null && expiresAt.isAfter(LocalDateTime.now());
    }

    public void revoke() {
        this.revokedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
