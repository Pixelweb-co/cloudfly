package com.app.controllers;

import com.app.dto.OrderRequestDTO;
import com.app.dto.OrderResponseDTO;
import com.app.persistence.services.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    private record UserContext(Long tenantId, Long companyId, Set<String> roles) {
    }

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        log.info("🔍 [ORDER-AUTH] Incoming Headers Keys: {}", headers.keySet());
        // --- AI Internal Secret Bypass (Redundancy) ---
        String expected = "cloudfly_ai_secret_2026";
        boolean isAI = headers.values().stream().anyMatch(v -> v != null && v.contains(expected));
        
        if (isAI) {
            log.info("🤖 [ORDER-AUTH] AI Internal Bypass active for Order operations");
            return Mono.just(new UserContext(1L, null, java.util.Set.of("ROLE_ADMIN")));
        }

        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return new UserContext(1L, null, Set.of());
                    }

                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id") != null ? ((Number)details.get("customer_id")).longValue() : 1L;
                    Long tokenCompanyId = (Long) details.get("company_id") != null ? ((Number)details.get("company_id")).longValue() : null;
                    
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());

                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER");

                    // Resolver Tenant
                    Long finalTenantId = tokenTenantId;
                    if (isAdminOrManager && headers.containsKey("x-tenant-id")) {
                        try {
                            finalTenantId = Long.parseLong(headers.get("x-tenant-id"));
                        } catch (Exception e) {
                            log.warn("⚠️ [ORDER-AUTH] Invalid x-tenant-id header");
                        }
                    }

                    // Resolver Company
                    Long finalCompanyId = tokenCompanyId;
                    if (isAdminOrManager) {
                        if (headers.containsKey("x-company-id")) {
                            try {
                                finalCompanyId = Long.parseLong(headers.get("x-company-id"));
                            } catch (Exception e) {
                                log.warn("⚠️ [ORDER-AUTH] Invalid x-company-id header");
                            }
                        } else {
                            finalCompanyId = null;
                        }
                    }

                    return new UserContext(finalTenantId, finalCompanyId, roles);
                });
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<OrderResponseDTO> save(@RequestBody OrderRequestDTO order, @RequestHeader Map<String, String> headers) {
        log.info("🛒 [ORDER-CONTROLLER] INCOMING SAVE REQUEST. CustomerID: {}, Items: {}", order.getCustomerId(), 
                order.getItems() != null ? order.getItems().size() : 0);
        
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    log.info("🛒 [ORDER-CONTROLLER] Context Resolved: TenantID={}, Roles={}", ctx.tenantId(), ctx.roles());
                    order.setTenantId(ctx.tenantId());
                    order.setCompanyId(ctx.companyId());
                    
                    return orderService.createOrder(order)
                            .doOnNext(saved -> log.info("🛒 [ORDER-CONTROLLER] SUCCESS! Order created with ID: {}", saved.getId()))
                            .doOnError(err -> log.error("🛒 [ORDER-CONTROLLER] ERROR in orderService: {}", err.getMessage()));
                })
                .doOnError(err -> log.error("🛒 [ORDER-CONTROLLER] ERROR resolving context or calling service: {}", err.getMessage()));
    }

    @PutMapping("/{id}")
    public Mono<OrderResponseDTO> update(@PathVariable Long id, @RequestBody OrderRequestDTO order, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    order.setTenantId(ctx.tenantId());
                    order.setCompanyId(ctx.companyId());
                    return orderService.updateOrder(id, order);
                });
    }

    @GetMapping
    public Flux<OrderResponseDTO> findAll(@RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> orderService.listByTenant(ctx.tenantId(), ctx.companyId()));
    }

    @GetMapping("/{id}")
    public Mono<OrderResponseDTO> getById(@PathVariable Long id) {
        return orderService.getById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long id) {
        return orderService.deleteOrder(id);
    }
}
