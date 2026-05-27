package com.app.starter1.controllers;

import com.app.starter1.dto.marketing.PipelineCreateRequest;
import com.app.starter1.dto.marketing.PipelineDTO;
import com.app.starter1.services.PipelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.app.starter1.dto.marketing.PipelineKanbanCardDTO;

@RestController
@RequestMapping("/api/pipelines")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineService pipelineService;

    // TODO: Replace with proper tenant extraction logic from your security context
    private Long getTenantId(Authentication authentication) {
        // Mock method to assume tenant ID 1 for now if no auth logic exists
        // Usually something like ((UserDetailsImpl) authentication.getPrincipal()).getTenantId();
        return 1L; 
    }

    private Long getUserId(Authentication authentication) {
        return 1L;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MARKETING_READ')")
    public ResponseEntity<List<PipelineDTO>> getAllPipelines(Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return ResponseEntity.ok(pipelineService.getAllPipelines(tenantId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MARKETING_READ')")
    public ResponseEntity<PipelineDTO> getPipelineById(@PathVariable Long id, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return ResponseEntity.ok(pipelineService.getPipelineById(tenantId, id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MARKETING_CREATE')")
    public ResponseEntity<PipelineDTO> createPipeline(@RequestBody PipelineCreateRequest request, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(pipelineService.createPipeline(tenantId, userId, request));
    }

    @GetMapping("/{id}/kanban")
    @PreAuthorize("hasAuthority('MARKETING_READ')")
    public ResponseEntity<Map<String, List<PipelineKanbanCardDTO>>> getKanbanData(@PathVariable Long id, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        return ResponseEntity.ok(pipelineService.getKanbanData(tenantId, id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MARKETING_DELETE')")
    public ResponseEntity<Void> deletePipeline(@PathVariable Long id, Authentication authentication) {
        Long tenantId = getTenantId(authentication);
        pipelineService.deletePipeline(tenantId, id);
        return ResponseEntity.noContent().build();
    }
}
