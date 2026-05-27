package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowRequest {
    private String name;
    private String description;
    private String triggerEvent;
    private String cronExpression;
    private String initialStepId;
    private String workflowSteps; // JSON string representing workflow steps tree
    private Boolean isActive;
}
