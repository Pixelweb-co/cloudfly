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
@Table("calendar_events")
public class CalendarEventEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    @Column("calendar_id")
    private Long calendarId;

    private String title;
    private String description;

    @Column("event_type")
    private EventType eventType;

    @Column("event_subtype")
    private String eventSubtype;

    private EventStatus status;

    @Column("start_time")
    private LocalDateTime startTime;

    @Column("end_time")
    private LocalDateTime endTime;

    @Column("all_day")
    private Boolean allDay;

    @Column("related_entity_type")
    private String relatedEntityType;

    @Column("related_entity_id")
    private Long relatedEntityId;

    @Column("campaign_id")
    private Long campaignId;

    private String payload;
    private String recurrence;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
