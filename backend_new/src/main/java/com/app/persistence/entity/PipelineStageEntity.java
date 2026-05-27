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

    // Explicit Getters and Setters for VPS environment compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPipelineId() { return pipelineId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public boolean isInitial() { return isInitial; }
    public boolean getIsInitial() { return isInitial; }
    public void setInitial(boolean isInitial) { this.isInitial = isInitial; }
    public void setIsInitial(boolean isInitial) { this.isInitial = isInitial; }

    public boolean isFinal() { return isFinal; }
    public boolean getIsFinal() { return isFinal; }
    public void setFinal(boolean isFinal) { this.isFinal = isFinal; }
    public void setIsFinal(boolean isFinal) { this.isFinal = isFinal; }

    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }

    public Integer getTimeoutHours() { return timeoutHours; }
    public void setTimeoutHours(Integer timeoutHours) { this.timeoutHours = timeoutHours; }

    public boolean isRotationEnabled() { return rotationEnabled; }
    public boolean getRotationEnabled() { return rotationEnabled; }
    public void setRotationEnabled(boolean rotationEnabled) { this.rotationEnabled = rotationEnabled; }
    public void setIsRotationEnabled(boolean rotationEnabled) { this.rotationEnabled = rotationEnabled; }

    public Integer getMaxConversations() { return maxConversations; }
    public void setMaxConversations(Integer maxConversations) { this.maxConversations = maxConversations; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
