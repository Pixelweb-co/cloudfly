package com.app.persistence.services;

import com.app.persistence.entity.TenantEntity;
import com.app.persistence.entity.CompanyEntity;
import com.app.persistence.entity.PipelineEntity;
import com.app.persistence.entity.PipelineStageEntity;
import com.app.persistence.repository.TenantRepository;
import com.app.persistence.repository.CompanyRepository;
import com.app.persistence.repository.PipelineRepository;
import com.app.persistence.repository.PipelineStageRepository;
import com.app.persistence.repository.ChannelConfigRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final CompanyRepository companyRepository;
    private final PipelineRepository pipelineRepository;
    private final PipelineStageRepository pipelineStageRepository;
    private final ChannelConfigRepository channelConfigRepository;
    private final EvolutionService evolutionService;
    private final DatabaseClient databaseClient;



    public Mono<TenantEntity> createTenant(String name) {
        TenantEntity tenant = TenantEntity.builder()
                .name(name)
                .status(true)
                .businessType("MIXTO")
                .esEmisorFE(false)
                .esEmisorPrincipal(false)
                .isMasterTenant(false)
                .createdAt(LocalDateTime.now())
                .build();
        return tenantRepository.save(tenant)
                .flatMap(savedTenant -> {
                    CompanyEntity defaultCompany = CompanyEntity.builder()
                            .tenantId(savedTenant.getId())
                            .name(name + " (Default)")
                            .status(true)
                            .isPrincipal(true)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    
                    return companyRepository.save(defaultCompany)
                            .flatMap(savedCompany -> createDefaultPipeline(savedTenant.getId(), savedCompany.getId()))
                            .thenReturn(savedTenant);
                });
    }

    private Mono<Void> createDefaultPipeline(Long tenantId, Long companyId) {
        PipelineEntity defaultPipeline = PipelineEntity.builder()
                .tenantId(tenantId)
                .companyId(companyId)
                .name("Pipeline General")
                .description("Embudo por defecto creado automáticamente")
                .type("SALES")
                .color("#7367F0")
                .isActive(true)
                .isDefault(true)
                .createdAt(LocalDateTime.now())
                .build();

        return pipelineRepository.save(defaultPipeline)
                .flatMap(pipeline -> {
                    PipelineStageEntity s1 = createStage(pipeline.getId(), "Contacto Inicial", "#3B82F6", 0, true, false, "OPEN");
                    PipelineStageEntity s2 = createStage(pipeline.getId(), "En Negociación", "#EAB308", 1, false, false, "OPEN");
                    PipelineStageEntity s3 = createStage(pipeline.getId(), "Ganado", "#22C55E", 2, false, true, "WON");
                    
                    return pipelineStageRepository.save(s1)
                            .then(pipelineStageRepository.save(s2))
                            .then(pipelineStageRepository.save(s3))
                            .then();
                });
    }

    private PipelineStageEntity createStage(Long pipelineId, String name, String color, int position, boolean isInitial, boolean isFinal, String outcome) {
        return PipelineStageEntity.builder()
                .pipelineId(pipelineId)
                .name(name)
                .color(color)
                .position(position)
                .isInitial(isInitial)
                .isFinal(isFinal)
                .outcome(outcome)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public Mono<TenantEntity> getById(Long id) {
        return tenantRepository.findById(id);
    }

    @Transactional
    public Mono<Void> deleteTenantFull(Long id) {
        // 1. Limpiar instancias de Evolution API asociadas
        return channelConfigRepository.findByTenantId(id)
                .flatMap(config -> {
                    if (config.getInstanceName() != null) {
                        return evolutionService.deleteInstance(config.getInstanceName())
                                .onErrorResume(e -> Mono.empty()); // Ignorar errores de red
                    }
                    return Mono.empty();
                })
                .then(databaseClient.sql("DELETE FROM campaign_send_logs WHERE campaign_id IN (SELECT id FROM campaigns WHERE tenant_id = :id)").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM sending_list_contacts WHERE sending_list_id IN (SELECT id FROM sending_lists WHERE tenant_id = :id)").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = :id)").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM quotes WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM appointments WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM availability_slots WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM availability_templates WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM campaign_ads WHERE campaign_id IN (SELECT id FROM marketing_campaigns WHERE tenant_id = :id)").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM marketing_campaigns WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM campaigns WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM sending_lists WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM orders WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM contacts WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM product_images WHERE product_id IN (SELECT id FROM productos WHERE tenant_id = :id)").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM productos WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM categorias WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM channel_type_configs WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM channel_configs WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM channels WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM chatbots WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM pipeline_stages WHERE pipeline_id IN (SELECT id FROM pipelines WHERE tenant_id = :id)").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM pipelines WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM companies WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM subscription_modules WHERE subscription_id IN (SELECT id FROM subscriptions WHERE customer_id = :id)").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM subscriptions WHERE customer_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM web_notifications WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM scheduled_jobs WHERE tenant_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM users WHERE customer_id = :id").bind("id", id).fetch().rowsUpdated().onErrorResume(e -> Mono.empty()))
                .then(databaseClient.sql("DELETE FROM clientes WHERE id = :id").bind("id", id).fetch().rowsUpdated())
                .then();
    }
}

