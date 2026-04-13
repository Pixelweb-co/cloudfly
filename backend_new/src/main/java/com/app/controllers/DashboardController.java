package com.app.controllers;

import com.app.dto.DashboardStatsDTO;
import com.app.dto.PipelineStatsDTO;
import com.app.persistence.services.DashboardService;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    private Mono<Long> getEffectiveTenantId(ServerHttpRequest request) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> {
                    if (auth == null || auth.getName() == null) {
                        return Mono.empty();
                    }
                    
                    boolean isManager = auth.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().contains("MANAGER") || a.getAuthority().contains("SUPERADMIN"));
                    
                    String headerTenantId = request.getHeaders().getFirst("X-Tenant-Id");
                    
                    return userService.findByUsername(auth.getName())
                            .flatMap(user -> {
                                if (isManager && headerTenantId != null) {
                                    try {
                                        return Mono.just(Long.parseLong(headerTenantId));
                                    } catch (NumberFormatException e) {
                                        log.warn("Invalid X-Tenant-Id header: {}", headerTenantId);
                                    }
                                }
                                return Mono.justOrEmpty(user.getCustomerId());
                            });
                });
    }

    private Long getEffectiveCompanyId(ServerHttpRequest request, Long paramCompanyId) {
        if (paramCompanyId != null) return paramCompanyId;
        String headerCompanyId = request.getHeaders().getFirst("X-Company-Id");
        if (headerCompanyId != null) {
            try {
                return Long.parseLong(headerCompanyId);
            } catch (NumberFormatException e) {
                log.warn("Invalid X-Company-Id header: {}", headerCompanyId);
            }
        }
        return null;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<DashboardStatsDTO> getStats(
            ServerHttpRequest request,
            @RequestParam(required = false) Long companyId) {
        
        Long effectiveCompanyId = getEffectiveCompanyId(request, companyId);
        
        return getEffectiveTenantId(request)
                .flatMap(tenantId -> {
                    log.info("📊 [DASHBOARD] Fetching Stats - Tenant: {}, Company: {}", tenantId, effectiveCompanyId);
                    return dashboardService.getStats(tenantId, effectiveCompanyId);
                });
    }

    @GetMapping("/pipeline-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<PipelineStatsDTO> getPipelineStats(
            ServerHttpRequest request,
            @RequestParam(required = false) Long companyId) {
        
        Long effectiveCompanyId = getEffectiveCompanyId(request, companyId);
        
        return getEffectiveTenantId(request)
                .flatMap(tenantId -> {
                    log.info("📊 [DASHBOARD] Fetching Pipeline Stats - Tenant: {}, Company: {}", tenantId, effectiveCompanyId);
                    return dashboardService.getPipelineStats(tenantId, effectiveCompanyId);
                });
    }
}

