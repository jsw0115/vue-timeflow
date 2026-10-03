package kr.timebar.diary.chat.domain;

import java.text.Normalizer;
import java.util.*;

public final class ChatSearch {
    private ChatSearch() {}
    public static String normalize(String text) { return Normalizer.normalize(text, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT); }
    public static List<String> grams(String text) {
        int[] points = normalize(text).codePoints().toArray();
        Set<String> result = new LinkedHashSet<>();
        for (int size = 1; size <= 3; size++) for (int i = 0; i + size <= points.length; i++) result.add(new String(points, i, size));
        return List.copyOf(result);
    }
    public static List<String> queryGrams(String query) {
        int[] points = normalize(query).codePoints().toArray();
        int size = Math.min(3, points.length);
        if (size == 0) return List.of();
        Set<String> result = new LinkedHashSet<>();
        // At most eight indexed probes; exact substring verification removes false positives.
        int length = points.length - size + 1;
        for (int n = 0; n < Math.min(8, length); n++) result.add(new String(points, n * (length - 1) / Math.max(1, Math.min(8, length) - 1), size));
        return List.copyOf(result);
    }
}
