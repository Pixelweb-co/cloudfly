package com.app.controllers;

import com.app.persistence.entity.MarketingCampaignEntity;
import com.app.persistence.entity.CampaignAdEntity;
import com.app.persistence.services.MarketingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/marketing/campaigns")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MarketingController {

    private final MarketingService marketingService;

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<MarketingCampaignEntity> getCampaigns(@AuthenticationPrincipal User principal) { // Changed signature
        // Long tenantId = principal.getTenantId(); // These lines are implicitly removed by the snippet
        // Long companyId = principal.getCompanyId(); // These lines are implicitly removed by the snippet
        // return marketingService.getCampaigns(principal.getCompanyId(), principal.getTenantId()); // Commented out service call
        return Flux.empty(); // New return statement
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<MarketingCampaignEntity> createCampaign(@RequestBody MarketingCampaignEntity campaign, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        Long companyId = getCompanyId(authentication);
        return marketingService.createCampaign(campaign, companyId, tenantId);
    }

    @GetMapping("/{id}")
    public Mono<MarketingCampaignEntity> getCampaignById(@PathVariable Long id, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        Long companyId = getCompanyId(authentication);
        return marketingService.getCampaignById(id, companyId, tenantId);
    }

    @GetMapping("/{id}/ads")
    public Flux<CampaignAdEntity> getAdsByCampaign(@PathVariable Long id, Authentication authentication) {
        Long companyId = getCompanyId(authentication);
        return marketingService.getAdsByCampaign(id, companyId);
    }

    @PostMapping("/{id}/ads")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<CampaignAdEntity> createAd(@PathVariable Long id, @RequestBody CampaignAdEntity ad, Authentication authentication) {
        Long companyId = getCompanyId(authentication);
        ad.setCampaignId(id);
        return marketingService.createAd(ad, companyId);
    }

    private Long getTenantId(Authentication authentication) {
        if (authentication == null) return 1L;
        Map<String, Object> details = (Map<String, Object>) authentication.getDetails();
        if (details != null && details.containsKey("customer_id")) {
            return (Long) details.get("customer_id");
        }
        return 1L;
    }

    private Long getCompanyId(Authentication authentication) {
        if (authentication == null) return 1L;
        Map<String, Object> details = (Map<String, Object>) authentication.getDetails();
        if (details != null && details.containsKey("company_id")) {
            return (Long) details.get("company_id");
        }
        return 1L;
    }
}
