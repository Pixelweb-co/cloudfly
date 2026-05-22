package com.app.workflow.engine;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Registry and routing service for workflow action strategies.
 */
@Service
@Slf4j
public class WorkflowActionDispatcher {

    private final Map<String, WorkflowActionExecutor> executors;

    // Spring Boot automatically injects all beans implementing WorkflowActionExecutor
    public WorkflowActionDispatcher(List<WorkflowActionExecutor> executorList) {
        this.executors = executorList.stream()
                .collect(Collectors.toMap(WorkflowActionExecutor::getActionCode, e -> e));
        log.info("🎯 [WORKFLOW-DISPATCHER] Registered {} action executors: {}", executors.size(), executors.keySet());
    }

    /**
     * Routes an action execution to the corresponding strategy.
     * 
     * @param actionCode The code identifying the action (e.g. "whatsapp.send_text").
     * @param tenantId The active tenant ID.
     * @param companyId The active company ID.
     * @param parameters Resolved action parameters.
     * @param triggerPayload Raw trigger data.
     * @return Mono completing when the action completes.
     */
    public Mono<Void> dispatch(String actionCode, Long tenantId, Long companyId, Map<String, Object> parameters, Map<String, Object> triggerPayload) {
        WorkflowActionExecutor executor = executors.get(actionCode);
        if (executor == null) {
            log.error("❌ [WORKFLOW-DISPATCHER] No action executor found for code: {}", actionCode);
            return Mono.error(new IllegalArgumentException("Acción no soportada: " + actionCode));
        }
        return executor.execute(tenantId, companyId, parameters, triggerPayload);
    }
}
