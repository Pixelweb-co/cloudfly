package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("chatbots")
@ToString
public class ChatbotEntity {
    @Id
    private Integer id;

    @Column("tenant_id")
    private Integer tenantId;

    @Column("agent_type")
    private String agentType;

    @Column("agent_name")
    private String agentName;

    private String language;
    private String tone;

    @Column("system_prompt_override")
    private String systemPromptOverride;

    @Column("extra_instructions")
    private String extraInstructions;

    @Column("enabled_tools")
    private String enabledTools; // Almacenado como JSON String

    @Column("max_history")
    private Integer maxHistory;

    @Column("max_tool_loops")
    private Integer maxToolLoops;

    private Float temperature;

    @Column("is_active")
    private Integer isActive;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    // Explicit Getters/Setters for VPS compatibility
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getTenantId() { return tenantId; }
    public void setTenantId(Integer tenantId) { this.tenantId = tenantId; }
    public String getAgentType() { return agentType; }
    public void setAgentType(String agentType) { this.agentType = agentType; }
    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }
    public String getSystemPromptOverride() { return systemPromptOverride; }
    public void setSystemPromptOverride(String systemPromptOverride) { this.systemPromptOverride = systemPromptOverride; }
    public String getExtraInstructions() { return extraInstructions; }
    public void setExtraInstructions(String extraInstructions) { this.extraInstructions = extraInstructions; }
    public String getEnabledTools() { return enabledTools; }
    public void setEnabledTools(String enabledTools) { this.enabledTools = enabledTools; }
    public Integer getMaxHistory() { return maxHistory; }
    public void setMaxHistory(Integer maxHistory) { this.maxHistory = maxHistory; }
    public Integer getMaxToolLoops() { return maxToolLoops; }
    public void setMaxToolLoops(Integer maxToolLoops) { this.maxToolLoops = maxToolLoops; }
    public Float getTemperature() { return temperature; }
    public void setTemperature(Float temperature) { this.temperature = temperature; }
    public Integer getIsActive() { return isActive; }
    public void setIsActive(Integer isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
