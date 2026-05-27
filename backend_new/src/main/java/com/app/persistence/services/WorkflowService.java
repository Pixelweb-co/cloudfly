package com.app.persistence.services;

import com.app.dto.WorkflowPaginatedResponse;
import com.app.dto.WorkflowRequest;
import com.app.persistence.entity.WorkflowEntity;
import com.app.persistence.entity.WorkflowExecutionLogEntity;
import com.app.persistence.repository.WorkflowExecutionLogRepository;
import com.app.persistence.repository.WorkflowRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowExecutionLogRepository logRepository;
    private final ObjectMapper objectMapper;
    private final com.app.workflow.engine.DynamicWorkflowScheduler dynamicWorkflowScheduler;

    public Mono<WorkflowEntity> getWorkflowById(Long id, Long tenantId, Long companyId) {
        return workflowRepository.findById(id)
                .filter(w -> w.getTenantId().equals(tenantId) && w.getCompanyId().equals(companyId))
                .switchIfEmpty(Mono.error(new RuntimeException("Workflow no encontrado o no pertenece a esta compañía.")));
    }

    public Mono<WorkflowEntity> createWorkflow(WorkflowRequest request, Long tenantId, Long companyId) {
        log.info("Creating workflow: {} for tenant: {}, company: {}", request.getName(), tenantId, companyId);
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            return Mono.error(new RuntimeException("El nombre del workflow no puede estar vacío."));
        }

        // Validate JSON steps
        if (request.getWorkflowSteps() != null) {
            try {
                objectMapper.readTree(request.getWorkflowSteps());
            } catch (Exception e) {
                return Mono.error(new RuntimeException("Estructura de pasos (workflowSteps) inválida. Debe ser JSON válido."));
            }
        }

        WorkflowEntity workflow = WorkflowEntity.builder()
                .tenantId(tenantId)
                .companyId(companyId)
                .name(name)
                .description(request.getDescription())
                .triggerEvent(request.getTriggerEvent())
                .cronExpression(request.getCronExpression())
                .initialStepId(request.getInitialStepId() != null ? request.getInitialStepId() : "step_1")
                .workflowSteps(request.getWorkflowSteps() != null ? request.getWorkflowSteps() : "{}")
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return workflowRepository.save(workflow)
                .doOnNext(dynamicWorkflowScheduler::scheduleWorkflow);
    }

    public Mono<WorkflowEntity> updateWorkflow(Long id, WorkflowRequest request, Long tenantId, Long companyId) {
        log.info("Updating workflow ID: {} for tenant: {}, company: {}", id, tenantId, companyId);
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            return Mono.error(new RuntimeException("El nombre del workflow no puede estar vacío."));
        }

        // Validate JSON steps
        if (request.getWorkflowSteps() != null) {
            try {
                objectMapper.readTree(request.getWorkflowSteps());
            } catch (Exception e) {
                return Mono.error(new RuntimeException("Estructura de pasos (workflowSteps) inválida. Debe ser JSON válido."));
            }
        }

        return getWorkflowById(id, tenantId, companyId)
                .flatMap(existing -> {
                    existing.setName(name);
                    existing.setDescription(request.getDescription());
                    existing.setTriggerEvent(request.getTriggerEvent());
                    existing.setCronExpression(request.getCronExpression());
                    if (request.getInitialStepId() != null) {
                        existing.setInitialStepId(request.getInitialStepId());
                    }
                    if (request.getWorkflowSteps() != null) {
                        existing.setWorkflowSteps(request.getWorkflowSteps());
                    }
                    if (request.getIsActive() != null) {
                        existing.setIsActive(request.getIsActive());
                    }
                    existing.setUpdatedAt(LocalDateTime.now());
                    return workflowRepository.save(existing);
                })
                .doOnNext(dynamicWorkflowScheduler::scheduleWorkflow);
    }

    public Mono<Void> deleteWorkflow(Long id, Long tenantId, Long companyId) {
        log.info("Deleting workflow ID: {} for tenant: {}, company: {}", id, tenantId, companyId);
        return getWorkflowById(id, tenantId, companyId)
                .flatMap(workflow -> workflowRepository.delete(workflow)
                        .then(Mono.fromRunnable(() -> dynamicWorkflowScheduler.cancelWorkflow(id))));
    }

    public Mono<WorkflowEntity> toggleWorkflowStatus(Long id, Long tenantId, Long companyId) {
        log.info("Toggling workflow status ID: {} for tenant: {}, company: {}", id, tenantId, companyId);
        return getWorkflowById(id, tenantId, companyId)
                .flatMap(existing -> {
                    existing.setIsActive(!existing.getIsActive());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return workflowRepository.save(existing);
                })
                .doOnNext(dynamicWorkflowScheduler::scheduleWorkflow);
    }

    public Mono<WorkflowPaginatedResponse> getWorkflows(Long tenantId, Long companyId, String name, 
                                                       String triggerEvent, Boolean isActive, int page, int size) {
        log.info("Querying workflows for tenant: {}, company: {}, page: {}, size: {}", tenantId, companyId, page, size);
        int limit = size > 0 ? size : 10;
        long offset = (long) Math.max(0, page) * limit;

        String nameFilter = (name != null && !name.trim().isEmpty()) ? name.trim() : null;
        String triggerFilter = (triggerEvent != null && !triggerEvent.trim().isEmpty()) ? triggerEvent.trim() : null;

        return workflowRepository.findWithFilters(tenantId, companyId, nameFilter, triggerFilter, isActive, limit, offset)
                .collectList()
                .zipWith(workflowRepository.countWithFilters(tenantId, companyId, nameFilter, triggerFilter, isActive))
                .map(tuple -> WorkflowPaginatedResponse.builder()
                        .items(tuple.getT1())
                        .totalItems(tuple.getT2())
                        .page(page)
                        .size(limit)
                        .build());
    }

    public Flux<WorkflowExecutionLogEntity> getExecutionLogs(Long workflowId, Long tenantId, Long companyId) {
        log.info("Fetching execution logs for workflow ID: {} under tenant: {}, company: {}", workflowId, tenantId, companyId);
        return getWorkflowById(workflowId, tenantId, companyId)
                .flatMapMany(workflow -> logRepository.findByWorkflowIdAndTenantIdAndCompanyId(workflowId, tenantId, companyId));
    }
}
