package kr.timebar.diary.planner.preferences;

public record PlannerPreferenceResponse(PlannerDefaultView defaultView, long version) {
    public static PlannerPreferenceResponse defaults() {
        return new PlannerPreferenceResponse(PlannerDefaultView.DAILY, 0);
    }

    public static PlannerPreferenceResponse from(PlannerPreferenceEntity preference) {
        return new PlannerPreferenceResponse(preference.getDefaultView(), preference.getPublicVersion());
    }
}
