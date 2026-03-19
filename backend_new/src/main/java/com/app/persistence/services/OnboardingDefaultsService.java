package com.app.persistence.services;

import com.app.persistence.entity.*;
import com.app.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnboardingDefaultsService {

    private final PipelineService pipelineService;
    private final MarketingCampaignRepository marketingCampaignRepository;
    private final ChannelRepository channelRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionModuleRepository subscriptionModuleRepository;
    private final ModuleRepository moduleRepository;

    // Default plan ID (plan "Básico" o primer plan en el sistema)
    private static final Long DEFAULT_PLAN_ID = 1L;

    /**
     * Performs the default setup for a new tenant/company.
     * 1. Creates a Subscription with all modules for the tenant.
     * 2. Creates a default pipeline "Atención a Clientes".
     * 3. Creates a marketing campaign "Atención Clientes" linked to the pipeline.
     * 4. Creates a communication channel for WhatsApp.
     */
    public Mono<Void> performDefaultSetup(Long tenantId, Long companyId, String instanceName) {
        log.info("🚀 Starting default setup for Tenant: {}, Company: {}", tenantId, companyId);

        return createDefaultSubscription(tenantId)
                .flatMap(subscription -> {
                    log.info("✅ Subscription created: {} for tenant {}", subscription.getId(), tenantId);
                    return assignAllModulesToSubscription(subscription.getId());
                })
                .then(pipelineService.createDefaultPipeline(tenantId))
                .flatMap(pipeline -> {
                    log.info("✅ Pipeline created: {}. Creating Marketing Campaign...", pipeline.getName());

                    MarketingCampaignEntity campaign = new MarketingCampaignEntity();
                    campaign.setTenantId(tenantId);
                    campaign.setCompanyId(companyId);
                    campaign.setName("Atención Clientes");
                    campaign.setDescription("Campaña predeterminada para el canal de WhatsApp.");
                    campaign.setStatus("ACTIVE");
                    campaign.setTargetPipelineId(pipeline.getId());
                    campaign.setCreatedAt(LocalDateTime.now());

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

    /**
     * Creates a default TRIAL subscription for the new tenant valid 30 days.
     */
    private Mono<SubscriptionEntity> createDefaultSubscription(Long tenantId) {
        LocalDateTime now = LocalDateTime.now();
        SubscriptionEntity subscription = SubscriptionEntity.builder()
                .planId(DEFAULT_PLAN_ID)
                .customerId(tenantId)
                .startDate(now)
                .endDate(now.plusDays(30))
                .billingCycle("MONTHLY")
                .status("ACTIVE")
                .isAutoRenew(false)
                .usersLimit(10)
                .allowOverage(false)
                .monthlyPrice(BigDecimal.ZERO)
                .notes("Suscripción creada automáticamente durante el onboarding.")
                .createdAt(now)
                .updatedAt(now)
                .build();

        return subscriptionRepository.save(subscription)
                .doOnSuccess(s -> log.info("📋 Subscription {} saved for tenant {}", s.getId(), tenantId))
                .doOnError(e -> log.error("❌ Error saving subscription for tenant {}: {}", tenantId, e.getMessage()));
    }

    /**
     * Assigns all active modules to the subscription.
     */
    private Mono<Void> assignAllModulesToSubscription(Long subscriptionId) {
        return moduleRepository.findAll()
                .filter(module -> Boolean.TRUE.equals(module.getIsActive()))
                .flatMap(module -> subscriptionModuleRepository
                        .insertModule(subscriptionId, module.getId())
                        .doOnSuccess(v -> log.info("🔗 Module '{}' linked to subscription {}", module.getCode(), subscriptionId))
                        .onErrorResume(e -> {
                            log.warn("⚠️ Could not link module {} to subscription {}: {}", module.getId(), subscriptionId, e.getMessage());
                            return Mono.empty();
                        })
                )
                .then()
                .doOnSuccess(v -> log.info("✅ All modules assigned to subscription {}", subscriptionId));
    }
}
