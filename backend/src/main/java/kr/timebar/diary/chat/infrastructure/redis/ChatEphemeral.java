package kr.timebar.diary.chat.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.chat.config.ChatConfiguration;
import kr.timebar.diary.chat.domain.ChatModels.Signal;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.util.List;

@Component
@ConditionalOnProperty(name="app.chat.enabled",havingValue="true")
public class ChatEphemeral {
    private static final DefaultRedisScript<Long> LIMIT = new DefaultRedisScript<>("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n",Long.class);
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    public ChatEphemeral(StringRedisTemplate redis,ObjectMapper mapper) {this.redis=redis;this.mapper=mapper;}
    public void limit(String user,String purpose,int maximum,int seconds) {
        Long count;
        try { count=redis.execute(LIMIT,List.of("timeflow:chat:rate:"+purpose+":"+user),Integer.toString(seconds)); }
        catch(org.springframework.data.redis.RedisConnectionFailureException | org.springframework.dao.QueryTimeoutException unavailable) {
            // Message persistence remains available during Redis outage; lookup must fail closed.
            if("lookup".equals(purpose)) throw new ApiException(ErrorCode.RATE_LIMITED);
            return;
        }
        if(count!=null&&count>maximum) throw new ApiException(ErrorCode.RATE_LIMITED);
    }
    public void typing(String room,String user) {
        try {
            if(Boolean.TRUE.equals(redis.opsForValue().setIfAbsent("timeflow:chat:typing:"+room+":"+user,"1",Duration.ofSeconds(2))))
                redis.convertAndSend(ChatConfiguration.CHANNEL,mapper.writeValueAsString(new Signal(room,"TYPING",user)));
        } catch(Exception ignored) { /* Typing is transient, never a reason to reject a saved message. */ }
    }
}
