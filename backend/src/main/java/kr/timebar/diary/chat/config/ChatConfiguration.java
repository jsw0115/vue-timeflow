package kr.timebar.diary.chat.config;

import kr.timebar.diary.chat.infrastructure.redis.ChatEventHub;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name="app.chat.enabled",havingValue="true")
public class ChatConfiguration {
    public static final String CHANNEL = "timeflow:chat:events:v1";
    @Bean public RedisMessageListenerContainer chatRedisListener(RedisConnectionFactory connectionFactory,ChatEventHub hub) {
        var listener = new RedisMessageListenerContainer();
        listener.setConnectionFactory(connectionFactory);
        listener.addMessageListener(hub,new ChannelTopic(CHANNEL));
        return listener;
    }
}
