// 폐지 예정 API 응답에 RFC 9745 Deprecation 헤더와 대체 경로 Link 헤더를 붙인다.
package kr.timebar.diary.common;

import jakarta.servlet.http.HttpServletResponse;

public final class ApiDeprecation {
    /** 구형 일정·루틴 API를 폐지 예정으로 정한 시각(2026-11-18T00:00:00Z)의 Unix 초. IM-03 결정일이다. */
    public static final String LEGACY_SCHEDULE_DEPRECATED_AT = "@1794960000";

    private ApiDeprecation() {
    }

    /** 응답은 그대로 두고 헤더만 붙인다. 호출을 막는 것은 구형 제거 작업에서 한다. */
    public static void mark(HttpServletResponse response, String deprecatedAt, String successorPath) {
        response.setHeader("Deprecation", deprecatedAt);
        response.setHeader("Link", "<" + successorPath + ">; rel=\"successor-version\"");
    }
}
