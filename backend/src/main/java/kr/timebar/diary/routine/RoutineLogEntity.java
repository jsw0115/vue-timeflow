package kr.timebar.diary.routine;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import kr.timebar.diary.common.UlidGenerator;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 기존 routine_db.routine_log 테이블 매핑. 날짜당 한 행이며 memo 컬럼은 없다. */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "routine_log")
public class RoutineLogEntity {

    @Id
    @Column(length = 26)
    private String id;

    @Column(name = "routine_id", nullable = false, length = 26)
    private String routineId;

    @Column(name = "dt", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "st", nullable = false, length = 10)
    private RoutineLogStatus status;

    @Column(name = "u_at", nullable = false)
    private LocalDateTime updatedAt;

    public RoutineLogEntity(String routineId, LocalDate date, RoutineLogStatus status) {
        this.id = UlidGenerator.newUlid();
        this.routineId = routineId;
        this.date = date;
        this.status = status;
    }

    /** done → missed → skip → done 순으로 순환한다. */
    public void cycleStatus() {
        this.status = switch (this.status) {
            case done -> RoutineLogStatus.missed;
            case missed -> RoutineLogStatus.skip;
            case skip -> RoutineLogStatus.done;
        };
    }

    public void applyStatus(RoutineLogStatus status) {
        this.status = status;
    }

    @PrePersist
    @PreUpdate
    protected void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
