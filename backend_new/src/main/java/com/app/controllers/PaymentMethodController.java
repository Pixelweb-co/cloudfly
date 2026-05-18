package com.app.controllers;

import com.app.persistence.entity.PaymentMethodEntity;
import com.app.persistence.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/v1/payment-methods")
@RequiredArgsConstructor
@Slf4j
public class PaymentMethodController {

    private final PaymentMethodRepository paymentMethodRepository;

    @GetMapping("/tenant/{tenantId}")
    public Flux<PaymentMethodEntity> getTenantPaymentMethods(@PathVariable Long tenantId) {
        log.info("GET /api/v1/payment-methods/tenant/{} - Fetching payment methods", tenantId);
        return paymentMethodRepository.findAllByTenantId(tenantId);
    }
}
