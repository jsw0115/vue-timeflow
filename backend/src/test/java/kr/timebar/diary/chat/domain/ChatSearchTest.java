package kr.timebar.diary.chat.domain;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ChatSearchTest {
    @Test void normalizesWidthAndCaseAndKeepsKorean() {
        assertEquals("abc 회의",ChatSearch.normalize("ＡＢＣ 회의"));
        assertTrue(ChatSearch.grams("회의 🐻").contains("🐻"));
        assertTrue(ChatSearch.grams("회의 준비").contains("의 준"));
        assertEquals(java.util.List.of("획"),ChatSearch.queryGrams("획"));
        assertEquals(java.util.List.of("회의"),ChatSearch.queryGrams("회의"));
    }
    @Test void queryProbesAreBoundedAndExistInDocumentIndex() {
        String query="서로 함께 계획을 세우고 오늘의 모든 일을 확인하는 아주 긴 메시지";
        var probes=ChatSearch.queryGrams(query);
        assertTrue(probes.size()<=8);
        assertTrue(ChatSearch.grams("머리말 " + query + " 뒷말").containsAll(probes));
        assertTrue(ChatSearch.queryGrams("").isEmpty());
        assertEquals(3,ChatSearch.grams("aaaa").size());
    }
}
