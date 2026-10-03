package kr.timebar.diary.planner.preferences;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record PlannerPreferenceRequest(
        @NotNull(message = "기본 보기를 선택해야 합니다.") PlannerDefaultView defaultView,
        @NotNull(message = "설정 버전이 필요합니다.")
        @PositiveOrZero(message = "설정 버전은 0 이상이어야 합니다.") Long version) {
}
