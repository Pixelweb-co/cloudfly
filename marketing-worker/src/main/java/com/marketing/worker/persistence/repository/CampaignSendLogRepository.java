package com.marketing.worker.persistence.repository;

import com.marketing.worker.persistence.entity.CampaignSendLogEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface CampaignSendLogRepository extends ReactiveCrudRepository<CampaignSendLogEntity, Long> {
}
