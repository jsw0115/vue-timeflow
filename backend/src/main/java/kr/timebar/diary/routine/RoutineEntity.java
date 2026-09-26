package kr.timebar.diary.routine;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import kr.timebar.diary.common.UlidGenerator;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** 기존 routine_db.routine 테이블 그대로 매핑한다. 시간은 TIME이 아니라 "HH:mm" 문자열(char(5))로 저장된다. */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "routine")
public class RoutineEntity {

    private static final String DEFAULT_DAYS = "mon,tue,wed,thu,fri";

    @Id
    @Column(length = 26)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 16)
    private String icon;

    @Column(name = "cat_id", length = 26)
    private String categoryId;

    @Column(name = "cat_name", length = 60)
    private String categoryName;

    @Column(name = "cat_color", length = 7)
    private String categoryColor;

    @Column(name = "cat_icon", length = 16)
    private String categoryIcon;

    /** "HH:mm" 형식의 5자 문자열. */
    @Column(name = "at_time", nullable = false, length = 5)
    private String atTime;

    /** 소문자 콤마 구분 요일 코드, 예: "mon,wed,fri". */
    @Column(name = "days", nullable = false, length = 32)
    private String days;

    @Column(nullable = false)
    private boolean onoff;

    @Column(nullable = false)
    private boolean notify;

    @Column(name = "n_min")
    private Integer notifyMinutesBefore;

    @Column(name = "c_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "u_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "d_at")
    private LocalDateTime deletedAt;

    public RoutineEntity(String userId, String name, String atTime, String days, String icon, String categoryId,
            String categoryName, String categoryColor, String categoryIcon, boolean notify, Integer notifyMinutesBefore) {
        this.id = UlidGenerator.newUlid();
        this.userId = userId;
        this.name = name;
        this.atTime = atTime;
        this.days = (days == null || days.isBlank()) ? DEFAULT_DAYS : days.toLowerCase();
        this.icon = icon;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categoryColor = categoryColor;
        this.categoryIcon = categoryIcon;
        this.onoff = true;
        this.notify = notify;
        this.notifyMinutesBefore = notifyMinutesBefore;
    }

    public void applyUpdate(String name, String atTime, String days, String icon, String categoryId, String categoryName,
            String categoryColor, String categoryIcon, boolean onoff, boolean notify, Integer notifyMinutesBefore) {
        this.name = name;
        this.atTime = atTime;
        this.days = (days == null || days.isBlank()) ? DEFAULT_DAYS : days.toLowerCase();
        this.icon = icon;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categoryColor = categoryColor;
        this.categoryIcon = categoryIcon;
        this.onoff = onoff;
        this.notify = notify;
        this.notifyMinutesBefore = notifyMinutesBefore;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isOwnedBy(String userId) {
        return this.userId.equals(userId);
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
