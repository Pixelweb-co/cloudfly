package com.app.controllers;

import com.app.dto.WorkflowPaginatedResponse;
import com.app.dto.WorkflowRequest;
import com.app.persistence.entity.WorkflowEntity;
import com.app.persistence.entity.WorkflowExecutionLogEntity;
import com.app.persistence.repository.CompanyRepository;
import com.app.persistence.services.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/workflows")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkflowController {

    private final WorkflowService workflowService;
    private final CompanyRepository companyRepository;

    private record UserContext(Long tenantId, Long companyId, Set<String> roles) {}

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return Mono.just(new UserContext(1L, null, Set.of()));
                    }

                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id");
                    Long tokenCompanyId = (Long) details.get("company_id");
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());

                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER") || roles.contains("ROLE_SUPERADMIN");

                    Long tenantId = tokenTenantId;
                    if (isAdminOrManager && (headers.containsKey("x-tenant-id") || headers.containsKey("X-Tenant-Id"))) {
                        try {
                            String headerVal = headers.getOrDefault("x-tenant-id", headers.get("X-Tenant-Id"));
                            tenantId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [WORKFLOW-AUTH] Invalid x-tenant-id header");
                        }
                    }

                    Long companyId = tokenCompanyId;
                    if (isAdminOrManager && (headers.containsKey("x-company-id") || headers.containsKey("X-Company-Id"))) {
                        try {
                            String headerVal = headers.getOrDefault("x-company-id", headers.get("X-Company-Id"));
                            companyId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [WORKFLOW-AUTH] Invalid x-company-id header");
                        }
                    }

                    if (companyId != null) {
                        return Mono.just(new UserContext(tenantId, companyId, roles));
                    } else {
                        Long finalTenantId = tenantId;
                        return companyRepository.findFirstByTenantIdAndIsPrincipalTrue(tenantId)
                                .map(primary -> new UserContext(finalTenantId, primary.getId(), roles))
                                .switchIfEmpty(companyRepository.findByTenantId(tenantId).next()
                                        .map(company -> new UserContext(finalTenantId, company.getId(), roles))
                                )
                                .defaultIfEmpty(new UserContext(finalTenantId, null, roles));
                    }
                });
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<WorkflowPaginatedResponse> getWorkflows(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String triggerEvent,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.just(WorkflowPaginatedResponse.builder()
                                .items(java.util.Collections.emptyList())
                                .totalItems(0L)
                                .page(page)
                                .size(size)
                                .build());
                    }
                    return workflowService.getWorkflows(ctx.tenantId(), ctx.companyId(), name, triggerEvent, isActive, page, size);
                });
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Mono<WorkflowEntity> getWorkflowById(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía."));
                    }
                    return workflowService.getWorkflowById(id, ctx.tenantId(), ctx.companyId());
                });
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<WorkflowEntity> createWorkflow(@RequestBody WorkflowRequest request, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía para crear el workflow."));
                    }
                    return workflowService.createWorkflow(request, ctx.tenantId(), ctx.companyId());
                });
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<WorkflowEntity> updateWorkflow(
            @PathVariable Long id, 
            @RequestBody WorkflowRequest request, 
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía."));
                    }
                    return workflowService.updateWorkflow(id, request, ctx.tenantId(), ctx.companyId());
                });
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<Void> deleteWorkflow(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía."));
                    }
                    return workflowService.deleteWorkflow(id, ctx.tenantId(), ctx.companyId());
                });
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<WorkflowEntity> toggleWorkflowStatus(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (ctx.companyId() == null) {
                        return Mono.error(new RuntimeException("No se ha definido la compañía."));
                    }
                    return workflowService.toggleWorkflowStatus(id, ctx.tenantId(), ctx.companyId());
                });
    }

    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<WorkflowExecutionLogEntity> getExecutionLogs(@PathVariable Long id, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> {
                    if (ctx.companyId() == null) {
                        return Flux.empty();
                    }
                    return workflowService.getExecutionLogs(id, ctx.tenantId(), ctx.companyId());
                });
    }
}
