package com.app.persistence.services;

import com.app.persistence.entity.MarketingCampaignEntity;
import com.app.persistence.entity.CampaignAdEntity;
import com.app.persistence.repository.MarketingCampaignRepository;
import com.app.persistence.repository.CampaignAdRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MarketingService {

    private final MarketingCampaignRepository campaignRepository;
    private final CampaignAdRepository adRepository;

    public Flux<MarketingCampaignEntity> getCampaigns(Long companyId, Long tenantId) {
        // return campaignRepository.findByCompanyIdAndTenantId(companyId, tenantId);
        return Flux.empty();
    }

    public Mono<MarketingCampaignEntity> createCampaign(MarketingCampaignEntity campaign, Long companyId, Long tenantId) {
        campaign.setCompanyId(companyId);
        campaign.setTenantId(tenantId);
        campaign.setCreatedAt(LocalDateTime.now());
        campaign.setUpdatedAt(LocalDateTime.now());
        if (campaign.getStatus() == null) campaign.setStatus("DRAFT");
        return campaignRepository.save(campaign);
    }

    public Mono<MarketingCampaignEntity> getCampaignById(Long id, Long companyId, Long tenantId) {
        return campaignRepository.findById(id)
                .filter(c -> c.getCompanyId().equals(companyId) && c.getTenantId().equals(tenantId));
    }

    public Flux<CampaignAdEntity> getAdsByCampaign(Long campaignId, Long companyId) {
        return adRepository.findByCampaignIdAndCompanyId(campaignId, companyId);
    }

    public Mono<CampaignAdEntity> createAd(CampaignAdEntity ad, Long companyId) {
        ad.setCompanyId(companyId);
        ad.setCreatedAt(LocalDateTime.now());
        ad.setUpdatedAt(LocalDateTime.now());
        return adRepository.save(ad);
    }
}
