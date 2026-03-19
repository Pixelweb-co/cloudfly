package com.app.controllers;

import com.app.dto.ChannelConfigDTO;
import com.app.persistence.services.ChannelConfigService;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/channel-config")
@RequiredArgsConstructor
public class ChannelConfigController {

    private final ChannelConfigService channelConfigService;
    private final UserService userService;

    private Mono<Long> getCurrentTenantId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .doOnNext(auth -> log.info("🔐 [CHANNEL-CONFIG-AUTH] Checking auth for: {}", auth != null ? auth.getName() : "NULL"))
                .flatMap(auth -> userService.findByUsername(auth.getName()))
                .map(user -> {
                    log.info("👤 [CHANNEL-CONFIG-AUTH] Found user: {} with customerId: {}", user.getUsername(), user.getCustomerId());
                    return user.getCustomerId();
                })
                .doOnTerminate(() -> log.info("🏁 [CHANNEL-CONFIG-AUTH] Tenant lookup finished"));
    }

    @GetMapping("/config")
    public Mono<ResponseEntity<ChannelConfigDTO>> getConfig() {
        return getCurrentTenantId()
                .flatMap(tenantId -> {
                    log.info("📋 [CHANNEL-CONFIG] Getting config for tenantId: {}", tenantId);
                    return channelConfigService.getConfigByTenant(tenantId);
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/status")
    public Mono<ResponseEntity<ChannelConfigDTO>> getStatus() {
        return getCurrentTenantId()
                .flatMap(tenantId -> {
                    log.info("📊 [CHANNEL-CONFIG] Getting status for tenantId: {}", tenantId);
                    return channelConfigService.getStatus(tenantId);
                })
                .map(ResponseEntity::ok);
    }

    @PostMapping("/activate")
    public Mono<ResponseEntity<ChannelConfigDTO>> activateChannel() {
        return getCurrentTenantId()
                .flatMap(tenantId -> {
                    log.info("🚀 [CHANNEL-CONFIG] Activating channel for tenantId: {}", tenantId);
                    return channelConfigService.activateChatbot(tenantId);
                })
                .map(ResponseEntity::ok);
    }
}
