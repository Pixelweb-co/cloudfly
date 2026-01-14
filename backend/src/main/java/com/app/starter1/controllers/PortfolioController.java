package com.app.starter1.controllers;

import com.app.starter1.dto.PortfolioDocumentDTO;
import com.app.starter1.dto.PortfolioPaymentRequestDTO;
import com.app.starter1.persistence.entity.PortfolioPayment;
import com.app.starter1.services.PortfolioService;
// Asumimos que hay un mecanismo de obtener el TenantId del contexto de seguridad o token
// Por ahora, lo pasaremos como Header o RequestParam si no hay un UserContextHolder claro.
// Pero mirando otros controllers (e.g. InvoiceController), suelen usar TenantId en DTO o inferirlo.
// Usaremos RequestParam para tenantId por simplicidad y consistencia si así se usa.
// Si hay auth, lo ideal es sacarlo del token.

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping("/receivables")
    public ResponseEntity<List<PortfolioDocumentDTO>> getReceivables(
            @RequestParam Long tenantId,
            @RequestParam(required = false) Long contactId) {
        return ResponseEntity.ok(portfolioService.getOpenReceivables(tenantId, contactId));
    }

    @PostMapping("/payments")
    public ResponseEntity<PortfolioPayment> createPayment(@RequestBody PortfolioPaymentRequestDTO request) {
        return ResponseEntity.ok(portfolioService.registerPayment(request));
    }

    @GetMapping("/summary/receivables")
    public ResponseEntity<BigDecimal> getTotalReceivables(@RequestParam Long tenantId) {
        return ResponseEntity.ok(portfolioService.getTotalReceivables(tenantId));
    }
}
