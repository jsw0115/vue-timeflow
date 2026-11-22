package kr.timebar.diary.auth;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/** 비밀번호 정책: 8~72자, 공백 불가, 영문/숫자/특수문자 중 2종 이상 포함. */
@Component
public class PasswordPolicy {
    /** 관리자 정책 보기(/api/admin/policy)가 같은 값을 보이도록 상수로 둔다(Q-30). */
    public static final int MIN_LENGTH = 8;
    public static final int MAX_LENGTH = 72;
    public static final int MIN_KINDS = 2;
    private static final Pattern LETTER = Pattern.compile("[A-Za-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL = Pattern.compile("[^A-Za-z0-9\\s]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s");

    public void validateOrThrow(String rawPassword) {
        if (rawPassword == null || rawPassword.length() < MIN_LENGTH || rawPassword.length() > MAX_LENGTH) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "비밀번호는 8~72자여야 합니다.");
        }
        if (WHITESPACE.matcher(rawPassword).find()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "비밀번호에 공백을 포함할 수 없습니다.");
        }
        int kinds = 0;
        if (LETTER.matcher(rawPassword).find()) kinds++;
        if (DIGIT.matcher(rawPassword).find()) kinds++;
        if (SPECIAL.matcher(rawPassword).find()) kinds++;
        if (kinds < MIN_KINDS) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "비밀번호는 영문/숫자/특수문자 중 2종 이상을 포함해야 합니다.");
        }
    }
}
