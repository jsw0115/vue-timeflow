package kr.timebar.diary.planner.preferences;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "planner_preference")
public class PlannerPreferenceEntity {
    @Id
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_view", nullable = false, length = 10)
    private PlannerDefaultView defaultView;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PlannerPreferenceEntity() {
    }

    public PlannerPreferenceEntity(String userId, PlannerDefaultView defaultView) {
        this.userId = userId;
        this.defaultView = defaultView;
    }

    public String getUserId() {
        return userId;
    }

    public PlannerDefaultView getDefaultView() {
        return defaultView;
    }

    public long getPublicVersion() {
        // 공개 버전 0은 미저장 설정 전용이다. JPA의 최초 저장 버전 0과 구분한다.
        if (version == null) {
            throw new IllegalStateException("저장되기 전에는 설정 버전을 반환할 수 없습니다.");
        }
        return Math.addExact(version, 1);
    }

    public void changeDefaultView(PlannerDefaultView defaultView) {
        this.defaultView = defaultView;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
