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
                .flatMap(auth -> userService.findByUsername(auth.getName()))
                .map(user -> user.getCustomerId());
    }

    private Mono<com.app.persistence.entity.UserEntity> getCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> userService.findByUsername(auth.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<PipelineDto> getAllPipelines() {
        return getCurrentTenantId()
                .flatMapMany(pipelineService::getAllPipelines);
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
        return getCurrentUser()
                .flatMap(user -> pipelineService.createPipeline(user.getCustomerId(), user.getId(), request));
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
