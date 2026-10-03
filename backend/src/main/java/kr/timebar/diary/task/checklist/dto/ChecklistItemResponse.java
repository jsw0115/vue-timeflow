package kr.timebar.diary.task.checklist.dto;

import kr.timebar.diary.task.checklist.TaskChecklistItemEntity;

public record ChecklistItemResponse(
        String id,
        String title,
        boolean completed,
        String assigneeId,
        long version
) {
    public static ChecklistItemResponse from(TaskChecklistItemEntity item) {
        return new ChecklistItemResponse(item.getId(), item.getTitle(), item.isCompleted(),
                item.getAssigneeId(), item.getPublicVersion());
    }
}
