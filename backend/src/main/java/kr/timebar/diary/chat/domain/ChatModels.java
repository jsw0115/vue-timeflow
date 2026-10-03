package kr.timebar.diary.chat.domain;

import java.time.Instant;
import java.util.List;

public final class ChatModels {
    private ChatModels() {}
    public record Person(String id, String nickname) {}
    public record Member(String userId, String nickname, String lastReadSequence) {}
    public record Message(String id, String roomId, String sequence, String senderId,
                          String senderName, String clientMessageId, String body, Instant createdAt,
                          List<String> tags, List<String> mentionUserIds) {}
    public record Room(String id, String kind, String name, String ownerId, String lastSequence,
                       long unreadCount, Message lastMessage, List<Member> members, Instant updatedAt) {}
    public record Page<T>(List<T> items, String nextCursor, boolean hasNext) {}
    public record SearchPage<T>(List<T> items, String nextCursor, boolean hasNext, boolean indexing) {}
    public record ReadState(String roomId, String lastReadSequence) {}
    public record Signal(String roomId, String type, String userId) {}
    public record Presence(String userId, String nickname, boolean active) {}
    public record InboxItem(Message message, String roomName, boolean read) {}
    public record TagCount(String name, long messageCount) {}
}
