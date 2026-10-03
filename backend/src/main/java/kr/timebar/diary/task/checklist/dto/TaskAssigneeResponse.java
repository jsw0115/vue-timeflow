package kr.timebar.diary.task.checklist.dto;

import kr.timebar.diary.auth.UserEntity;

public record TaskAssigneeResponse(String userId, String nickname) {

    public static TaskAssigneeResponse from(UserEntity user) {
        return new TaskAssigneeResponse(user.getId(), user.getNickname());
    }
}
