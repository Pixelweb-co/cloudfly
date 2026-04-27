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
@Table("scheduled_jobs")
public class ScheduledJobEntity {

    @Id
    private Long id;

    @Column("event_id")
    private Long eventId;

    @Column("execute_at")
    private LocalDateTime executeAt;

    private JobStatus status;

    @Column("retry_count")
    private Integer retryCount;

    @Column("max_retries")
    private Integer maxRetries;

    @Column("last_error")
    private String lastError;

    @Column("created_at")
    private LocalDateTime createdAt;
}
