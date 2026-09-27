package kr.timebar.diary.chat.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.timebar.diary.chat.application.ChatIdentity;
import kr.timebar.diary.chat.domain.ChatModels.Signal;
import kr.timebar.diary.chat.infrastructure.jdbc.ChatRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@ConditionalOnProperty(name="app.chat.enabled",havingValue="true")
public class ChatEventHub implements MessageListener {
    private record Connection(String userId, Instant expires, SseEmitter emitter) {}
    private final Set<Connection> connections=ConcurrentHashMap.newKeySet();
    private final ChatRepository repo;
    private final ChatIdentity identity;
    private final ObjectMapper mapper;
    public ChatEventHub(ChatRepository repo,ChatIdentity identity,ObjectMapper mapper) { this.repo=repo;this.identity=identity;this.mapper=mapper; }
    public synchronized SseEmitter connect(String user,Instant expiry) {
        identity.requireActive(user);
        if(connections.stream().filter(c->c.userId.equals(user)).count()>=5) throw new ApiException(ErrorCode.RATE_LIMITED,"열린 채팅 창이 너무 많습니다.");
        long lifetime=Math.min(60000,expiry.toEpochMilli()-System.currentTimeMillis());
        if(lifetime<=0) throw new ApiException(ErrorCode.TOKEN_EXPIRED);
        var emitter=new SseEmitter(lifetime);
        var connection=new Connection(user,expiry,emitter);
        connections.add(connection);
        emitter.onCompletion(()->connections.remove(connection));
        emitter.onTimeout(()->close(connection));
        emitter.onError(error->connections.remove(connection));
        send(connection,"connected",java.util.Map.of("reconcile",true));
        return emitter;
    }
    @Override public void onMessage(Message message,byte[] pattern) {
        try {
            var signal=mapper.readValue(message.getBody(),Signal.class);
            for(var connection:connections) {
                try {
                    if(connection.expires.isBefore(Instant.now())) { close(connection); continue; }
                    // No message text is ever sent via Pub/Sub. Re-fetch is authorized independently.
                    if(repo.isMember(signal.roomId(),connection.userId)) send(connection,"changed",signal);
                } catch(RuntimeException error) { close(connection); }
            }
        } catch(java.io.IOException ignored) { /* Ignore invalid internal envelope. */ }
    }
    @Scheduled(fixedDelay=15000) public void heartbeat() {
        for(var connection:connections) {
            try { identity.requireActive(connection.userId); send(connection,"heartbeat",Instant.now().toString()); }
            catch(RuntimeException error) { close(connection); }
        }
    }
    private void send(Connection connection,String event,Object data) {
        try { connection.emitter.send(SseEmitter.event().name(event).data(data)); }
        catch(Exception error) { close(connection); }
    }
    private void close(Connection connection) { connections.remove(connection);connection.emitter.complete(); }
}
