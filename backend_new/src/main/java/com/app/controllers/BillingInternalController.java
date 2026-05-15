package com.app.controllers;

import com.app.persistence.entity.InvoiceEntity;
import com.app.persistence.entity.PaymentMethodEntity;
import com.app.persistence.entity.PaymentTransactionEntity;
import com.app.persistence.entity.SubscriptionEntity;
import com.app.persistence.services.BillingInternalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/internal/billing")
@RequiredArgsConstructor
public class BillingInternalController {

    private final BillingInternalService billingInternalService;

    @PostMapping("/payment-methods")
    public Mono<PaymentMethodEntity> savePaymentMethod(@RequestBody PaymentMethodEntity paymentMethod) {
        return billingInternalService.savePaymentMethod(paymentMethod);
    }

    @PostMapping("/subscriptions/{id}/activate-trial")
    public Mono<SubscriptionEntity> activateTrial(@PathVariable Long id) {
        return billingInternalService.activateTrial(id);
    }

    @GetMapping("/subscriptions/due")
    public Flux<SubscriptionEntity> getSubscriptionsDue() {
        return billingInternalService.getSubscriptionsDue();
    }

    @PostMapping("/invoices/generate")
    public Mono<InvoiceEntity> generateInvoice(@RequestBody InvoiceEntity invoice) {
        return billingInternalService.generateInvoice(invoice);
    }

    @PutMapping("/subscriptions/{id}/status")
    public Mono<SubscriptionEntity> updateSubscriptionStatus(@PathVariable Long id, @RequestParam String status) {
        return billingInternalService.updateSubscriptionStatus(id, status);
    }

    @PostMapping("/payment-transactions")
    public Mono<PaymentTransactionEntity> saveTransaction(@RequestBody PaymentTransactionEntity transaction) {
        return billingInternalService.saveTransaction(transaction);
    }

    @GetMapping("/invoices/{id}")
    public Mono<InvoiceEntity> getInvoice(@PathVariable Long id) {
        return billingInternalService.getInvoiceById(id);
    }
}
