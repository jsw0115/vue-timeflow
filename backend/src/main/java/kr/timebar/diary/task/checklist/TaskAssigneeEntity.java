package kr.timebar.diary.task.checklist;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import kr.timebar.diary.common.UlidGenerator;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "task_assignee", uniqueConstraints = {
        @UniqueConstraint(name = "uk_task_assignee", columnNames = {"task_id", "user_id"})
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TaskAssigneeEntity {

    @Id
    @Column(length = 26)
    private String id;

    @Column(name = "task_id", nullable = false, length = 26)
    private String taskId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    public TaskAssigneeEntity(String taskId, String userId) {
        this.id = UlidGenerator.newUlid();
        this.taskId = taskId;
        this.userId = userId;
    }
}
