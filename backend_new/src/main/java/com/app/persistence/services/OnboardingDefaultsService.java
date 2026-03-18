package com.app.persistence.services;

import com.app.persistence.entity.ChannelEntity;
import com.app.persistence.entity.MarketingCampaignEntity;
import com.app.persistence.repository.ChannelRepository;
import com.app.persistence.repository.MarketingCampaignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnboardingDefaultsService {

    private final PipelineService pipelineService;
    private final MarketingCampaignRepository marketingCampaignRepository;
    private final ChannelRepository channelRepository;

    /**
     * Performs the default setup for a new tenant/company.
     * 1. Creates a default pipeline "Atención a Clientes".
     * 2. Creates a marketing campaign "Atención Clientes" linked to the pipeline.
     * 3. Creates a communication channel for WhatsApp.
     */
    public Mono<Void> performDefaultSetup(Long tenantId, Long companyId, String instanceName) {
        log.info("🚀 Starting default setup for Tenant: {}, Company: {}", tenantId, companyId);

        return pipelineService.createDefaultPipeline(tenantId)
                .flatMap(pipeline -> {
                    log.info("✅ Pipeline created: {}. Creating Marketing Campaign...", pipeline.getName());
                    
                    MarketingCampaignEntity campaign = MarketingCampaignEntity.builder()
                            .tenantId(tenantId)
                            .companyId(companyId)
                            .name("Atención Clientes")
                            .description("Campaña predeterminada para el canal de WhatsApp.")
                            .status("ACTIVE")
                            .targetPipelineId(pipeline.getId())
                            .createdAt(LocalDateTime.now())
                            .build();

                    return marketingCampaignRepository.save(campaign)
                            .flatMap(savedCampaign -> {
                                log.info("✅ Marketing Campaign created: {}. Creating Channel...", savedCampaign.getName());
                                
                                ChannelEntity channel = ChannelEntity.builder()
                                        .tenantId(tenantId)
                                        .companyId(companyId)
                                        .name("WhatsApp Principal")
                                        .platform("WHATSAPP")
                                        .provider("EVOLUTION_API")
                                        .instanceName(instanceName)
                                        .status(true)
                                        .createdAt(LocalDateTime.now())
                                        .build();

                                return channelRepository.save(channel);
                            });
                })
                .doOnSuccess(v -> log.info("🎉 Default setup completed successfully for company: {}", companyId))
                .then();
    }
}
