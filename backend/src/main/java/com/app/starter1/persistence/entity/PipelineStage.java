package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_stages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineStage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    @JsonIgnore
    private Pipeline pipeline;
    
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Builder.Default
    @Column(name = "color", length = 7)
    private String color = "#10B981";
    
    @Column(name = "position", nullable = false)
    private Integer position;
    
    @Builder.Default
    @Column(name = "is_initial", nullable = false)
    private Boolean isInitial = false;
    
    @Builder.Default
    @Column(name = "is_final", nullable = false)
    private Boolean isFinal = false;
    
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", nullable = false, length = 10)
    private StageOutcome outcome = StageOutcome.OPEN;
    
    @Column(name = "timeout_hours")
    private Integer timeoutHours;
    
    @Builder.Default
    @Column(name = "rotation_enabled", nullable = false)
    private Boolean rotationEnabled = false;
    
    @Column(name = "max_conversations")
    private Integer maxConversations;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
