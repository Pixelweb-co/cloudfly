package com.app.controllers;

import com.app.dto.PipelineCreateRequest;
import com.app.dto.PipelineDto;
import com.app.persistence.services.PipelineService;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/pipelines")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PipelineController {

    private final PipelineService pipelineService;
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

    private Mono<com.app.persistence.entity.UserEntity> getCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> {
                    if (auth == null || auth.getName() == null) {
                        return Mono.empty();
                    }
                    return userService.findByUsername(auth.getName());
                });
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<PipelineDto> getAllPipelines(
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) Long companyId) {
        
        return getCurrentUser()
                .flatMapMany(user -> {
                    boolean isManager = user.getRoles().stream()
                            .anyMatch(r -> r.getName().contains("MANAGER"));
                    
                    // If MANAGER and tenantId is provided, use it. Otherwise use user's customerId.
                    Long targetTenantId = (isManager && tenantId != null) ? tenantId : user.getCustomerId();
                    
                    log.info("🚀 Fetching pipelines for Tenant: {} (Requested: {}), Company: {}", 
                            targetTenantId, tenantId, companyId);
                            
                    return pipelineService.getAllPipelines(targetTenantId, companyId);
                });
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<PipelineDto> getPipelineById(@PathVariable Long id) {
        return getCurrentTenantId()
                .flatMap(tenantId -> pipelineService.getPipelineById(tenantId, id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<PipelineDto> createPipeline(@RequestBody PipelineCreateRequest request) {
        log.info("✨ REST Request to create Pipeline: {}", request.getName());
        return getCurrentUser()
                .flatMap(user -> {
                    if (user.getCustomerId() == null) {
                        log.error("❌ Cannot create pipeline: Current user {} has no customerId", user.getUsername());
                        return Mono.error(new RuntimeException("User has no associated customer"));
                    }
                    Long companyId = request.getCompanyId();
                    return pipelineService.createPipeline(user.getCustomerId(), companyId, user.getId(), request);
                });
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<PipelineDto> updatePipeline(@PathVariable Long id, @RequestBody PipelineCreateRequest request) {
        return getCurrentTenantId()
                .flatMap(tenantId -> pipelineService.updatePipeline(tenantId, id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> deletePipeline(@PathVariable Long id) {
        return getCurrentTenantId()
                .flatMap(tenantId -> pipelineService.deletePipeline(tenantId, id));
    }
}
