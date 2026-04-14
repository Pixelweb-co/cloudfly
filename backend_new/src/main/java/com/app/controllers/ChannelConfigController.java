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

    private record UserContext(Long tenantId, Long companyId) {}

    private Mono<UserContext> getCurrentUserContext() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        log.warn("⚠️ [CHANNEL-CONFIG-AUTH] No auth or details found in context");
                        return new UserContext(1L, 1L); // Fallback
                    }
                    Object detailsObj = auth.getDetails();
                    if (detailsObj instanceof java.util.Map) {
                        java.util.Map<String, Object> details = (java.util.Map<String, Object>) detailsObj;
                        Long tenantId = (Long) details.get("customer_id");
                        Long companyId = (Long) details.get("company_id");
                        log.info("👤 [CHANNEL-CONFIG-AUTH] Context IDs - Tenant: {}, Company: {}", tenantId, companyId);
                        return new UserContext(tenantId != null ? tenantId : 1L, companyId != null ? companyId : 1L);
                    }
                    return new UserContext(1L, 1L);
                });
    }

    @GetMapping("/config")
    public Mono<ResponseEntity<ChannelConfigDTO>> getConfig() {
        return getCurrentUserContext()
                .flatMap(ctx -> {
                    log.info("📋 [CHANNEL-CONFIG] Getting config for tenantId: {}, companyId: {}", ctx.tenantId(), ctx.companyId());
                    return channelConfigService.getConfigByTenantAndCompany(ctx.tenantId(), ctx.companyId());
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/status")
    public Mono<ResponseEntity<ChannelConfigDTO>> getStatus() {
        return getCurrentUserContext()
                .flatMap(ctx -> {
                    log.info("📊 [CHANNEL-CONFIG] Getting status for tenantId: {}, companyId: {}", ctx.tenantId(), ctx.companyId());
                    return channelConfigService.getStatus(ctx.tenantId(), ctx.companyId());
                })
                .map(ResponseEntity::ok);
    }

    @PostMapping("/activate")
    public Mono<ResponseEntity<ChannelConfigDTO>> activateChannel() {
        return getCurrentUserContext()
                .flatMap(ctx -> {
                    log.info("🚀 [CHANNEL-CONFIG] Activating channel for tenantId: {}, companyId: {}", ctx.tenantId(), ctx.companyId());
                    return channelConfigService.activateChatbot(ctx.tenantId(), ctx.companyId());
                })
                .map(ResponseEntity::ok);
    }

    @GetMapping("/qr")
    public Mono<ResponseEntity<ChannelConfigDTO>> getQrCode() {
        return getCurrentUserContext()
                .flatMap(ctx -> {
                    log.info("🔲 [CHANNEL-CONFIG] Getting QR for tenantId: {}, companyId: {}", ctx.tenantId(), ctx.companyId());
                    return channelConfigService.getQrCode(ctx.tenantId(), ctx.companyId());
                })
                .map(ResponseEntity::ok);
    }

    @PostMapping("/config")
    public Mono<ResponseEntity<ChannelConfigDTO>> updateConfig(@RequestBody ChannelConfigDTO dto) {
        return getCurrentUserContext()
                .flatMap(ctx -> {
                    log.info("💾 [CHANNEL-CONFIG] Updating config for tenantId: {}, companyId: {}", ctx.tenantId(), ctx.companyId());
                    return channelConfigService.createOrUpdateConfig(ctx.tenantId(), ctx.companyId(), dto);
                })
                .map(ResponseEntity::ok);
    }
}
