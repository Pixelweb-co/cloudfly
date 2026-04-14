package com.app.controllers;

import com.app.persistence.entity.ChannelEntity;
import com.app.persistence.services.ChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/marketing/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChannelController.class);

    private Mono<Long> getCurrentTenantId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null) {
                        log.warn("🔍 [CHANNEL-CTRL] No authentication found, using default tenant 1L");
                        return 1L;
                    }
                    try {
                        Object detailsObj = auth.getDetails();
                        if (detailsObj instanceof java.util.Map) {
                            java.util.Map<String, Object> details = (java.util.Map<String, Object>) detailsObj;
                            if (details.containsKey("customer_id")) {
                                Object cid = details.get("customer_id");
                                if (cid instanceof Number) return ((Number) cid).longValue();
                                return Long.parseLong(cid.toString());
                            }
                        }
                    } catch (Exception e) {
                        log.error("🔍 [CHANNEL-CTRL] Error extracting tenant_id: {}", e.getMessage());
                    }
                    return 1L;
                });
    }

    private Mono<Long> getCurrentCompanyId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null) {
                        log.warn("🔍 [CHANNEL-CTRL] No authentication found, using default company 1L");
                        return 1L;
                    }
                    try {
                        Object detailsObj = auth.getDetails();
                        if (detailsObj instanceof java.util.Map) {
                            java.util.Map<String, Object> details = (java.util.Map<String, Object>) detailsObj;
                            if (details.containsKey("company_id")) {
                                Object cid = details.get("company_id");
                                if (cid instanceof Number) return ((Number) cid).longValue();
                                return Long.parseLong(cid.toString());
                            }
                            // Fallback to customer_id if company_id is missing
                            if (details.containsKey("customer_id")) {
                                Object cid = details.get("customer_id");
                                if (cid instanceof Number) return ((Number) cid).longValue();
                                return Long.parseLong(cid.toString());
                            }
                        }
                    } catch (Exception e) {
                        log.error("🔍 [CHANNEL-CTRL] Error extracting company_id: {}", e.getMessage());
                    }
                    return 1L;
                });
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<ChannelEntity> getChannels() {
        return Mono.zip(getCurrentCompanyId(), getCurrentTenantId())
                .flatMapMany(tuple -> {
                    return channelService.getChannels(tuple.getT1(), tuple.getT2());
                });
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<ChannelEntity> createChannel(@RequestBody ChannelEntity channel) {
        return Mono.zip(getCurrentCompanyId(), getCurrentTenantId())
                .flatMap(tuple -> {
                    return channelService.createChannel(channel, tuple.getT1(), tuple.getT2());
                });
    }

    @GetMapping("/{id}")
    public Mono<ChannelEntity> getChannelById(@PathVariable Long id) {
        return Mono.zip(getCurrentCompanyId(), getCurrentTenantId())
                .flatMap(tuple -> {
                    return channelService.getChannelById(id, tuple.getT1(), tuple.getT2());
                });
    }

}
