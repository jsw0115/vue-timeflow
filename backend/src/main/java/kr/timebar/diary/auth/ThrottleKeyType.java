package kr.timebar.diary.auth;

public enum ThrottleKeyType {
    EMAIL, IP,
    /** 비밀번호 변경의 현재 비밀번호 확인 실패. 키는 계정 ID이고 로그인 제한과 따로 센다. */
    PASSWORD
}
