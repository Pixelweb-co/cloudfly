package com.app.persistence.repository;

import com.app.persistence.entity.MarketingCampaignEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import org.springframework.data.r2dbc.repository.Query;

public interface MarketingCampaignRepository extends ReactiveCrudRepository<MarketingCampaignEntity, Long> {
    
    @Query("SELECT * FROM marketing_campaigns WHERE company_id = :companyId AND tenant_id = :tenantId")
    Flux<MarketingCampaignEntity> queryByCompanyAndTenant(Long companyId, Long tenantId);
    
    @Query("SELECT * FROM marketing_campaigns WHERE tenant_id = :tenantId")
    Flux<MarketingCampaignEntity> queryByTenant(Long tenantId);
}
