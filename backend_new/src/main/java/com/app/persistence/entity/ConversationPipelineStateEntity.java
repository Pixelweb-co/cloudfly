package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("conversation_pipeline_state")
public class ConversationPipelineStateEntity {
    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("conversation_id")
    private String conversationId;

    @Column("contact_id")
    private Long contactId;

    @Column("pipeline_id")
    private Long pipelineId;

    @Column("current_stage_id")
    private Long currentStageId;

    @Column("assigned_to_user_id")
    private Long assignedToUserId;

    private String priority; // LOW, MEDIUM, HIGH, URGENT
    private String source;
    private String tags; // Stored as JSON string
    
    @Column("custom_fields")
    private String customFields; // Stored as JSON string

    @Column("entered_stage_at")
    private LocalDateTime enteredStageAt;

    @Column("expected_close_date")
    private LocalDate expectedCloseDate;

    @Column("actual_close_date")
    private LocalDate actualCloseDate;

    @Column("is_active")
    private boolean isActive;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
