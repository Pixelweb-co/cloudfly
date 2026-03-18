package com.app.persistence.repository;

import com.app.persistence.entity.MarketingCampaignEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface MarketingCampaignRepository extends ReactiveCrudRepository<MarketingCampaignEntity, Long> {
    Flux<MarketingCampaignEntity> findByCompanyIdAndTenantId(Long companyId, Long tenantId);
    Flux<MarketingCampaignEntity> findByTenantId(Long tenantId);
}
