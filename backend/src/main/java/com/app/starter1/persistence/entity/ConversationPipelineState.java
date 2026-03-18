package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "conversation_pipeline_state")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationPipelineState {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    
    @Column(name = "conversation_id", nullable = false, length = 100)
    private String conversationId;
    
    @Column(name = "contact_id")
    private Long contactId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_stage_id", nullable = false)
    private PipelineStage currentStage;
    
    @Column(name = "assigned_to_user_id")
    private Long assignedToUserId;
    
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 20)
    private ConversationPriority priority = ConversationPriority.MEDIUM;
    
    @Column(name = "source", length = 50)
    private String source;
    
    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "JSON")
    private List<String> tags = new ArrayList<>();
    
    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_fields", columnDefinition = "JSON")
    private Map<String, Object> customFields = new HashMap<>();
    
    @Column(name = "entered_stage_at", nullable = false)
    private LocalDateTime enteredStageAt;
    
    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;
    
    @Column(name = "actual_close_date")
    private LocalDate actualCloseDate;
    
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (enteredStageAt == null) {
            enteredStageAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
