package kr.timebar.diary.common;

import java.security.SecureRandom;
import java.time.Instant;

/**
 * 정렬 가능한 26자 Crockford Base32 ULID 생성기. 앞 10자는 48비트 밀리초 타임스탬프,
 * 뒤 16자는 80비트 난수로 구성해 users/refresh_token/login_throttle 등 이 프로젝트의
 * 기존 스키마가 쓰는 char(26) 기본키 형식과 맞춘다.
 */
public final class UlidGenerator {
    private static final char[] CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    private UlidGenerator() {
    }

    public static String newUlid() {
        return newUlid(Instant.now().toEpochMilli());
    }

    static String newUlid(long timestampMillis) {
        StringBuilder sb = new StringBuilder(26);

        // 48비트 타임스탬프 -> 10자
        for (int i = 9; i >= 0; i--) {
            int shift = i * 5;
            sb.append(CROCKFORD_BASE32[(int) ((timestampMillis >>> shift) & 0x1F)]);
        }

        // 80비트(10바이트) 난수 -> 16자, 5비트씩 잘라 인코딩
        byte[] randomBytes = new byte[10];
        RANDOM.nextBytes(randomBytes);
        int bitBuffer = 0;
        int bitCount = 0;
        for (byte b : randomBytes) {
            bitBuffer = (bitBuffer << 8) | (b & 0xFF);
            bitCount += 8;
            while (bitCount >= 5) {
                bitCount -= 5;
                sb.append(CROCKFORD_BASE32[(bitBuffer >>> bitCount) & 0x1F]);
            }
        }
        return sb.toString();
    }
}
