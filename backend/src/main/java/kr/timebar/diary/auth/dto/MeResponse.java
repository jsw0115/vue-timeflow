package kr.timebar.diary.auth.dto;

public record MeResponse(String userId, String email, String nickname, String role) {
}
