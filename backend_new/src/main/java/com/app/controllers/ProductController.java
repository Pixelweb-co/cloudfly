package com.app.controllers;

import com.app.dto.ProductCreateRequest;
import com.app.persistence.services.ProductService;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/productos")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    private record UserContext(Long tenantId, Long companyId, Set<String> roles) {}

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return new UserContext(1L, null, Set.of());
                    }

                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id");
                    Long tokenCompanyId = (Long) details.get("company_id");
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());

                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER");

                    Long finalTenantId = tokenTenantId;
                    if (isAdminOrManager && (headers.containsKey("x-tenant-id") || headers.containsKey("X-Tenant-Id"))) {
                        try {
                            String headerVal = headers.getOrDefault("x-tenant-id", headers.get("X-Tenant-Id"));
                            finalTenantId = Long.parseLong(headerVal);
                        } catch (Exception e) {
                            log.warn("⚠️ [PRODUCT-AUTH] Invalid x-tenant-id header");
                        }
                    }

                    return new UserContext(finalTenantId, tokenCompanyId, roles);
                });
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ProductCreateRequest> save(@RequestBody ProductCreateRequest product) {
        return productService.saveProduct(product);
    }

    @GetMapping
    public Flux<ProductCreateRequest> findAll(@RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> productService.listByTenant(ctx.tenantId()));
    }

    @GetMapping("/{id}")
    public Mono<ProductCreateRequest> getById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @GetMapping("/tenant/{tenantId}")
    public Flux<ProductCreateRequest> listByTenant(@PathVariable Long tenantId) {
        return productService.listByTenant(tenantId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long id) {
        return productService.delete(id);
    }

    @GetMapping("/barcode/{barcode}")
    public Mono<ProductCreateRequest> getByBarcode(@PathVariable String barcode, @RequestParam Long tenantId) {
        return productService.getByBarcode(barcode, tenantId);
    }

    @GetMapping("/search")
    public Flux<ProductCreateRequest> searchByName(@RequestParam String query, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> productService.searchByName(query, ctx.tenantId()));
    }

    @GetMapping("/stock/multiple")
    public Flux<ProductCreateRequest> validateStockMultiple(@RequestParam List<Long> ids, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> productService.validateStockMultiple(ids, ctx.tenantId()));
    }
}
