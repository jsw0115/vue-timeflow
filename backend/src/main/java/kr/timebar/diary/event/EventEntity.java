package kr.timebar.diary.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import kr.timebar.diary.common.BaseTimeEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 반복 일정은 "규칙"이 아니라 회차별로 독립된 row로 materialize해서 저장한다(같은 seriesId를 공유).
 * 회차 하나를 수정/삭제하는 건 그 row 하나만 건드리면 되므로 "단건 수정"이 별도 로직 없이 자연히 성립하고,
 * "이후 전체 수정/종료"만 seriesId + date 조건으로 여러 row를 한 번에 처리하면 된다.
 */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "events")
public class EventEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 26)
    private String userId;

    @Column(nullable = false)
    private String title;

    private String category;

    @Column(nullable = false)
    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    private String location;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EventVisibility visibility;

    private String note;

    @Column(name = "series_id")
    private Long seriesId;

    public EventEntity(String userId, String title, String category, LocalDate date, LocalTime startTime,
            LocalTime endTime, String location, EventVisibility visibility, String note, Long seriesId) {
        this.userId = userId;
        this.title = title;
        this.category = category;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
        this.visibility = visibility == null ? EventVisibility.PRIVATE : visibility;
        this.note = note;
        this.seriesId = seriesId;
    }

    public void bindToSeries(Long seriesId) {
        this.seriesId = seriesId;
    }

    public void applyUpdate(String title, String category, LocalDate date, LocalTime startTime, LocalTime endTime,
            String location, EventVisibility visibility, String note) {
        this.title = title;
        this.category = category;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
        this.visibility = visibility == null ? EventVisibility.PRIVATE : visibility;
        this.note = note;
    }

    public boolean isOwnedBy(String userId) {
        return this.userId.equals(userId);
    }
}
