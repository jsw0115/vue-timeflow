package kr.timebar.diary.chat.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.chat.config.ChatConfiguration;
import kr.timebar.diary.chat.domain.ChatModels.Signal;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name="app.chat.enabled",havingValue="true")
public class ChatOutboxPublisher {
    private final JdbcTemplate jdbc;
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    public ChatOutboxPublisher(JdbcTemplate jdbc,StringRedisTemplate redis,ObjectMapper mapper) {this.jdbc=jdbc;this.redis=redis;this.mapper=mapper;}
    @Scheduled(fixedDelayString="${app.chat.outbox-delay-ms:1000}")
    @Transactional public void publish() {
        var rows=jdbc.queryForList("SELECT id,room_id,event_type,attempts FROM chat_outbox WHERE published_at IS NULL AND available_at<=UTC_TIMESTAMP(6) ORDER BY id LIMIT 25 FOR UPDATE SKIP LOCKED");
        for(var row:rows) {
            try {
                redis.convertAndSend(ChatConfiguration.CHANNEL,mapper.writeValueAsString(new Signal((String)row.get("room_id"),(String)row.get("event_type"),null)));
                jdbc.update("UPDATE chat_outbox SET published_at=UTC_TIMESTAMP(6) WHERE id=?",row.get("id"));
            } catch(Exception error) {
                long delay=Math.min(300,1L<<Math.min(8,((Number)row.get("attempts")).intValue()));
                jdbc.update("UPDATE chat_outbox SET attempts=attempts+1,available_at=TIMESTAMPADD(SECOND,?,UTC_TIMESTAMP(6)) WHERE id=?",delay,row.get("id"));
                // One unavailable Redis endpoint should not consume a whole batch of network timeouts.
                break;
            }
        }
    }
    @Scheduled(fixedDelay=3600000) public void cleanup() {
        jdbc.update("DELETE FROM chat_outbox WHERE published_at<UTC_TIMESTAMP(6)-INTERVAL 7 DAY LIMIT 1000");
    }
}
