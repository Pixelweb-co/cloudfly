package com.app.workflow.engine;

import com.app.persistence.entity.WorkflowExecutionLogEntity;
import com.app.persistence.entity.WorkflowEntity;
import com.app.persistence.repository.WorkflowExecutionLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Core execution engine that recursively evaluates workflow steps dynamically.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WorkflowEngineExecutor {

    private final WorkflowActionDispatcher actionDispatcher;
    private final WorkflowExecutionLogRepository logRepository;
    private final ObjectMapper objectMapper;

    /**
     * Entry point to execute a workflow and automatically record execution logs.
     */
    public Mono<Void> executeAndLog(WorkflowEntity workflow, Map<String, Object> payload) {
        long startTime = System.currentTimeMillis();
        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payload != null ? payload : Map.of());
        } catch (Exception e) {
            payloadJson = "{}";
        }
        
        final String finalPayloadJson = payloadJson;
        
        return this.execute(workflow, payload)
                .then(Mono.defer(() -> {
                    long duration = System.currentTimeMillis() - startTime;
                    WorkflowExecutionLogEntity logEntity = WorkflowExecutionLogEntity.builder()
                            .workflowId(workflow.getId())
                            .tenantId(workflow.getTenantId())
                            .companyId(workflow.getCompanyId())
                            .status("SUCCESS")
                            .triggerPayload(finalPayloadJson)
                            .executionTimeMs((int) duration)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return logRepository.save(logEntity).then();
                }))
                .onErrorResume(error -> {
                    long duration = System.currentTimeMillis() - startTime;
                    log.error("❌ [ENGINE-EXECUTOR] Error executing workflow '{}' (ID: {}): {}", 
                            workflow.getName(), workflow.getId(), error.getMessage());
                    WorkflowExecutionLogEntity logEntity = WorkflowExecutionLogEntity.builder()
                            .workflowId(workflow.getId())
                            .tenantId(workflow.getTenantId())
                            .companyId(workflow.getCompanyId())
                            .status("FAILED")
                            .triggerPayload(finalPayloadJson)
                            .errorMessage(error.getMessage())
                            .executionTimeMs((int) duration)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return logRepository.save(logEntity).then(Mono.empty()); // swallow error to prevent breaking consumer pipelines
                });
    }

    /**
     * Entry point to execute a workflow using a raw payload context.
     * 
     * @param workflow The workflow entity to run.
     * @param payload The raw event payload.
     * @return Mono completing when all logical paths complete.
     */
    public Mono<Void> execute(WorkflowEntity workflow, Map<String, Object> payload) {
        log.info("🚀 [ENGINE-EXECUTOR] Initiating execution of workflow '{}' (ID: {})", workflow.getName(), workflow.getId());
        
        try {
            String stepsJson = workflow.getWorkflowSteps();
            if (stepsJson == null || stepsJson.trim().isEmpty() || "{}".equals(stepsJson.trim())) {
                log.info("🛑 [ENGINE-EXECUTOR] Workflow '{}' has no steps configured. Terminating.", workflow.getName());
                return Mono.empty();
            }

            JsonNode stepsNode = objectMapper.readTree(stepsJson);
            JsonNode payloadNode = objectMapper.valueToTree(payload != null ? payload : Map.of());

            return executeStep(workflow.getInitialStepId(), stepsNode, workflow.getTenantId(), workflow.getCompanyId(), payloadNode);
        } catch (Exception e) {
            log.error("❌ [ENGINE-EXECUTOR] Error preparing workflow steps: {}", e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Recursively traverses steps in a reactive, non-blocking sequence.
     */
    private Mono<Void> executeStep(String stepId, JsonNode stepsNode, Long tenantId, Long companyId, JsonNode payloadNode) {
        if (stepId == null || stepId.trim().isEmpty() || !stepsNode.has(stepId)) {
            log.info("🏁 [ENGINE-EXECUTOR] Reached workflow termination or dead-end (Step ID: '{}')", stepId);
            return Mono.empty();
        }

        JsonNode stepNode = stepsNode.get(stepId);
        String stepType = stepNode.path("type").asText("").toUpperCase();

        log.info("⏭️ [ENGINE-EXECUTOR] Evaluating step '{}' of type '{}'", stepId, stepType);

        switch (stepType) {
            case "ACTION":
                String actionCode = stepNode.path("actionCode").asText();
                JsonNode paramsNode = stepNode.path("actionParameters");
                
                // Convert parameters from JSON tree to Map
                Map<String, Object> parameters = objectMapper.convertValue(paramsNode, Map.class);
                String nextStepId = stepNode.path("nextStepId").asText(null);

                log.info("🎬 [ENGINE-EXECUTOR] Dispatching action '{}' for step '{}'", actionCode, stepId);
                return actionDispatcher.dispatch(actionCode, tenantId, companyId, parameters, objectMapper.convertValue(payloadNode, Map.class))
                        .then(Mono.defer(() -> executeStep(nextStepId, stepsNode, tenantId, companyId, payloadNode)));

            case "IF":
                JsonNode conditionNode = stepNode.path("condition");
                boolean conditionMet = evaluateCondition(conditionNode, payloadNode);
                
                String thenStepId = stepNode.path("thenStepId").asText(null);
                String elseStepId = stepNode.path("elseStepId").asText(null);
                String chosenStepId = conditionMet ? thenStepId : elseStepId;

                log.info("❓ [ENGINE-EXECUTOR] Condition in IF step '{}' resolved to: {} -> Routing to next step: '{}'", 
                        stepId, conditionMet, chosenStepId);
                return executeStep(chosenStepId, stepsNode, tenantId, companyId, payloadNode);

            case "SWITCH":
                String fieldPath = stepNode.path("field").asText("");
                JsonNode valueNode = WorkflowEngineUtils.getValueByPath(payloadNode, fieldPath);
                String fieldValue = (valueNode != null && !valueNode.isMissingNode() && !valueNode.isNull()) ? valueNode.asText() : "";

                JsonNode casesNode = stepNode.path("cases");
                String switchNextStepId = casesNode.path(fieldValue).asText(null);

                if (switchNextStepId == null) {
                    switchNextStepId = stepNode.path("defaultStepId").asText(null);
                    log.info("🔀 [ENGINE-EXECUTOR] SWITCH step '{}' matching key '{}' not found. Routing to default: '{}'", 
                            stepId, fieldValue, switchNextStepId);
                } else {
                    log.info("🔀 [ENGINE-EXECUTOR] SWITCH step '{}' matched value '{}' -> Routing to step: '{}'", 
                            stepId, fieldValue, switchNextStepId);
                }

                return executeStep(switchNextStepId, stepsNode, tenantId, companyId, payloadNode);

            default:
                log.error("❌ [ENGINE-EXECUTOR] Step '{}' has unsupported step type: '{}'", stepId, stepType);
                return Mono.error(new IllegalArgumentException("Tipo de paso no soportado: " + stepType));
        }
    }

    /**
     * Compares values using standard conditional operators.
     */
    private boolean evaluateCondition(JsonNode conditionNode, JsonNode payloadNode) {
        if (conditionNode == null || conditionNode.isMissingNode()) {
            return true;
        }

        String fieldPath = conditionNode.path("field").asText("");
        String operator = conditionNode.path("operator").asText("").toUpperCase();
        JsonNode expectedNode = conditionNode.path("value");

        JsonNode actualNode = WorkflowEngineUtils.getValueByPath(payloadNode, fieldPath);

        if (actualNode == null || actualNode.isMissingNode() || actualNode.isNull()) {
            log.warn("⚠️ [ENGINE-EXECUTOR] Condition path '{}' is missing or null in trigger payload.", fieldPath);
            return "NOT_EQUALS".equals(operator); // If missing, it is indeed NOT EQUAL to expected
        }

        log.info("🔍 [ENGINE-EXECUTOR] Evaluating condition: '{}' ({}) expected: '{}' vs actual: '{}'", 
                fieldPath, operator, expectedNode.asText(), actualNode.asText());

        switch (operator) {
            case "EQUALS":
                if (actualNode.isNumber() && expectedNode.isNumber()) {
                    return actualNode.asDouble() == expectedNode.asDouble();
                }
                return actualNode.asText().trim().equalsIgnoreCase(expectedNode.asText().trim());

            case "NOT_EQUALS":
                if (actualNode.isNumber() && expectedNode.isNumber()) {
                    return actualNode.asDouble() != expectedNode.asDouble();
                }
                return !actualNode.asText().trim().equalsIgnoreCase(expectedNode.asText().trim());

            case "GREATER_THAN":
                try {
                    return actualNode.asDouble() > expectedNode.asDouble();
                } catch (Exception e) {
                    return false;
                }

            case "LESS_THAN":
                try {
                    return actualNode.asDouble() < expectedNode.asDouble();
                } catch (Exception e) {
                    return false;
                }

            case "CONTAINS":
                return actualNode.asText().toLowerCase().contains(expectedNode.asText().toLowerCase());

            default:
                log.warn("⚠️ [ENGINE-EXECUTOR] Unsupported operator '{}'. Failing condition.", operator);
                return false;
        }
    }
}
