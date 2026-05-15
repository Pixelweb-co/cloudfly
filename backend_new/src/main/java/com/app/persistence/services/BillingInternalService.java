package com.app.persistence.services;

import com.app.persistence.entity.InvoiceEntity;
import com.app.persistence.entity.PaymentMethodEntity;
import com.app.persistence.entity.PaymentTransactionEntity;
import com.app.persistence.entity.SubscriptionEntity;
import com.app.persistence.repository.InvoiceRepository;
import com.app.persistence.repository.PaymentMethodRepository;
import com.app.persistence.repository.PaymentTransactionRepository;
import com.app.persistence.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingInternalService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository transactionRepository;

    public Mono<PaymentMethodEntity> savePaymentMethod(PaymentMethodEntity paymentMethod) {
        log.info("Saving payment method for tenant: {}", paymentMethod.getTenantId());
        // If it's default, unmark others
        if (Boolean.TRUE.equals(paymentMethod.getIsDefault())) {
            return paymentMethodRepository.findByTenantIdAndIsDefaultTrue(paymentMethod.getTenantId())
                    .flatMap(existing -> {
                        existing.setIsDefault(false);
                        return paymentMethodRepository.save(existing);
                    })
                    .then(paymentMethodRepository.save(paymentMethod));
        }
        return paymentMethodRepository.save(paymentMethod);
    }

    public Mono<SubscriptionEntity> activateTrial(Long subscriptionId) {
        log.info("Activating 14-day trial for subscription: {}", subscriptionId);
        return subscriptionRepository.findById(subscriptionId)
                .flatMap(sub -> {
                    sub.setStatus("TRIAL");
                    sub.setTrialEndsAt(LocalDateTime.now().plusDays(14));
                    sub.setNextBillingDate(sub.getTrialEndsAt());
                    sub.setUpdatedAt(LocalDateTime.now());
                    return subscriptionRepository.save(sub);
                });
    }

    public Flux<SubscriptionEntity> getSubscriptionsDue() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Searching for subscriptions due at: {}", now);
        // Using Flux filtering for now, could be optimized with a custom query
        return subscriptionRepository.findAll()
                .filter(sub -> sub.getNextBillingDate() != null && sub.getNextBillingDate().isBefore(now))
                .filter(sub -> !"CANCELLED".equals(sub.getStatus()) && !"SUSPENDED".equals(sub.getStatus()));
    }

    public Mono<InvoiceEntity> generateInvoice(InvoiceEntity invoice) {
        log.info("Generating invoice for tenant: {}", invoice.getTenantId());
        if (invoice.getCreatedAt() == null) invoice.setCreatedAt(LocalDateTime.now());
        if (invoice.getUpdatedAt() == null) invoice.setUpdatedAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }

    public Mono<SubscriptionEntity> updateSubscriptionStatus(Long id, String status) {
        log.info("Updating subscription {} status to: {}", id, status);
        return subscriptionRepository.findById(id)
                .flatMap(sub -> {
                    sub.setStatus(status);
                    sub.setUpdatedAt(LocalDateTime.now());
                    return subscriptionRepository.save(sub);
                });
    }

    public Mono<PaymentTransactionEntity> saveTransaction(PaymentTransactionEntity transaction) {
        log.info("Recording transaction {} for tenant: {}", transaction.getTransactionId(), transaction.getTenantId());
        if (transaction.getCreatedAt() == null) transaction.setCreatedAt(LocalDateTime.now());
        return transactionRepository.save(transaction);
    }

    public Mono<InvoiceEntity> getInvoiceById(Long id) {
        return invoiceRepository.findById(id);
    }
}
