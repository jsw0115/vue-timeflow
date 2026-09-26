package kr.timebar.diary.planner;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PlannerService {
    private final AtomicLong sequence = new AtomicLong(100);
    private final Map<Long, PlannerItem> items = new ConcurrentHashMap<>();
    public PlannerService() {
        LocalDate today = LocalDate.now();
        save(new PlannerItem(null, PlannerItem.ItemType.EVENT, "디자인 싱크 미팅", "업무", today, java.time.LocalTime.of(11, 0), java.time.LocalTime.of(12, 30), PlannerItem.ItemStatus.SCHEDULED, false, ""));
        save(new PlannerItem(null, PlannerItem.ItemType.TASK, "서비스 API 명세 검토", "업무", today, java.time.LocalTime.of(10, 0), null, PlannerItem.ItemStatus.IN_PROGRESS, false, ""));
        save(new PlannerItem(null, PlannerItem.ItemType.ROUTINE, "물 2L 마시기", "건강", today, java.time.LocalTime.of(8, 0), null, PlannerItem.ItemStatus.DONE, false, ""));
    }
    public List<PlannerItem> find(LocalDate date, PlannerItem.ItemType type, String category, PlannerItem.ItemStatus status) {
        return items.values().stream().filter(i -> date == null || date.equals(i.date())).filter(i -> type == null || type == i.type()).filter(i -> category == null || category.equals(i.category())).filter(i -> status == null || status == i.status()).sorted(Comparator.comparing(PlannerItem::startTime, Comparator.nullsLast(Comparator.naturalOrder()))).toList();
    }
    public PlannerItem save(PlannerItem item) { long id = item.id() == null ? sequence.incrementAndGet() : item.id(); PlannerItem saved = new PlannerItem(id, item.type(), item.title(), item.category(), item.date(), item.startTime(), item.endTime(), item.status(), item.dday(), item.note()); items.put(id, saved); return saved; }
    public PlannerItem update(long id, PlannerItem item) { if (!items.containsKey(id)) throw new NoSuchElementException("기록을 찾을 수 없습니다."); return save(new PlannerItem(id, item.type(), item.title(), item.category(), item.date(), item.startTime(), item.endTime(), item.status(), item.dday(), item.note())); }
    public void delete(long id) { if (items.remove(id) == null) throw new NoSuchElementException("기록을 찾을 수 없습니다."); }
}

