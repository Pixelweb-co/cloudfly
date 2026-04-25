package com.app.controllers;

import com.app.dto.QuoteRequestDTO;
import com.app.dto.QuoteResponseDTO;
import com.app.persistence.entity.OrderEntity;
import com.app.persistence.services.QuoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
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
@RequestMapping("/quotes")
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;

    private record UserContext(Long tenantId, Long companyId, Set<String> roles) {
    }

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        // --- AI Internal Secret Bypass (Redundancy) ---
        String aiSecret = headers.get("x-ai-secret");
        String authHeader = headers.get("authorization");
        String expected = "cloudfly_ai_secret_2026";
        if (expected.equals(aiSecret) || (authHeader != null && authHeader.contains("AI-Secret " + expected))) {
            log.info("🤖 [QUOTE-AUTH] AI Internal Bypass active for Quote operations");
            return Mono.just(new UserContext(1L, null, Set.of("ROLE_ADMIN")));
        }

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

                    // Resolver Tenant
                    Long finalTenantId = tokenTenantId;
                    if (isAdminOrManager && headers.containsKey("x-tenant-id")) {
                        try {
                            finalTenantId = Long.parseLong(headers.get("x-tenant-id"));
                            log.info("🎯 [QUOTE-AUTH] Overriding Tenant from Header: {}", finalTenantId);
                        } catch (Exception e) {
                            log.warn("⚠️ [QUOTE-AUTH] Invalid x-tenant-id header");
                        }
                    }

                    // Resolver Company
                    Long finalCompanyId = tokenCompanyId;
                    if (isAdminOrManager) {
                        if (headers.containsKey("x-company-id")) {
                            try {
                                finalCompanyId = Long.parseLong(headers.get("x-company-id"));
                                log.info("🎯 [QUOTE-AUTH] Overriding Company from Header: {}", finalCompanyId);
                            } catch (Exception e) {
                                log.warn("⚠️ [QUOTE-AUTH] Invalid x-company-id header");
                            }
                        } else {
                            // Si es Manager/Admin y NO envía cabecera de compañía, ve TODO (nulo)
                            finalCompanyId = null;
                        }
                    }

                    return new UserContext(finalTenantId, finalCompanyId, roles);
                });
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<QuoteResponseDTO> save(@RequestBody QuoteRequestDTO quote, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    quote.setTenantId(ctx.tenantId());
                    quote.setCompanyId(ctx.companyId());
                    return quoteService.createQuote(quote);
                });
    }

    @PutMapping("/{id}")
    public Mono<QuoteResponseDTO> update(@PathVariable Long id, @RequestBody QuoteRequestDTO quote, @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    quote.setTenantId(ctx.tenantId());
                    quote.setCompanyId(ctx.companyId());
                    return quoteService.updateQuote(id, quote);
                });
    }

    @GetMapping
    public Flux<QuoteResponseDTO> findAll(@RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> quoteService.listByTenant(ctx.tenantId(), ctx.companyId()));
    }

    @GetMapping("/{id}")
    public Mono<QuoteResponseDTO> getById(@PathVariable Long id) {
        return quoteService.getById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long id) {
        return quoteService.deleteQuote(id);
    }

    @PostMapping("/{id}/convert-to-order")
    public Mono<OrderEntity> convertToOrder(@PathVariable Long id) {
        return quoteService.convertToOrder(id);
    }
}
