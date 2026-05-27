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
@Table("scheduled_events")
public class ScheduledEventEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("subscription_id")
    private Long subscriptionId;

    @Column("event_type")
    private String eventType;

    @Column("scheduled_at")
    private LocalDateTime scheduledAt;

    private String status;

    private String payload; // JSON as string for R2DBC

    @Column("retry_count")
    private Integer retryCount;

    @Column("executed_at")
    private LocalDateTime executedAt;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
