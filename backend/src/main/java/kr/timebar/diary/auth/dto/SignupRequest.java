package kr.timebar.diary.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SignupRequest(
        @NotBlank(message = "이메일을 입력해주세요.") @Email(message = "이메일 형식이 올바르지 않습니다.") String email,
        @NotBlank(message = "닉네임을 입력해주세요.") String nickname,
        @NotBlank(message = "비밀번호를 입력해주세요.") String password,
        @AssertTrue(message = "이용약관에 동의해주세요.") boolean agreeTerms,
        @AssertTrue(message = "개인정보 처리방침에 동의해주세요.") boolean agreePrivacy
) {
}
