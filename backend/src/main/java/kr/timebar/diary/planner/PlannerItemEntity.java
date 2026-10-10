package kr.timebar.diary.planner;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;
import kr.timebar.diary.common.BaseTimeEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "planner_item")
public class PlannerItemEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlannerItem.ItemType type;

    @Column(nullable = false)
    private String title;

    private String category;

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PlannerItem.ItemStatus status;

    private boolean dday;

    private String note;

    public PlannerItemEntity(PlannerItem.ItemType type, String title, String category, LocalDate date,
            LocalTime startTime, LocalTime endTime, PlannerItem.ItemStatus status, boolean dday, String note) {
        this.type = type;
        this.title = title;
        this.category = category;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.dday = dday;
        this.note = note;
    }

    public void assignUser(String userId) { this.userId = userId; }

    public void apply(PlannerItem item) {
        this.type = item.type(); this.title = item.title(); this.category = item.category();
        this.date = item.date(); this.startTime = item.startTime(); this.endTime = item.endTime();
        this.status = item.status(); this.dday = item.dday(); this.note = item.note();
    }

    public PlannerItem response() {
        return new PlannerItem(id, type, title, category, date, startTime, endTime, status, dday, note);
    }
}
