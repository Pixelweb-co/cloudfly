package com.app.persistence.repository;

import com.app.persistence.entity.CampaignAdEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface CampaignAdRepository extends ReactiveCrudRepository<CampaignAdEntity, Long> {
    Flux<CampaignAdEntity> findByCampaignIdAndCompanyId(Long campaignId, Long companyId);
    Flux<CampaignAdEntity> findByCompanyId(Long companyId);
}
