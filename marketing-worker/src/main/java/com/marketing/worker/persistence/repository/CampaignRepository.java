package com.marketing.worker.persistence.repository;

import com.marketing.worker.persistence.entity.CampaignEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CampaignRepository extends ReactiveCrudRepository<CampaignEntity, Long> {
}
