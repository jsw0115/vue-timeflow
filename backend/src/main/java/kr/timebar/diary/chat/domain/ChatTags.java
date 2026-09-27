package kr.timebar.diary.chat.domain;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

public final class ChatTags {
    private static final Pattern HASHTAG=Pattern.compile("(?<![\\p{L}\\p{N}_])#([\\p{L}\\p{N}_-]{1,32})(?![\\p{L}\\p{N}_-])");
    private ChatTags() {}
    public static String normalize(String value) {
        String tag=Normalizer.normalize(value,Normalizer.Form.NFKC).toLowerCase(Locale.ROOT);
        if(!tag.matches("[\\p{L}\\p{N}_-]{1,32}") || tag.length()>32) throw new ApiException(ErrorCode.VALIDATION_FAILED,"태그는 한글·영문·숫자·밑줄·하이픈 1~32자입니다.");
        return tag;
    }
    public static List<String> extract(String text) {
        var matches=HASHTAG.matcher(Normalizer.normalize(text,Normalizer.Form.NFKC));
        Set<String> tags=new TreeSet<>();
        while(matches.find()) tags.add(normalize(matches.group(1)));
        if(tags.size()>10) throw new ApiException(ErrorCode.VALIDATION_FAILED,"메시지에는 태그를 10개까지 넣을 수 있습니다.");
        return List.copyOf(tags);
    }
}
