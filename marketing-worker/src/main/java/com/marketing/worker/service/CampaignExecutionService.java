package com.marketing.worker.service;

import com.marketing.worker.dto.CampaignPayload;
import com.marketing.worker.persistence.entity.CampaignEntity;
import com.marketing.worker.persistence.entity.ContactEntity;
import com.marketing.worker.persistence.repository.CampaignRepository;
import com.marketing.worker.persistence.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignExecutionService {

    private final CampaignRepository campaignRepository;
    private final ContactRepository contactRepository;
    private final EvolutionService evolutionService;
    private final MessageFormatterService messageFormatterService;
    private final com.marketing.worker.persistence.repository.CampaignSendLogRepository campaignSendLogRepository;

    // Anti-spam: batch size before taking a long pause
    private static final int BATCH_SIZE = 20;
    private static final long BATCH_PAUSE_MS = 30_000; // 30 seconds pause every 20 messages

    public Mono<Void> executeCampaign(CampaignPayload payload) {
        return campaignRepository.findById(payload.getCampaignId())
                .flatMap(campaign -> {
                    log.info("📢 Starting campaign: {} (id={})", campaign.getName(), campaign.getId());
                    
                    campaign.setStatus("RUNNING");
                    AtomicInteger counter = new AtomicInteger(0);
                    AtomicInteger sent = new AtomicInteger(0);
                    AtomicInteger failed = new AtomicInteger(0);

                    return campaignRepository.save(campaign)
                            .thenMany(fetchContacts(campaign))
                            .concatMap(contact -> {
                                int idx = counter.incrementAndGet();

                                // Anti-spam: Random delay between 3-12 seconds per message
                                long delay = 3000 + (long)(Math.random() * 9000);

                                // Anti-spam: Longer pause every BATCH_SIZE messages
                                if (idx > 1 && (idx - 1) % BATCH_SIZE == 0) {
                                    long batchDelay = BATCH_PAUSE_MS + (long)(Math.random() * 15_000);
                                    log.info("⏸️ Anti-spam batch pause: {}s after {} messages", batchDelay / 1000, idx - 1);
                                    delay += batchDelay;
                                }

                                long finalDelay = delay;
                                log.info("📤 [{}/...] Sending to {} (delay: {}ms)", idx, contact.getPhone(), finalDelay);

                                return Mono.delay(Duration.ofMillis(finalDelay))
                                        .then(messageFormatterService.formatMessage(campaign, contact))
                                        .flatMap(message -> evolutionService.sendMessage(campaign, contact, message))
                                        .flatMap(providerId -> {
                                            sent.incrementAndGet();
                                            return campaignSendLogRepository.save(com.marketing.worker.persistence.entity.CampaignSendLogEntity.builder()
                                                    .campaignId(campaign.getId())
                                                    .contactId(contact.getId())
                                                    .destination(contact.getPhone())
                                                    .status("SENT")
                                                    .providerMessageId(providerId)
                                                    .sentAt(java.time.LocalDateTime.now())
                                                    .createdAt(java.time.LocalDateTime.now())
                                                    .build());
                                        })
                                        .onErrorResume(e -> {
                                            failed.incrementAndGet();
                                            log.error("⚠️ Failed to send to contact {}: {}", contact.getId(), e.getMessage());
                                            return campaignSendLogRepository.save(com.marketing.worker.persistence.entity.CampaignSendLogEntity.builder()
                                                    .campaignId(campaign.getId())
                                                    .contactId(contact.getId())
                                                    .destination(contact.getPhone())
                                                    .status("FAILED")
                                                    .errorMessage(e.getMessage())
                                                    .createdAt(java.time.LocalDateTime.now())
                                                    .build());
                                        });
                            })
                            .then(Mono.defer(() -> {
                                campaign.setStatus("COMPLETED");
                                campaign.setTotalSent(sent.get());
                                campaign.setTotalFailed(failed.get());
                                log.info("✅ Campaign {} completed. Sent: {}, Failed: {}", 
                                        campaign.getName(), sent.get(), failed.get());
                                return campaignRepository.save(campaign).then();
                            }));
                });
    }

    private Flux<ContactEntity> fetchContacts(CampaignEntity campaign) {
        if (campaign.getSendingListId() != null) {
            return contactRepository.findBySendingListId(campaign.getSendingListId());
        } else if (campaign.getPipelineId() != null && campaign.getPipelineStage() != null) {
            return contactRepository.findByPipelineAndStage(campaign.getPipelineId(), campaign.getPipelineStage());
        }
        return Flux.empty();
    }
}
