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
        
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMapMany(auth -> {
                    boolean isManager = auth.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().contains("MANAGER"));
                    
                    return userService.findByUsername(auth.getName())
                            .flatMapMany(user -> {
                                // If MANAGER and tenantId is provided, use it. Otherwise use user's customerId.
                                Long targetTenantId = (isManager && tenantId != null) ? tenantId : user.getCustomerId();
                                
                                log.info("🚀 Fetching pipelines for Tenant: {} (Manager: {}), Company: {}", 
                                        targetTenantId, isManager, companyId);
                                        
                                return pipelineService.getAllPipelines(targetTenantId, companyId);
                            });
                });
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<PipelineDto> getPipelineById(@PathVariable Long id, @RequestParam(required = false) Long companyId) {
        return getCurrentUser()
                .flatMap(user -> {
                    Long effectiveCompanyId = (companyId != null) ? companyId : user.getCompanyId();
                    return pipelineService.getPipelineById(user.getCustomerId(), effectiveCompanyId, id);
                });
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<PipelineDto> createPipeline(@RequestBody PipelineCreateRequest request) {
        log.info("✨ REST Request to create Pipeline: {}", request.getName());
        
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> userService.findByUsername(auth.getName())
                        .flatMap(user -> {
                            boolean isManager = auth.getAuthorities().stream()
                                    .anyMatch(a -> a.getAuthority().contains("MANAGER"));
                            
                            Long targetTenantId = (isManager && request.getTenantId() != null) 
                                    ? request.getTenantId() 
                                    : user.getCustomerId();
                                    
                            if (targetTenantId == null) {
                                log.error("❌ Cannot create pipeline: No target tenant resolved for user {}", user.getUsername());
                                return Mono.error(new RuntimeException("No associated customer resolved for creation"));
                            }
                            
                            Long companyId = request.getCompanyId();
                            log.info("🎯 Creating pipeline mapped to Tenant: {}, Company: {}", targetTenantId, companyId);
                            
                            return pipelineService.createPipeline(targetTenantId, companyId, user.getId(), request);
                        })
                );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<PipelineDto> updatePipeline(@PathVariable Long id, @RequestBody PipelineCreateRequest request, @RequestParam(required = false) Long companyId) {
        return getCurrentUser()
                .flatMap(user -> {
                    Long effectiveCompanyId = (companyId != null) ? companyId : user.getCompanyId();
                    return pipelineService.updatePipeline(user.getCustomerId(), effectiveCompanyId, id, request);
                });
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> deletePipeline(@PathVariable Long id, @RequestParam(required = false) Long companyId) {
        return getCurrentUser()
                .flatMap(user -> {
                    Long effectiveCompanyId = (companyId != null) ? companyId : user.getCompanyId();
                    return pipelineService.deletePipeline(user.getCustomerId(), effectiveCompanyId, id);
                });
    }

    @GetMapping("/{id}/kanban")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<java.util.Map<String, java.util.List<com.app.dto.PipelineKanbanCardDTO>>> getKanbanData(@PathVariable Long id, @RequestParam(required = false) Long companyId) {
        return getCurrentUser()
                .flatMap(user -> {
                    Long effectiveCompanyId = (companyId != null) ? companyId : user.getCompanyId();
                    return pipelineService.getKanbanData(user.getCustomerId(), effectiveCompanyId, id);
                });
    }

    @PutMapping("/{id}/kanban/cards/{contactId}/stage")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<Void> updateCardStage(
            @PathVariable Long id,
            @PathVariable Long contactId,
            @RequestParam Long targetStageId,
            @RequestParam(required = false) Long companyId) {
        return getCurrentUser()
                .flatMap(user -> {
                    Long effectiveCompanyId = (companyId != null) ? companyId : user.getCompanyId();
                    return pipelineService.updateCardStage(user.getCustomerId(), effectiveCompanyId, id, contactId, targetStageId);
                });
    }
}
