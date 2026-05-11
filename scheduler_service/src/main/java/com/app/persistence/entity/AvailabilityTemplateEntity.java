package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("availability_templates")
public class AvailabilityTemplateEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("user_id")
    private Long userId;

    @Column("service_id")
    private Long serviceId;

    private String name;

    @Column("weekly_schedule")
    private String weeklySchedule; // JSON string representing the weekly schedule

    @Column("duration_default")
    private Integer durationDefault; // in minutes

    @Column("buffer_before")
    private Integer bufferBefore; // in minutes

    @Column("buffer_after")
    private Integer bufferAfter; // in minutes

    @Column("min_anticipation")
    private Integer minAnticipation; // in hours

    @Column("max_future_range")
    private Integer maxFutureRange; // in days

    @Column("daily_limit")
    private Integer dailyLimit;

    @Column("allow_weekends")
    private Boolean allowWeekends;

    @Column("exceptions")
    private String exceptions; // JSON string for specific date overrides

    private String timezone;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
