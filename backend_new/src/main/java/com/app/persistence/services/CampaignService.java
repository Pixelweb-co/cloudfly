package com.app.persistence.services;

import com.app.persistence.entity.CampaignEntity;
import com.app.persistence.repository.CampaignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final SchedulerClient schedulerClient;

    public Flux<CampaignEntity> findAll(Long tenantId, Long companyId) {
        log.info("Fetching all campaigns for tenant: {}, company: {}", tenantId, companyId);
        return campaignRepository.findByTenantIdAndCompanyId(tenantId, companyId);
    }

    public Mono<CampaignEntity> findById(Long id, Long tenantId, Long companyId) {
        return campaignRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId);
    }

    public Mono<CampaignEntity> create(CampaignEntity campaign, Long tenantId, Long companyId) {
        validateExclusivity(campaign);
        
        campaign.setTenantId(tenantId);
        campaign.setCompanyId(companyId);
        campaign.setStatus("DRAFT");
        
        // Initial metrics
        campaign.setTotalSent(0);
        campaign.setTotalDelivered(0);
        campaign.setTotalRead(0);
        campaign.setTotalFailed(0);
        
        campaign.setCreatedAt(LocalDateTime.now());
        campaign.setUpdatedAt(LocalDateTime.now());

        log.info("Creating new campaign: {} for tenant: {}", campaign.getName(), tenantId);
        return campaignRepository.save(campaign)
                .flatMap(saved -> {
                    if (saved.getScheduledAt() != null) {
                        return schedulerClient.scheduleCampaign(
                                saved.getId(), 
                                saved.getName(), 
                                saved.getScheduledAt(), 
                                tenantId, 
                                companyId
                        ).thenReturn(saved);
                    }
                    return Mono.just(saved);
                });
    }

    public Mono<CampaignEntity> update(Long id, CampaignEntity campaign, Long tenantId, Long companyId) {
        return campaignRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .flatMap(existing -> {
                    // Rule: Cannot edit if not DRAFT or SCHEDULED
                    if (!canEdit(existing.getStatus())) {
                        return Mono.error(new RuntimeException("No se puede editar una campaña en estado " + existing.getStatus()));
                    }

                    validateExclusivity(campaign);

                    existing.setName(campaign.getName());
                    existing.setDescription(campaign.getDescription());
                    existing.setChannelId(campaign.getChannelId());
                    existing.setSendingListId(campaign.getSendingListId());
                    existing.setPipelineId(campaign.getPipelineId());
                    existing.setPipelineStage(campaign.getPipelineStage());
                    existing.setMessage(campaign.getMessage());
                    existing.setMediaUrl(campaign.getMediaUrl());
                    existing.setMediaType(campaign.getMediaType());
                    existing.setMediaCaption(campaign.getMediaCaption());
                    existing.setProductId(campaign.getProductId());
                    existing.setCategoryId(campaign.getCategoryId());
                    existing.setScheduledAt(campaign.getScheduledAt());
                    existing.setUpdatedAt(LocalDateTime.now());

                    return campaignRepository.save(existing)
                            .flatMap(saved -> {
                                if (saved.getScheduledAt() != null) {
                                    return schedulerClient.scheduleCampaign(
                                            saved.getId(), 
                                            saved.getName(), 
                                            saved.getScheduledAt(), 
                                            tenantId, 
                                            companyId
                                    ).thenReturn(saved);
                                }
                                return Mono.just(saved);
                            });
                });
    }

    public Mono<CampaignEntity> updateStatus(Long id, String newStatus, Long tenantId, Long companyId) {
        return campaignRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .flatMap(existing -> {
                    validateStatusTransition(existing.getStatus(), newStatus);
                    existing.setStatus(newStatus);
                    
                    if ("RUNNING".equals(newStatus) && existing.getStartedAt() == null) {
                        existing.setStartedAt(LocalDateTime.now());
                    }
                    
                    if ("COMPLETED".equals(newStatus)) {
                        existing.setCompletedAt(LocalDateTime.now());
                    }
                    
                    existing.setUpdatedAt(LocalDateTime.now());
                    return campaignRepository.save(existing);
                });
    }

    private void validateExclusivity(CampaignEntity c) {
        // Segment exclusivity
        if (c.getSendingListId() != null && c.getPipelineId() != null) {
            throw new RuntimeException("Una campaña no puede tener una Lista de Envío y un Pipeline simultáneamente.");
        }
        
        // Product/Category exclusivity
        if (c.getProductId() != null && c.getCategoryId() != null) {
            throw new RuntimeException("Una campaña no puede referenciar un Producto y una Categoría simultáneamente.");
        }
    }

    private boolean canEdit(String status) {
        List<String> editableStatuses = Arrays.asList("DRAFT", "SCHEDULED");
        return editableStatuses.contains(status);
    }

    private void validateStatusTransition(String current, String next) {
        // Simplified validation logic for DRAFT -> SCHEDULED -> RUNNING -> COMPLETED
        log.info("Validating transition from {} to {}", current, next);
        
        if (current.equals(next)) return;

        // Terminal states
        List<String> terminal = Arrays.asList("COMPLETED", "CANCELLED", "FAILED");
        if (terminal.contains(current)) {
            throw new RuntimeException("No se puede cambiar el estado de una campaña finalizada.");
        }
        
        // Basic flow validation
        if ("DRAFT".equals(current) && "COMPLETED".equals(next)) {
            throw new RuntimeException("No se puede completar una campaña que no ha sido iniciada.");
        }
    }
}
