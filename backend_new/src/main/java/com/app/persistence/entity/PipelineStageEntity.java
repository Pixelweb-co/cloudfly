package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("pipeline_stages")
public class PipelineStageEntity {
    @Id
    private Long id;

    @Column("pipeline_id")
    private Long pipelineId;

    private String name;
    private String description;
    private String color;
    private int position;

    @Column("is_initial")
    private boolean isInitial;

    @Column("is_final")
    private boolean isFinal;

    private String outcome; // WON, LOST, OPEN

    @Column("timeout_hours")
    private Integer timeoutHours;

    @Column("rotation_enabled")
    private boolean rotationEnabled;

    @Column("max_conversations")
    private Integer maxConversations;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
