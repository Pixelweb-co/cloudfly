package com.app.persistence.repository;

import com.app.persistence.entity.CampaignEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CampaignRepository extends ReactiveCrudRepository<CampaignEntity, Long> {
    @Query("SELECT * FROM campaigns WHERE tenant_id = :tenantId AND company_id = :companyId")
    Flux<CampaignEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM campaigns WHERE tenant_id = :tenantId AND company_id = :companyId AND status = :status")
    Flux<CampaignEntity> findByTenantIdAndCompanyIdAndStatus(Long tenantId, Long companyId, String status);

    @Query("SELECT * FROM campaigns WHERE id = :id AND tenant_id = :tenantId AND company_id = :companyId")
    Mono<CampaignEntity> findByIdAndTenantIdAndCompanyId(Long id, Long tenantId, Long companyId);
}
