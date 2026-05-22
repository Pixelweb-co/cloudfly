package com.app.workflow.engine;

import reactor.core.publisher.Mono;
import java.util.Map;

/**
 * Interface definition for all workflow action strategies in CloudFly.
 * Implementations must be fully reactive and thread-safe.
 */
public interface WorkflowActionExecutor {
    
    /**
     * @return The unique action code this strategy handles (e.g. "whatsapp.send_text").
     */
    String getActionCode();

    /**
     * Executes the specific automated logic in a reactive, non-blocking manner.
     * 
     * @param tenantId The active tenant ID.
     * @param companyId The active company ID.
     * @param parameters Resolved action parameters configured in the workflow node.
     * @param triggerPayload Raw trigger data that initiated this workflow.
     * @return Mono completing when the action completes successfully.
     */
    Mono<Void> execute(Long tenantId, Long companyId, Map<String, Object> parameters, Map<String, Object> triggerPayload);
}
