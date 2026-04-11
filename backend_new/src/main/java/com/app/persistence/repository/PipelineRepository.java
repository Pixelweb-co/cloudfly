package com.app.persistence.repository;

import com.app.persistence.entity.PipelineEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PipelineRepository extends ReactiveCrudRepository<PipelineEntity, Long> {
    @Query("SELECT * FROM pipelines WHERE tenant_id = :tenantId")
    Flux<PipelineEntity> findByTenantId(Long tenantId);

    @Query("SELECT * FROM pipelines WHERE tenant_id = :tenantId AND company_id = :companyId")
    Flux<PipelineEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM pipelines WHERE id = :id AND tenant_id = :tenantId")
    Mono<PipelineEntity> findByIdAndTenantId(Long id, Long tenantId);

    @Query("SELECT * FROM pipelines WHERE tenant_id = :tenantId AND is_default = :isDefault")
    Mono<PipelineEntity> findByTenantIdAndIsDefault(Long tenantId, boolean isDefault);

    @Query("SELECT * FROM pipelines WHERE tenant_id = :tenantId AND is_default = TRUE")
    Flux<PipelineEntity> findByTenantIdAndIsDefaultTrue(Long tenantId);
}
