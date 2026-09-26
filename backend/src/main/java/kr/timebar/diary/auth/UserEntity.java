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

/** 기존 auth_db.users 테이블 그대로 매핑한다 — 이미 실사용자 6명이 들어있는 실 스키마. */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @Column(length = 26)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "pw_hash", nullable = false)
    private String passwordHash;

    @Column(name = "nick", nullable = false, length = 80)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "st", nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "tz", nullable = false, length = 64)
    private String timeZone;

    @Column(name = "email_vfy", nullable = false)
    private boolean emailVerified;

    @Column(name = "last_login_utc")
    private LocalDateTime lastLoginUtc;

    @Column(name = "pw_chg_utc")
    private LocalDateTime passwordChangedUtc;

    @Column(name = "c_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "u_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "d_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_enabled")
    private Integer isEnabled;

    public UserEntity(String email, String nickname, String passwordHash, UserRole role, UserStatus status) {
        this.id = UlidGenerator.newUlid();
        this.email = email;
        this.nickname = nickname;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = status;
        this.timeZone = "Asia/Seoul";
        this.emailVerified = false;
    }

    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.passwordChangedUtc = LocalDateTime.now();
    }

    public void changeProfile(String nickname) {
        this.nickname = nickname;
    }

    public void recordLogin() {
        this.lastLoginUtc = LocalDateTime.now();
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE && deletedAt == null;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
