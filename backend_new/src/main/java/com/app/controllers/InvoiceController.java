package com.app.controllers;

import com.app.dto.InvoiceResponseDTO;
import com.app.dto.TenantPaymentGatewayDTO;
import com.app.persistence.services.InvoiceService;
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
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    private record UserContext(Long tenantId, Long companyId, Set<String> roles) {}

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return new UserContext(1L, null, Set.of());
                    }

                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = details.get("customer_id") != null ? ((Number) details.get("customer_id")).longValue() : 1L;
                    Long tokenCompanyId = details.get("company_id") != null ? ((Number) details.get("company_id")).longValue() : null;
                    
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());

                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER");

                    Long finalTenantId = tokenTenantId;
                    if (isAdminOrManager && headers.containsKey("x-tenant-id")) {
                        try {
                            finalTenantId = Long.parseLong(headers.get("x-tenant-id"));
                        } catch (Exception e) {
                            log.warn("⚠️ [INVOICE-AUTH] Invalid x-tenant-id header");
                        }
                    }

                    Long finalCompanyId = tokenCompanyId;
                    if (isAdminOrManager) {
                        if (headers.containsKey("x-company-id")) {
                            try {
                                finalCompanyId = Long.parseLong(headers.get("x-company-id"));
                            } catch (Exception e) {
                                log.warn("⚠️ [INVOICE-AUTH] Invalid x-company-id header");
                            }
                        } else {
                            finalCompanyId = null;
                        }
                    }

                    return new UserContext(finalTenantId, finalCompanyId, roles);
                });
    }

    // --- TENANT FACING ENDPOINTS (AUTHENTICATED) ---

    @PostMapping("/invoices/from-order/{orderId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<InvoiceResponseDTO> createInvoiceFromOrder(
            @PathVariable Long orderId,
            @RequestParam(required = false) String billingType,
            @RequestParam(required = false) String billingPeriod,
            @RequestHeader Map<String, String> headers) {
        log.info("Request to create invoice from Order ID: {}, type: {}, period: {}", orderId, billingType, billingPeriod);
        return invoiceService.createInvoiceFromOrder(orderId, billingType, billingPeriod);
    }

    @GetMapping("/invoices")
    public Flux<InvoiceResponseDTO> findAll(@RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMapMany(ctx -> invoiceService.listByTenant(ctx.tenantId(), ctx.companyId()));
    }

    @GetMapping("/invoices/{id}")
    public Mono<InvoiceResponseDTO> getById(@PathVariable Long id) {
        return invoiceService.getById(id);
    }

    @PostMapping("/invoices/gateways")
    public Mono<TenantPaymentGatewayDTO> saveGatewayConfig(
            @RequestBody TenantPaymentGatewayDTO dto,
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    dto.setTenantId(ctx.tenantId());
                    if (dto.getCompanyId() == null) dto.setCompanyId(ctx.companyId());
                    return invoiceService.saveGatewayConfig(dto);
                });
    }

    @GetMapping("/invoices/gateways")
    public Mono<TenantPaymentGatewayDTO> getGatewayConfig(
            @RequestParam(required = false) String provider,
            @RequestHeader Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> invoiceService.getGatewayConfig(
                        ctx.tenantId(), 
                        ctx.companyId(), 
                        provider != null ? provider : "WOMPI"
                ));
    }

    // --- PUBLIC ENDPOINTS (UNAUTHENTICATED) ---

    @GetMapping("/public/invoices/{token}")
    public Mono<InvoiceResponseDTO> getPublicInvoice(@PathVariable String token) {
        log.info("Public lookup for invoice token: {}", token);
        return invoiceService.getByPublicToken(token);
    }

    @GetMapping("/public/invoices/{token}/gateway")
    public Mono<TenantPaymentGatewayDTO> getPublicGatewayConfig(@PathVariable String token) {
        log.info("Public lookup for gateway linked to invoice token: {}", token);
        return invoiceService.getByPublicToken(token)
                .flatMap(invoice -> invoiceService.getGatewayConfig(
                        invoice.getTenantId(), 
                        invoice.getCompanyId(), 
                        "WOMPI"
                ));
    }
}
