package com.marketing.worker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketing.worker.dto.CampaignPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaCampaignConsumer {

    private final CampaignExecutionService campaignExecutionService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "campaign-worker-queue", groupId = "marketing-worker-group")
    public void consumeCampaign(String message) {
        log.info("📥 Received campaign trigger from Kafka: {}", message);
        try {
            CampaignPayload payload = objectMapper.readValue(message, CampaignPayload.class);
            log.info("🚀 Processing campaign {} for tenant {} and company {}", 
                    payload.getCampaignId(), payload.getTenantId(), payload.getCompanyId());
            
            campaignExecutionService.executeCampaign(payload)
                    .subscribe(
                            success -> log.info("✅ Campaign {} execution finished", payload.getCampaignId()),
                            error -> log.error("❌ Error executing campaign {}: {}", payload.getCampaignId(), error.getMessage())
                    );
            
        } catch (Exception e) {
            log.error("❌ Error parsing campaign payload: {}", e.getMessage());
        }
    }
}
