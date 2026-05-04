package com.app.dto;

import com.app.persistence.entity.EventStatus;
import com.app.persistence.entity.EventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDto {
    private Long id;
    private Long tenantId;
    private Long companyId;
    private Long calendarId;
    private String title;
    private String description;
    private EventType eventType;
    private String eventSubtype;
    private EventStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean allDay;
    private String relatedEntityType;
    private Long relatedEntityId;
    private Long campaignId;
    private String payload;
    private String recurrence;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
