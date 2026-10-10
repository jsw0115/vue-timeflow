// 목록 응답의 페이지 정보와 검색·날짜 필터를 일관되게 계산한다.
package kr.timebar.diary.feature;

import java.util.*;

public record FeaturePage(List<Map<String, Object>> items, int page, int size, long total) {
    public static FeaturePage of(List<Map<String, Object>> records, String from, String to, String q, String category, int page, int size) {
        if (page < 0 || size < 1 || size > 100) FeatureInput.fail("page는 0 이상, size는 1~100입니다.");
        if (from != null) FeatureInput.date(from);
        if (to != null) FeatureInput.date(to);
        if (from != null && to != null) FeatureInput.range(from, to);
        if (q != null && q.length() > 200) FeatureInput.fail("검색어는 최대 200자입니다.");
        String keyword = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        List<Map<String, Object>> filtered = records.stream().filter(row -> {
            String date = FeatureInput.text(row, "date");
            if (date.isEmpty()) date = FeatureInput.text(row, "startDate");
            if (date.isEmpty()) date = row.get("createdAt").toString().substring(0, 10);
            return (from == null || date.compareTo(from) >= 0) && (to == null || date.compareTo(to) <= 0)
                    && (category == null || category.equals(row.get("category")))
                    && (keyword.isEmpty() || (FeatureInput.text(row, "title") + " " + FeatureInput.text(row, "name") + " " + FeatureInput.text(row, "body")).toLowerCase(Locale.ROOT).contains(keyword));
        }).toList();
        int start = (int) Math.min((long) page * size, filtered.size());
        return new FeaturePage(filtered.subList(start, Math.min(start + size, filtered.size())), page, size, filtered.size());
    }
}
