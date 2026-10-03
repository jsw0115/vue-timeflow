package kr.timebar.diary.chat.infrastructure.jdbc;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name="app.chat.enabled", havingValue="true")
public class ChatSearchBackfill {
    private final ChatRepository repo;
    private String cursor = "";
    private volatile boolean complete = false;
    public boolean isIndexing() { return !complete; }
    public ChatSearchBackfill(ChatRepository repo) { this.repo = repo; }
    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void indexHistory() {
        if (complete) return;
        var rows = repo.jdbc().queryForList("SELECT m.id,m.body FROM chat_message m LEFT JOIN chat_search_document d ON d.message_id=m.id WHERE m.id>? AND d.message_id IS NULL ORDER BY m.id LIMIT 20",cursor);
        for (var row : rows) repo.indexMessage((String) row.get("id"), (String) row.get("body"));
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization() {
            @Override public void afterCommit() { if(rows.isEmpty()) complete=true; else cursor=(String)rows.get(rows.size()-1).get("id"); }
        });
    }
}
