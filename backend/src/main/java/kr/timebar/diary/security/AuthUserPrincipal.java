package kr.timebar.diary.security;

/** JWT 클레임에서 복원한 인증 주체. SecurityContext의 Authentication#getPrincipal()로 전달된다. */
public record AuthUserPrincipal(String userId, String email, String role) {
}
