package com.app.persistence.repository;

import com.app.persistence.entity.CampaignSendLogEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CampaignSendLogRepository extends ReactiveCrudRepository<CampaignSendLogEntity, Long> {
    @Query("SELECT * FROM campaign_send_logs WHERE campaign_id = :campaignId")
    Flux<CampaignSendLogEntity> findByCampaignId(Long campaignId);

    @Query("SELECT * FROM campaign_send_logs WHERE campaign_id = :campaignId AND status = :status")
    Flux<CampaignSendLogEntity> findByCampaignIdAndStatus(Long campaignId, String status);

    @Query("SELECT COUNT(*) FROM campaign_send_logs WHERE campaign_id = :campaignId AND status = :status")
    Mono<Integer> countByCampaignIdAndStatus(Long campaignId, String status);
}
