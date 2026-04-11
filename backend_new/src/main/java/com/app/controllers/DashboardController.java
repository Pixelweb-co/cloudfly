package com.app.controllers;

import com.app.dto.DashboardStatsDTO;
import com.app.dto.PipelineStatsDTO;
import com.app.persistence.services.DashboardService;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private Mono<Long> getCurrentTenantId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> {
                    if (auth == null || auth.getName() == null) {
                        return Mono.empty();
                    }
                    return userService.findByUsername(auth.getName());
                })
                .flatMap(user -> Mono.justOrEmpty(user.getCustomerId()));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<DashboardStatsDTO> getStats(@RequestParam(required = false) Long companyId) {
        return getCurrentTenantId()
                .flatMap(tenantId -> dashboardService.getStats(tenantId, companyId));
    }

    @GetMapping("/pipeline-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<PipelineStatsDTO> getPipelineStats(@RequestParam(required = false) Long companyId) {
        return getCurrentTenantId()
                .flatMap(tenantId -> dashboardService.getPipelineStats(tenantId, companyId));
    }
}
