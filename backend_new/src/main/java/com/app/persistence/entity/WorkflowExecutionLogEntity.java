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
@Table("workflow_execution_logs")
@ToString
public class WorkflowExecutionLogEntity {
    @Id
    private Long id;

    @Column("workflow_id")
    private Long workflowId;

    @Column("tenant_id")
    private Long tenantId;

    @Column("company_id")
    private Long companyId;

    private String status; // SUCCESS, FAILED, FILTERED

    @Column("trigger_payload")
    private String triggerPayload; // Mapeado como String conteniendo JSON

    @Column("error_message")
    private String errorMessage;

    @Column("execution_time_ms")
    private Integer executionTimeMs;

    @Column("created_at")
    private LocalDateTime createdAt;

    // Explicit Getters and Setters for VPS environment compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getWorkflowId() { return workflowId; }
    public void setWorkflowId(Long workflowId) { this.workflowId = workflowId; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTriggerPayload() { return triggerPayload; }
    public void setTriggerPayload(String triggerPayload) { this.triggerPayload = triggerPayload; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Integer getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(Integer executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
