package com.app.controllers;

import com.app.dto.PipelineCreateRequest;
import com.app.dto.PipelineDto;
import com.app.persistence.services.PipelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/pipelines")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PipelineController {

    private final PipelineService pipelineService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<PipelineDto> getAllPipelines(Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return pipelineService.getAllPipelines(tenantId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<PipelineDto> getPipelineById(@PathVariable Long id, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return pipelineService.getPipelineById(tenantId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<PipelineDto> createPipeline(@RequestBody PipelineCreateRequest request, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        Long userId = 1L; // Mock for now, similar to legacy
        return pipelineService.createPipeline(tenantId, userId, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<PipelineDto> updatePipeline(@PathVariable Long id, @RequestBody PipelineCreateRequest request, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return pipelineService.updatePipeline(tenantId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> deletePipeline(@PathVariable Long id, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return pipelineService.deletePipeline(tenantId, id);
    }

    private Long getTenantId(Authentication authentication) {
        if (authentication == null) return 1L;
        Object details = authentication.getDetails();
        if (details instanceof Map) {
            Map<String, Object> detailsMap = (Map<String, Object>) details;
            if (detailsMap.containsKey("customer_id")) {
                Object customerId = detailsMap.get("customer_id");
                if (customerId instanceof Number) {
                    return ((Number) customerId).longValue();
                }
            }
        }
        return 1L;
    }
}
