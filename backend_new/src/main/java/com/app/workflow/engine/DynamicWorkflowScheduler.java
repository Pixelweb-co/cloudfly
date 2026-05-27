package com.app.workflow.engine;

import com.app.persistence.entity.WorkflowEntity;
import com.app.persistence.repository.AppointmentRepository;
import com.app.persistence.repository.ContactRepository;
import com.app.persistence.repository.WorkflowRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

/**
 * Dynamic scheduler that schedules, updates, and cancels cron-based workflows.
 * Runs in background threads and executes workflows reactive-style.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DynamicWorkflowScheduler {

    private final TaskScheduler taskScheduler;
    private final WorkflowRepository workflowRepository;
    private final ContactRepository contactRepository;
    private final AppointmentRepository appointmentRepository;
    private final WorkflowEngineExecutor workflowEngineExecutor;
    private final ObjectMapper objectMapper;

    // Active scheduled jobs mapped by Workflow ID
    private final ConcurrentHashMap<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    /**
     * Initializes all active cron workflows on system startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        log.info("⏰ [DYNAMIC-SCHEDULER] Initializing active scheduled workflows...");
        workflowRepository.findByTriggerEventAndIsActiveTrue("scheduler.cron")
                .doOnNext(this::scheduleWorkflow)
                .subscribe(
                        wf -> log.info("⏰ [DYNAMIC-SCHEDULER] Successfully scheduled workflow: '{}' (ID: {})", wf.getName(), wf.getId()),
                        err -> log.error("❌ [DYNAMIC-SCHEDULER] Error loading active scheduled workflows: {}", err.getMessage())
                );
    }

    /**
     * Schedules or reschedules a workflow.
     */
    public synchronized void scheduleWorkflow(WorkflowEntity workflow) {
        if (workflow == null || workflow.getId() == null) {
            return;
        }

        // Cancel previous if exists
        cancelWorkflow(workflow.getId());

        // Do not schedule if inactive or trigger is not cron
        if (Boolean.FALSE.equals(workflow.getIsActive()) 
                || !"scheduler.cron".equalsIgnoreCase(workflow.getTriggerEvent())
                || workflow.getCronExpression() == null 
                || workflow.getCronExpression().trim().isEmpty()) {
            return;
        }

        try {
            CronTrigger trigger = new CronTrigger(workflow.getCronExpression());
            ScheduledFuture<?> future = taskScheduler.schedule(() -> runScheduledWorkflow(workflow), trigger);
            scheduledTasks.put(workflow.getId(), future);
            log.info("📅 [DYNAMIC-SCHEDULER] Scheduled workflow '{}' (ID: {}) with cron '{}'", 
                    workflow.getName(), workflow.getId(), workflow.getCronExpression());
        } catch (Exception e) {
            log.error("❌ [DYNAMIC-SCHEDULER] Failed to schedule workflow '{}' (ID: {}): {}", 
                    workflow.getName(), workflow.getId(), e.getMessage());
        }
    }

    /**
     * Cancels a scheduled workflow.
     */
    public synchronized void cancelWorkflow(Long workflowId) {
        ScheduledFuture<?> future = scheduledTasks.remove(workflowId);
        if (future != null) {
            future.cancel(true);
            log.info("🗑️ [DYNAMIC-SCHEDULER] Cancelled scheduled workflow ID: {}", workflowId);
        }
    }

    /**
     * Entry point executed when the cron trigger fires.
     */
    public void runScheduledWorkflow(WorkflowEntity workflow) {
        runScheduledWorkflowFlux(workflow)
                .subscribe(
                        null,
                        err -> log.error("❌ [DYNAMIC-SCHEDULER] Error running scheduled workflow '{}' (ID: {}): {}", 
                                workflow.getName(), workflow.getId(), err.getMessage()),
                        () -> log.info("🏁 [DYNAMIC-SCHEDULER] Finished execution batch of scheduled workflow '{}' (ID: {})", 
                                workflow.getName(), workflow.getId())
                );
    }

    /**
     * Core execution logic returning a Flux for testing and tracking.
     */
    public Flux<Void> runScheduledWorkflowFlux(WorkflowEntity workflow) {
        log.info("⏰ [DYNAMIC-SCHEDULER] Running scheduled workflow '{}' (ID: {})", workflow.getName(), workflow.getId());
        
        // Parse scope and filter
        String scope = "contacts";
        String filter = "";
        try {
            JsonNode stepsNode = objectMapper.readTree(workflow.getWorkflowSteps());
            scope = stepsNode.path("scope").asText("contacts").toLowerCase();
            filter = stepsNode.path("filter").asText("");
        } catch (Exception e) {
            log.warn("⚠️ Could not parse workflow scope/filters for workflow ID {}, defaulting to contacts", workflow.getId());
        }

        final String finalFilter = filter;
        if ("contacts".equals(scope)) {
            return contactRepository.findByTenantIdAndCompanyId(workflow.getTenantId(), workflow.getCompanyId())
                    .filter(contact -> evaluateScopeFilter(contact, finalFilter))
                    .flatMap(contact -> {
                        // Build payload matching dynamic variables
                        Map<String, Object> payload = Map.of(
                                "event", "scheduler.cron",
                                "tenantId", workflow.getTenantId(),
                                "companyId", workflow.getCompanyId(),
                                "timestamp", LocalDateTime.now().toString(),
                                "data", Map.of(
                                        "customer", contact,
                                        "contact", contact
                                )
                        );
                        return workflowEngineExecutor.executeAndLog(workflow, payload)
                                .onErrorResume(err -> {
                                    log.error("❌ Error running scheduled workflow for contact {}: {}", contact.getId(), err.getMessage());
                                    return Mono.empty();
                                });
                    });
        } else if ("appointments".equals(scope)) {
            return appointmentRepository.findByTenantIdAndCompanyId(workflow.getTenantId(), workflow.getCompanyId())
                    .filter(app -> evaluateScopeFilter(app, finalFilter))
                    .flatMap(app -> {
                        // Build payload
                        Map<String, Object> payload = Map.of(
                                "event", "scheduler.cron",
                                "tenantId", workflow.getTenantId(),
                                "companyId", workflow.getCompanyId(),
                                "timestamp", LocalDateTime.now().toString(),
                                "data", Map.of(
                                        "appointment", app
                                )
                        );
                        return workflowEngineExecutor.executeAndLog(workflow, payload)
                                .onErrorResume(err -> {
                                    log.error("❌ Error running scheduled workflow for appointment {}: {}", app.getId(), err.getMessage());
                                    return Mono.empty();
                                });
                    });
        } else {
            log.warn("⚠️ Unknown scope '{}' for workflow ID {}", scope, workflow.getId());
            return Flux.empty();
        }
    }

    /**
     * Checks if the entity meets the scope filter condition.
     */
    private boolean evaluateScopeFilter(Object entity, String filter) {
        if (filter == null || filter.trim().isEmpty()) {
            return true;
        }
        try {
            // Evaluates a simple "key = value" format
            String[] parts = filter.split("=");
            if (parts.length != 2) {
                return true;
            }
            String key = parts[0].trim();
            String value = parts[1].trim().replace("'", "").replace("\"", "");
            
            if (entity instanceof com.app.persistence.entity.ContactEntity) {
                com.app.persistence.entity.ContactEntity contact = (com.app.persistence.entity.ContactEntity) entity;
                if ("isActive".equalsIgnoreCase(key)) {
                    return String.valueOf(contact.getIsActive()).equalsIgnoreCase(value);
                }
                if ("phone".equalsIgnoreCase(key)) {
                    return contact.getPhone() != null && contact.getPhone().equals(value);
                }
                if ("email".equalsIgnoreCase(key)) {
                    return contact.getEmail() != null && contact.getEmail().equalsIgnoreCase(value);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to evaluate scope filter: {}", filter, e);
        }
        return true;
    }

    /**
     * Returns whether a workflow is currently scheduled.
     */
    public boolean isWorkflowScheduled(Long workflowId) {
        return scheduledTasks.containsKey(workflowId);
    }
}
