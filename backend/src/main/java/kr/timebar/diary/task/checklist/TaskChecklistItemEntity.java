package kr.timebar.diary.task.checklist;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import kr.timebar.diary.common.UlidGenerator;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Getter
@Entity
@Table(name = "task_checklist_item")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TaskChecklistItemEntity {

    @Id
    @Column(length = 26)
    private String id;

    @Column(name = "task_id", nullable = false, length = 26)
    private String taskId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private boolean completed;

    @Column(name = "assignee_id", length = 36)
    private String assigneeId;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public TaskChecklistItemEntity(String taskId, String title, String assigneeId) {
        this.id = UlidGenerator.newUlid();
        this.taskId = taskId;
        this.title = title;
        this.assigneeId = assigneeId;
    }

    public void updateDetails(String title, String assigneeId) {
        this.title = title;
        this.assigneeId = assigneeId;
    }

    public void setCompletion(boolean completed) {
        this.completed = completed;
    }

    public long getPublicVersion() {
        if (version == null) {
            throw new IllegalStateException("저장되기 전에는 항목 버전을 반환할 수 없습니다.");
        }
        return Math.addExact(version, 1);
    }

    @PrePersist
    protected void initializeTimestamps() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void updateTimestamp() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
