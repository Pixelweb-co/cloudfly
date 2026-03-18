package com.app.controllers;

import com.app.persistence.entity.ChannelEntity;
import com.app.persistence.services.ChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/marketing/channels")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChannelController {

    private final ChannelService channelService;

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<ChannelEntity> getChannels(Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        Long companyId = getCompanyId(authentication);
        return channelService.getChannels(companyId, tenantId);
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<ChannelEntity> createChannel(@RequestBody ChannelEntity channel, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        Long companyId = getCompanyId(authentication);
        return channelService.createChannel(channel, companyId, tenantId);
    }

    @GetMapping("/{id}")
    public Mono<ChannelEntity> getChannelById(@PathVariable Long id, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        Long companyId = getCompanyId(authentication);
        return channelService.getChannelById(id, companyId, tenantId);
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
