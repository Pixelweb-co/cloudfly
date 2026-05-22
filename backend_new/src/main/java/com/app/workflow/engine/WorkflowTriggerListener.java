package com.app.workflow.engine;

import com.app.persistence.entity.WorkflowEntity;
import com.app.persistence.repository.WorkflowRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Listener that catches Kafka trigger events, maps their payload, and routes
 * them to matching active workflows under the correct tenant and company.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WorkflowTriggerListener {

    private final WorkflowRepository workflowRepository;
    private final WorkflowEngineExecutor workflowEngineExecutor;
    private final ObjectMapper objectMapper;

    /**
     * Entry point to trigger active workflows programmatically or via listeners.
     * Searches active workflows of the specific company and tenant matching the event name.
     */
    public Mono<Void> triggerWorkflow(String eventName, Long tenantId, Long companyId, Map<String, Object> payload) {
        log.info("🔥 [TRIGGER-LISTENER] Received event '{}' for tenant ID {}, company ID {}", eventName, tenantId, companyId);
        
        if (tenantId == null || companyId == null) {
            log.warn("⚠️ [TRIGGER-LISTENER] Missing tenantId ({}) or companyId ({}) in trigger context. Skipping.", tenantId, companyId);
            return Mono.empty();
        }

        return workflowRepository.findByTenantIdAndCompanyIdAndTriggerEventAndIsActiveTrue(tenantId, companyId, eventName)
                .flatMap(workflow -> {
                    log.info("🚀 [TRIGGER-LISTENER] Match found! Launching workflow '{}' (ID: {})", 
                            workflow.getName(), workflow.getId());
                    return workflowEngineExecutor.executeAndLog(workflow, payload)
                            .onErrorResume(err -> {
                                log.error("❌ [TRIGGER-LISTENER] Execution error on workflow '{}' (ID: {}): {}", 
                                        workflow.getName(), workflow.getId(), err.getMessage());
                                return Mono.empty();
                            });
                })
                .then();
    }

    /**
     * Consumes messages from the order-paid-topic.
     */
    @KafkaListener(topics = "order-paid-topic", groupId = "workflow-engine")
    public void consumeOrderPaid(String message) {
        log.info("📥 [TRIGGER-LISTENER] Received message from Kafka (order-paid-topic): {}", message);
        try {
            Map<String, Object> payload = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {});
            
            String eventName = (String) payload.getOrDefault("event", "order.paid");
            
            Long tenantId = null;
            if (payload.containsKey("tenantId")) {
                tenantId = ((Number) payload.get("tenantId")).longValue();
            } else if (payload.containsKey("tenant_id")) {
                tenantId = ((Number) payload.get("tenant_id")).longValue();
            }
            
            Long companyId = null;
            if (payload.containsKey("companyId")) {
                companyId = ((Number) payload.get("companyId")).longValue();
            } else if (payload.containsKey("company_id")) {
                companyId = ((Number) payload.get("company_id")).longValue();
            }

            triggerWorkflow(eventName, tenantId, companyId, payload).subscribe();
        } catch (Exception e) {
            log.error("❌ [TRIGGER-LISTENER] Failed to parse and trigger order.paid workflow: {}", e.getMessage(), e);
        }
    }

    /**
     * Consumes messages from the appointment-scheduled-topic.
     */
    @KafkaListener(topics = "appointment-scheduled-topic", groupId = "workflow-engine")
    public void consumeAppointmentScheduled(String message) {
        log.info("📥 [TRIGGER-LISTENER] Received message from Kafka (appointment-scheduled-topic): {}", message);
        try {
            Map<String, Object> payload = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {});
            
            String eventName = (String) payload.getOrDefault("event", "appointment.scheduled");
            
            Long tenantId = null;
            if (payload.containsKey("tenantId")) {
                tenantId = ((Number) payload.get("tenantId")).longValue();
            } else if (payload.containsKey("tenant_id")) {
                tenantId = ((Number) payload.get("tenant_id")).longValue();
            }
            
            Long companyId = null;
            if (payload.containsKey("companyId")) {
                companyId = ((Number) payload.get("companyId")).longValue();
            } else if (payload.containsKey("company_id")) {
                companyId = ((Number) payload.get("company_id")).longValue();
            }

            triggerWorkflow(eventName, tenantId, companyId, payload).subscribe();
        } catch (Exception e) {
            log.error("❌ [TRIGGER-LISTENER] Failed to parse and trigger appointment.scheduled workflow: {}", e.getMessage(), e);
        }
    }
}
