package kr.timebar.diary.chat.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import kr.timebar.diary.chat.application.ChatService;
import kr.timebar.diary.chat.domain.ChatModels.*;
import kr.timebar.diary.chat.infrastructure.redis.ChatEphemeral;
import kr.timebar.diary.chat.infrastructure.redis.ChatEventHub;
import kr.timebar.diary.common.ApiResponse;
import kr.timebar.diary.security.CurrentUser;
import kr.timebar.diary.security.JwtTokenProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;

/**
 * 
 * ChatController
  */
@RestController
@RequestMapping("/api/chat")
@ConditionalOnProperty(name="app.chat.enabled",havingValue="true")
public class ChatController {
    public record CreateRoom(@NotBlank String kind,@Size(max=80) String name,@NotEmpty @Size(max=19) List<@NotNull @Pattern(regexp="[0-9A-HJKMNP-TV-Z]{26}") String> memberIds) {}
    public record SendMessage(@NotBlank String clientMessageId,@NotBlank @Size(max=4000) String body,@Size(max=19) List<@NotBlank String> mentionUserIds) {}
    public record Read(@NotNull @Min(0) Long sequence) {}
    public record Owner(@NotBlank String userId) {}
    
    private final ChatService service;
    private final ChatEphemeral redis;
    private final ChatEventHub hub;
    private final JwtTokenProvider tokens;
    
    public ChatController(ChatService service,ChatEphemeral redis,ChatEventHub hub,JwtTokenProvider tokens) {
        this.service=service;
        this.redis=redis;
        this.hub=hub;
        this.tokens=tokens;
    }
    
    /**
     * 
     * @param email
     * @return
      */
    @GetMapping("/people") 
    public ApiResponse<Person> person(@RequestParam String email) {

        String user=CurrentUser.id(); 
        service.active(user); 
        redis.limit(user,"lookup",20,60);
        if(email.length()>255||!email.contains("@")) {
            throw new kr.timebar.diary.common.ApiException(kr.timebar.diary.common.ErrorCode.VALIDATION_FAILED);
        }
        Person result = service.lookup(user,email);
        return ApiResponse.ok(result);
    }

    /**
     * 
     * @param before
     * @param limit
     * @return
      */
    @GetMapping("/rooms") 
    public ApiResponse<Page<Room>> rooms(@RequestParam(required=false) String before,
        @RequestParam(defaultValue="50") int limit) {
        Page<Room> results = service.rooms(CurrentUser.id(),before,limit);
        return ApiResponse.ok(results);
    }
    
    /**
     * 
     * @param body
     * @return
      */
    @PostMapping("/rooms") 
    public ApiResponse<Room> create(@Valid @RequestBody CreateRoom body) {
        String user=CurrentUser.id(); 
        redis.limit(user,"create",10,60);
        Room result = service.create(user,body.kind(),body.name(),body.memberIds());
        return ApiResponse.ok(result);
    }
    
    /**
     * 
     * @param id
     * @return
      */
    @GetMapping("/rooms/{id}") 
    public ApiResponse<Room> room(@PathVariable String id) {
        return ApiResponse.ok(service.room(CurrentUser.id(),id));
    }

    /**
     * 
     * @param id
     * @param before
     * @param after
     * @param tag
     * @param limit
     * @return
      */
    @GetMapping("/rooms/{id}/messages") 
    public ApiResponse<Page<Message>> messages(@PathVariable String id,@RequestParam(required=false) Long before,@RequestParam(required=false) Long after,@RequestParam(required=false) String tag,@RequestParam(defaultValue="50") int limit) {
        
        Page<Message> results = service.messages(CurrentUser.id(),id,before,after,limit,tag);
        return ApiResponse.ok(results);
    }
    
    /**
     * 
     * @param id
     * @param body
     * @return
      */
    @PostMapping("/rooms/{id}/messages") public ApiResponse<Message> send(@PathVariable String id,@Valid @RequestBody SendMessage body) {
        String user=CurrentUser.id(); 
        redis.limit(user,"send",30,10);
        Message result = service.send(user,id,body.clientMessageId(),body.body(),body.mentionUserIds());
        return ApiResponse.ok(result);
    }

    /**
     * 
     * @param id
     * @param body
     * @return
      */
    @PutMapping("/rooms/{id}/read") 
    public ApiResponse<ReadState> read(@PathVariable String id,@Valid @RequestBody Read body) {
        
        ReadState result = service.read(CurrentUser.id(),id,body.sequence());
        return ApiResponse.ok(result);
    }

    /**
     * 
     * @param id
     * @param body
     * @return
      */
    @PutMapping("/rooms/{id}/owner") 
    public ApiResponse<Void> owner(@PathVariable String id,@Valid @RequestBody Owner body) {
        
        service.transfer(CurrentUser.id(),id,body.userId());
        return ApiResponse.ok(null);
    }

    /**
     * 
     * @param id
     * @return
      */
    @DeleteMapping("/rooms/{id}/members/me") 
    public ResponseEntity<Void> leave(@PathVariable String id) {
        
        service.leave(CurrentUser.id(),id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 
     * @param id
     * @return
      */
    @PostMapping("/rooms/{id}/typing") public ResponseEntity<Void> typing(@PathVariable String id) {
        
        String user=CurrentUser.id();
        service.room(user,id);
        redis.typing(id,user);
        return ResponseEntity.noContent().build();
    }

    /**
     * 
     * @param authorization
     * @return
      */
    @GetMapping(value="/events",produces=MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> stream(@RequestHeader("Authorization") String authorization) {
        var expiry=tokens.parse(authorization.substring(7)).getExpiration().toInstant();
        return ResponseEntity.ok().header("Cache-Control","no-store").header("X-Accel-Buffering","no")
                .body(hub.connect(CurrentUser.id(),expiry));
    }

    /**
     * 
     * @param before
     * @param unread
     * @param limit
     * @return
      */
    @GetMapping("/mentions") 
    public ApiResponse<Page<InboxItem>> mentions(@RequestParam(required=false) String before,@RequestParam(defaultValue="false") boolean unread,@RequestParam(defaultValue="50") int limit) {
        
        Page<InboxItem> result = service.mentions(CurrentUser.id(),before,unread,limit);
        return ApiResponse.ok(result);
    }
    
    /**
     * 
     * @param messageId
     * @return
      */
    @PutMapping("/mentions/{messageId}/read") 
    public ApiResponse<Void> readMention(@PathVariable String messageId) {
        
        service.readMention(CurrentUser.id(),messageId);
        return ApiResponse.ok(null);
    }
    
    /**
     * 
     * @param after
     * @param limit
     * @return
      */
    @GetMapping("/tags") 
    public ApiResponse<Page<TagCount>> tags(@RequestParam(required=false) String after,@RequestParam(defaultValue="50") int limit) {
        
        Page<TagCount> result = service.tags(CurrentUser.id(),after,limit);
        return ApiResponse.ok(result);
    }
    
    /**
     * 
     * @param tag
     * @param before
     * @param limit
     * @return
      */
    @GetMapping("/tagged-messages") 
    public ApiResponse<Page<InboxItem>> tagged(@RequestParam String tag,@RequestParam(required=false) String before,@RequestParam(defaultValue="50") int limit) {
        
        Page<InboxItem> result = service.tagged(CurrentUser.id(),tag,before,limit);
        return ApiResponse.ok(result);
    }
}
