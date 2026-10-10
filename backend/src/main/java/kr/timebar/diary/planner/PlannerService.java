// 플래너 기록을 인증 사용자별 DB 데이터로 저장하고 조회한다.
package kr.timebar.diary.planner;

import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PlannerService {
    private final PlannerItemRepository repository;
    public PlannerService(PlannerItemRepository repository) { this.repository = repository; }

    @Transactional(readOnly = true)
    public List<PlannerItem> find(String user, LocalDate date, PlannerItem.ItemType type, String category, PlannerItem.ItemStatus status) {
        return repository.findByUserIdOrderByStartTimeAsc(user).stream()
                .filter(i -> date == null || date.equals(i.getDate()))
                .filter(i -> type == null || type == i.getType())
                .filter(i -> category == null || category.equals(i.getCategory()))
                .filter(i -> status == null || status == i.getStatus())
                .map(PlannerItemEntity::response).toList();
    }
    public PlannerItem save(String user, PlannerItem item) {
        validate(item);
        PlannerItemEntity entity = new PlannerItemEntity(item.type(), item.title().trim(), item.category(), item.date(),
                item.startTime(), item.endTime(), item.status(), item.dday(), item.note());
        entity.assignUser(user);
        return repository.saveAndFlush(entity).response();
    }
    public PlannerItem update(String user, long id, PlannerItem item) {
        validate(item); PlannerItemEntity entity = owned(user, id); entity.apply(item); return entity.response();
    }
    public PlannerItem changeStatus(String user, long id, PlannerItem.ItemStatus status) {
        PlannerItem old = owned(user, id).response();
        return update(user, id, new PlannerItem(id, old.type(), old.title(), old.category(), old.date(), old.startTime(), old.endTime(), status, old.dday(), old.note()));
    }
    public void delete(String user, long id) { repository.delete(owned(user, id)); }
    private PlannerItemEntity owned(String user, long id) {
        return repository.findByIdAndUserId(id, user).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }
    private void validate(PlannerItem item) {
        if (item.type() == null || item.title() == null || item.title().isBlank() || item.title().length() > 200) throw new ApiException(ErrorCode.VALIDATION_FAILED);
        if (item.endTime() != null && item.startTime() != null && !item.endTime().isAfter(item.startTime())) throw new ApiException(ErrorCode.VALIDATION_FAILED, "종료 시간은 시작 이후여야 합니다.");
    }
}
