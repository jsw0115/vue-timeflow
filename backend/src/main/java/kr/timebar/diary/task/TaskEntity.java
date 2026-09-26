package kr.timebar.diary.task;

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

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 기존 task_db.task 테이블 그대로 매핑한다 — 카테고리는 조인 없이 cat_* 컬럼에 비정규화되어 저장된다. */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "task")
public class TaskEntity {

    @Id
    @Column(length = 26)
    private String id;

    @Column(name = "user_id", nullable = false, length = 26)
    private String userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "st", nullable = false, length = 20)
    private TaskStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "pri", nullable = false, length = 20)
    private TaskPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "energy_lvl", nullable = false, length = 20)
    private EnergyLevel energyLevel;

    @Column(name = "duration_min", nullable = false)
    private int durationMin;

    private LocalDate due;

    @Column(name = "cat_id", length = 26)
    private String categoryId;

    @Column(name = "cat_name", length = 60)
    private String categoryName;

    @Column(name = "cat_color", length = 7)
    private String categoryColor;

    @Column(name = "cat_icon", length = 16)
    private String categoryIcon;

    @Column(name = "event_id", length = 26)
    private String eventId;

    @Column(name = "is_repeat", nullable = false)
    private boolean repeat;

    @Column(name = "c_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "u_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "d_at")
    private LocalDateTime deletedAt;

    public TaskEntity(String userId, String title, String note, TaskPriority priority, EnergyLevel energyLevel,
            int durationMin, LocalDate due, String categoryId, String categoryName, String categoryColor, String categoryIcon) {
        this.id = UlidGenerator.newUlid();
        this.userId = userId;
        this.title = title;
        this.note = note;
        this.status = TaskStatus.TODO;
        this.priority = priority == null ? TaskPriority.MEDIUM : priority;
        this.energyLevel = energyLevel == null ? EnergyLevel.MEDIUM : energyLevel;
        this.durationMin = durationMin <= 0 ? 30 : durationMin;
        this.due = due;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categoryColor = categoryColor;
        this.categoryIcon = categoryIcon;
    }

    public void applyUpdate(String title, String note, TaskPriority priority, EnergyLevel energyLevel, int durationMin,
            LocalDate due, String categoryId, String categoryName, String categoryColor, String categoryIcon) {
        this.title = title;
        this.note = note;
        this.priority = priority == null ? TaskPriority.MEDIUM : priority;
        this.energyLevel = energyLevel == null ? EnergyLevel.MEDIUM : energyLevel;
        this.durationMin = durationMin <= 0 ? 30 : durationMin;
        this.due = due;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.categoryColor = categoryColor;
        this.categoryIcon = categoryIcon;
    }

    public void toggleStatus() {
        this.status = this.status == TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
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
