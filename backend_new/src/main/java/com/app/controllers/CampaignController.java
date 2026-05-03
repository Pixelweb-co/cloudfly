package com.app.controllers;

import com.app.persistence.entity.CampaignEntity;
import com.app.persistence.services.CampaignService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/marketing/campaigns")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CampaignController {

    private final CampaignService campaignService;

    private record UserContext(Long tenantId, Long companyId) {}

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return new UserContext(1L, null);
                    }
                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id");
                    Long tokenCompanyId = (Long) details.get("company_id");
                    
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());
                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER");

                    Long finalTenantId = tokenTenantId;
                    if (isAdminOrManager && headers.containsKey("x-tenant-id")) {
                        finalTenantId = Long.parseLong(headers.get("x-tenant-id"));
                    }
                    Long finalCompanyId = tokenCompanyId;
                    if (isAdminOrManager && headers.containsKey("x-company-id")) {
                        finalCompanyId = Long.parseLong(headers.get("x-company-id"));
                    }

                    return new UserContext(finalTenantId, finalCompanyId);
                });
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Flux<CampaignEntity> getAll(@RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> campaignService.findAll(ctx.tenantId(), ctx.companyId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<CampaignEntity> getById(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> campaignService.findById(id, ctx.tenantId(), ctx.companyId()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<CampaignEntity> create(@RequestBody CampaignEntity campaign, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> campaignService.create(campaign, ctx.tenantId(), ctx.companyId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<CampaignEntity> update(@PathVariable Long id, @RequestBody CampaignEntity campaign, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> campaignService.update(id, campaign, ctx.tenantId(), ctx.companyId()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public Mono<CampaignEntity> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body, @RequestHeader Map<String, String> headers) {
        String newStatus = body.get("status");
        return getCurrentUserContext(headers)
                .flatMap(ctx -> campaignService.updateStatus(id, newStatus, ctx.tenantId(), ctx.companyId()));
    }
}
