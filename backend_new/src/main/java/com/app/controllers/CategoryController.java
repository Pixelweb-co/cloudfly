package com.app.controllers;

import com.app.dto.CategoryCreateRequest;
import com.app.dto.CategoryResponse;
import com.app.persistence.services.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping({ "/categorias", "/categories" })
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    private record UserContext(Long tenantId, Long companyId) {}

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return org.springframework.security.core.context.ReactiveSecurityContextHolder.getContext()
                .map(org.springframework.security.core.context.SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return new UserContext(1L, null);
                    }

                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id");
                    Long tokenCompanyId = (Long) details.get("company_id");

                    Long finalTenantId = tokenTenantId;
                    if (headers.containsKey("x-tenant-id") || headers.containsKey("X-Tenant-Id")) {
                        try {
                            String headerVal = headers.getOrDefault("x-tenant-id", headers.get("X-Tenant-Id"));
                            finalTenantId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [CATEGORY-AUTH] Invalid x-tenant-id header");
                        }
                    }

                    Long finalCompanyId = tokenCompanyId;
                    if (headers.containsKey("x-company-id") || headers.containsKey("X-Company-Id")) {
                        try {
                            String headerVal = headers.getOrDefault("x-company-id", headers.get("X-Company-Id"));
                            finalCompanyId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [CATEGORY-AUTH] Invalid x-company-id header");
                        }
                    }

                    return new UserContext(finalTenantId, finalCompanyId);
                });
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<CategoryResponse> createCategory(@Valid @RequestBody CategoryCreateRequest request, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (request.getTenantId() == null) request.setTenantId(ctx.tenantId());
                    if (request.getCompanyId() == null) request.setCompanyId(ctx.companyId());
                    log.info("Creating new category: {} for tenant {} and company {}", request.getNombreCategoria(), request.getTenantId(), request.getCompanyId());
                    return categoryService.createCategory(request);
                });
    }

    @GetMapping("/{id}")
    public Mono<CategoryResponse> getCategoryById(@PathVariable Long id) {
        return categoryService.getCategoryById(id);
    }

    @GetMapping("/customer/{tenantId}")
    public Flux<CategoryResponse> getAllTenantCategories(@PathVariable Long tenantId) {
        return categoryService.getAllTenantCategories(tenantId);
    }

    @PutMapping("/{id}")
    public Mono<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryCreateRequest request,
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    if (request.getTenantId() == null) request.setTenantId(ctx.tenantId());
                    if (request.getCompanyId() == null) request.setCompanyId(ctx.companyId());
                    return categoryService.updateCategory(id, request);
                });
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteCategory(@PathVariable Long id) {
        return categoryService.deleteCategory(id);
    }

    @PatchMapping("/{id}/toggle-status")
    public Mono<CategoryResponse> toggleCategoryStatus(@PathVariable Long id) {
        return categoryService.toggleCategoryStatus(id);
    }
}
