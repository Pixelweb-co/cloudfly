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

    @GetMapping("/subscriptions/{id}")
    public Mono<SubscriptionEntity> getSubscription(@PathVariable Long id) {
        return billingInternalService.getSubscriptionById(id);
    }

    @GetMapping("/payment-methods/default")
    public Mono<PaymentMethodEntity> getDefaultPaymentMethod(@RequestParam Long tenantId) {
        return billingInternalService.getDefaultPaymentMethod(tenantId);
    }

    @GetMapping("/invoices")
    public Flux<InvoiceEntity> getInvoices(@RequestParam Long tenantId, @RequestParam(required = false) String status) {
        return billingInternalService.getInvoices(tenantId, status);
    }

    @PostMapping("/invoices/generate-subscription")
    public Mono<InvoiceEntity> generateInvoice(@RequestBody InvoiceEntity invoice) {
        return billingInternalService.generateInvoice(invoice);
    }

    @PutMapping("/invoices/{id}/pdf")
    public Mono<InvoiceEntity> updateInvoicePdf(@PathVariable Long id, @RequestParam String pdfUrl) {
        return billingInternalService.updateInvoicePdf(id, pdfUrl);
    }

    @PutMapping("/subscriptions/{id}/status")
    public Mono<SubscriptionEntity> updateSubscriptionStatus(@PathVariable Long id, @RequestParam String status) {
        return billingInternalService.updateSubscriptionStatus(id, status);
    }

    @PutMapping("/invoices/by-reference/{invoiceNumber}")
    public Mono<InvoiceEntity> updateInvoiceStatusByReference(@PathVariable String invoiceNumber, @RequestParam String status) {
        log.info("Request to update invoice status by reference {} to {}", invoiceNumber, status);
        return billingInternalService.updateInvoiceStatusByReference(invoiceNumber, status);
    }


    @PostMapping("/payment-transactions")
    public Mono<PaymentTransactionEntity> saveTransaction(@RequestBody PaymentTransactionEntity transaction) {
        return billingInternalService.saveTransaction(transaction);
    }

    @GetMapping("/invoices/{id}")
    public Mono<InvoiceEntity> getInvoice(@PathVariable Long id) {
        return billingInternalService.getInvoiceById(id);
    }

    @GetMapping("/tenants/{id}")
    public Mono<com.app.persistence.entity.TenantEntity> getTenant(@PathVariable Long id) {
        return billingInternalService.getTenantById(id);
    }
}
