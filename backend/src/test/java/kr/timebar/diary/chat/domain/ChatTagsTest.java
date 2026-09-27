package kr.timebar.diary.chat.domain;

import kr.timebar.diary.common.ApiException;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ChatTagsTest {
    @Test void unicodeNormalizationDeduplicationAndBoundary() {
        assertEquals(List.of("plan","회고"),ChatTags.extract("#회고 #ＰＬＡＮ #Plan 중간#아님"));
    }
    @Test void rejectsInvalidTagAndExcessiveTags() {
        assertThrows(ApiException.class,()->ChatTags.normalize("태그 공백"));
        assertThrows(ApiException.class,()->ChatTags.extract("#a #b #c #d #e #f #g #h #i #j #k"));
    }
}
