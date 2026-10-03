package kr.timebar.diary.common;

public final class UserIdentifier {

    public static final String PATTERN = "(?:[0-9A-HJKMNP-TV-Z]{26}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-"
            + "[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})";

    private UserIdentifier() {
    }
}
