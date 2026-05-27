package com.app.controllers;

import com.app.persistence.entity.GlobalAgent;
import com.app.persistence.entity.TenantAgentConfig;
import com.app.persistence.repository.GlobalAgentRepository;
import com.app.persistence.repository.TenantAgentConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
public class AIAgentController {

    private final GlobalAgentRepository globalAgentRepository;
    private final TenantAgentConfigRepository tenantAgentConfigRepository;

    private Mono<java.util.Map<String, Long>> getCurrentUserContext() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null) return java.util.Map.of("tenantId", 1L, "companyId", 1L);
                    java.util.Map<String, Object> details = (java.util.Map<String, Object>) auth.getDetails();
                    Long tid = 1L;
                    Long cid = 1L;
                    if (details != null) {
                        if (details.get("customer_id") != null) tid = ((Number) details.get("customer_id")).longValue();
                        if (details.get("company_id") != null) cid = ((Number) details.get("company_id")).longValue();
                    }
                    return java.util.Map.of("tenantId", tid, "companyId", cid);
                })
                .defaultIfEmpty(java.util.Map.of("tenantId", 1L, "companyId", 1L));
    }

    @GetMapping("/my-agents")
    public Flux<TenantAgentConfig> getMyAgents() {
        return getCurrentUserContext()
                .flatMapMany(ctx -> {
                    Long tenantId = ctx.get("tenantId");
                    log.info("📋 [AGENT-CONTROLLER] Fetching personalized agents for tenant: {}", tenantId);
                    return tenantAgentConfigRepository.findByTenantId(tenantId);
                });
    }

    /**
     * Get all global agent templates.
     */
    @GetMapping("/templates")
    public Flux<GlobalAgent> getGlobalTemplates() {
        log.info("📋 [AGENT-CONTROLLER] Fetching all global templates...");
        return globalAgentRepository.findByIsActiveTrue();
    }

    /**
     * Personalize a global template for the current tenant.
     */
    @PostMapping("/personalize")
    public Mono<ResponseEntity<TenantAgentConfig>> personalizeAgent(@RequestBody TenantAgentConfig config) {
        return getCurrentUserContext()
                .flatMap(ctx -> {
                    Long tenantId = ctx.get("tenantId");
                    log.info("💾 [AGENT-CONTROLLER] Personalizing agent for tenant: {}", tenantId);
                    config.setTenantId(tenantId);
                    config.setCreatedAt(LocalDateTime.now());
                    config.setUpdatedAt(LocalDateTime.now());
                    config.setIsActive(true);
                    return tenantAgentConfigRepository.save(config);
                })
                .map(ResponseEntity::ok);
    }

    /**
     * Update an existing personalization.
     */
    @PutMapping("/personalize/{id}")
    public Mono<ResponseEntity<TenantAgentConfig>> updatePersonalization(@PathVariable Long id, @RequestBody TenantAgentConfig config) {
        return tenantAgentConfigRepository.findById(id)
                .flatMap(existing -> {
                    existing.setDisplayName(config.getDisplayName());
                    existing.setCompanySpecificContext(config.getCompanySpecificContext());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return tenantAgentConfigRepository.save(existing);
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * MANAGER only: Create or Update a Global Template.
     */
    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPERADMIN')")
    public Mono<ResponseEntity<GlobalAgent>> createGlobalTemplate(@RequestBody GlobalAgent template) {
        log.info("⚙️ [AGENT-CONTROLLER] MANAGER creating/updating global template: {}. Payload: {}", 
                 template.getName(), template);
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());
        template.setIsActive(true);
        return globalAgentRepository.save(template)
                .map(ResponseEntity::ok);
    }
}
