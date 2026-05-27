package com.app.persistence.repository;

import com.app.persistence.entity.WorkflowEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface WorkflowRepository extends ReactiveCrudRepository<WorkflowEntity, Long> {

    @Query("SELECT * FROM workflows WHERE trigger_event = :triggerEvent AND is_active = 1")
    Flux<WorkflowEntity> findByTriggerEventAndIsActiveTrue(String triggerEvent);

    @Query("SELECT * FROM workflows WHERE tenant_id = :tenantId AND company_id = :companyId AND trigger_event = :triggerEvent AND is_active = 1")
    Flux<WorkflowEntity> findByTenantIdAndCompanyIdAndTriggerEventAndIsActiveTrue(Long tenantId, Long companyId, String triggerEvent);

    @Query("SELECT * FROM workflows WHERE tenant_id = :tenantId AND company_id = :companyId AND (:name IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :name, '%'))) AND (:triggerEvent IS NULL OR trigger_event = :triggerEvent) AND (:isActive IS NULL OR is_active = :isActive) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<WorkflowEntity> findWithFilters(Long tenantId, Long companyId, String name, String triggerEvent, Boolean isActive, int limit, long offset);

    @Query("SELECT COUNT(*) FROM workflows WHERE tenant_id = :tenantId AND company_id = :companyId AND (:name IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :name, '%'))) AND (:triggerEvent IS NULL OR trigger_event = :triggerEvent) AND (:isActive IS NULL OR is_active = :isActive)")
    Mono<Long> countWithFilters(Long tenantId, Long companyId, String name, String triggerEvent, Boolean isActive);
}
