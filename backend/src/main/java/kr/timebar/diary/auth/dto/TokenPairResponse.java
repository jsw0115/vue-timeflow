package kr.timebar.diary.auth.dto;

public record TokenPairResponse(String accessToken, String refreshToken) {
}
