package com.marketing.worker.service;

import com.marketing.worker.dto.CampaignPayload;
import com.marketing.worker.persistence.entity.CampaignEntity;
import com.marketing.worker.persistence.repository.CampaignRepository;
import com.marketing.worker.persistence.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignExecutionService {

    private final CampaignRepository campaignRepository;
    private final ContactRepository contactRepository;
    private final EvolutionService evolutionService;
    private final MessageFormatterService messageFormatterService;

    public Mono<Void> executeCampaign(CampaignPayload payload) {
        return campaignRepository.findById(payload.getCampaignId())
                .flatMap(campaign -> {
                    log.info("📢 Starting execution of campaign: {}", campaign.getName());
                    
                    // Update status to RUNNING
                    campaign.setStatus("RUNNING");
                    return campaignRepository.save(campaign)
                            .thenMany(fetchContacts(campaign))
                            .flatMap(contact -> {
                                return messageFormatterService.formatMessage(campaign, contact)
                                        .flatMap(message -> evolutionService.sendMessage(campaign, contact, message))
                                        .onErrorResume(e -> {
                                            log.error("⚠️ Failed to send message to contact {}: {}", contact.getId(), e.getMessage());
                                            return Mono.empty();
                                        });
                            }, 5) // Concurrency of 5
                            .then(Mono.defer(() -> {
                                campaign.setStatus("COMPLETED");
                                return campaignRepository.save(campaign).then();
                            }));
                });
    }

    private reactor.core.publisher.Flux<com.marketing.worker.persistence.entity.ContactEntity> fetchContacts(CampaignEntity campaign) {
        if (campaign.getSendingListId() != null) {
            return contactRepository.findBySendingListId(campaign.getSendingListId());
        } else if (campaign.getPipelineId() != null && campaign.getPipelineStage() != null) {
            return contactRepository.findByPipelineAndStage(campaign.getPipelineId(), campaign.getPipelineStage());
        }
        return reactor.core.publisher.Flux.empty();
    }
}
