package kr.timebar.diary.security;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** 컨트롤러에서 로그인 사용자 ID를 안전하게 뽑아내는 헬퍼. principal 타입이 다르면 401로 명확히 실패한다. */
public final class CurrentUser {
    private CurrentUser() {
    }

    public static String id() {
        return id(SecurityContextHolder.getContext().getAuthentication());
    }

    public static String id(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUserPrincipal principal)) {
            throw new ApiException(ErrorCode.TOKEN_INVALID, "인증이 필요합니다.");
        }
        return principal.userId();
    }
}
