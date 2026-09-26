package kr.timebar.diary.auth.dto;

public record LoginResponse(
        String userId,
        String email,
        String nickname,
        String role,
        String accessToken,
        String refreshToken
) {
}
