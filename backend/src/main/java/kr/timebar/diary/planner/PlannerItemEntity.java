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
}
