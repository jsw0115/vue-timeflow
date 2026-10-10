// JDBC 드라이버의 컬럼 대소문자와 무관하게 API 필드 이름을 고정한다.
package kr.timebar.diary.feature;

import java.util.LinkedHashMap;
import java.util.Map;

public final class SqlResponses {
    private SqlResponses() { }
    public static Map<String,Object> fields(Map<String,Object> row, String... fields) {
        Map<String,Object> result = new LinkedHashMap<>();
        for (String field : fields) result.put(field, row.get(field));
        return result;
    }
}
