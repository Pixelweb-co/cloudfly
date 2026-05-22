package com.app.persistence.repository;

import com.app.persistence.entity.WorkflowExecutionLogEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface WorkflowExecutionLogRepository extends ReactiveCrudRepository<WorkflowExecutionLogEntity, Long> {

    @Query("SELECT * FROM workflow_execution_logs WHERE workflow_id = :workflowId AND tenant_id = :tenantId AND company_id = :companyId ORDER BY created_at DESC")
    Flux<WorkflowExecutionLogEntity> findByWorkflowIdAndTenantIdAndCompanyId(Long workflowId, Long tenantId, Long companyId);

    @Query("SELECT * FROM workflow_execution_logs WHERE tenant_id = :tenantId AND company_id = :companyId ORDER BY created_at DESC")
    Flux<WorkflowExecutionLogEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);
}
