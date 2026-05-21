package com.app.persistence.services;

import com.app.persistence.entity.InvoiceEntity;
import com.app.persistence.entity.PaymentMethodEntity;
import com.app.persistence.entity.PaymentTransactionEntity;
import com.app.persistence.entity.SubscriptionEntity;
import com.app.persistence.repository.ContactRepository;
import com.app.persistence.repository.InvoiceRepository;
import com.app.persistence.repository.PaymentMethodRepository;
import com.app.persistence.repository.PaymentTransactionRepository;
import com.app.persistence.repository.PlanRepository;
import com.app.persistence.repository.SubscriptionRepository;
import com.app.persistence.repository.TenantRepository;
import com.app.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
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
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final ContactRepository contactRepository;
    private final PlanRepository planRepository;
    private final WebClient.Builder webClientBuilder;


    public Mono<SubscriptionEntity> getSubscriptionById(Long id) {
        log.info("Fetching subscription by id: {}", id);
        return subscriptionRepository.findById(id);
    }

    public Mono<PaymentMethodEntity> getDefaultPaymentMethod(Long tenantId) {
        log.info("Fetching default payment method for tenant: {}", tenantId);
        return paymentMethodRepository.findByTenantIdAndIsDefaultTrue(tenantId);
    }

    public Flux<InvoiceEntity> getInvoices(Long tenantId, String status) {
        log.info("Fetching invoices for tenant {} with status {}", tenantId, status);
        return invoiceRepository.findAllByTenantId(tenantId)
                .filter(invoice -> status == null || status.isBlank() || status.equalsIgnoreCase(invoice.getStatus()));
    }

    public Mono<PaymentMethodEntity> savePaymentMethod(PaymentMethodEntity paymentMethod) {
        log.info("Saving payment method for tenant: {}", paymentMethod.getTenantId());
        
        // 1. Call billing-service (Go) to create Payment Source in Wompi
        return webClientBuilder.build()
                .post()
                .uri("http://billing-service:8080/api/billing/create-source")
                .bodyValue(paymentMethod)
                .retrieve()
                .bodyToMono(PaymentSourceResponse.class)
                .flatMap(response -> {
                    paymentMethod.setPaymentSourceId(response.paymentSourceId());
                    
                    // 2. Save in Database
                    if (Boolean.TRUE.equals(paymentMethod.getIsDefault())) {
                        return paymentMethodRepository.findByTenantIdAndIsDefaultTrue(paymentMethod.getTenantId())
                                .flatMap(existing -> {
                                    existing.setIsDefault(false);
                                    return paymentMethodRepository.save(existing);
                                })
                                .then(paymentMethodRepository.save(paymentMethod));
                    }
                    return paymentMethodRepository.save(paymentMethod);
                });
    }

    private record PaymentSourceResponse(String paymentSourceId) {}

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

    public Mono<InvoiceEntity> updateInvoicePdf(Long id, String pdfUrl) {

        log.info("Updating PDF URL for invoice {}: {}", id, pdfUrl);
        return invoiceRepository.findById(id)
                .flatMap(invoice -> {
                    invoice.setPdfUrl(pdfUrl);
                    invoice.setUpdatedAt(LocalDateTime.now());
                    return invoiceRepository.save(invoice);
                });
    }

    public Mono<com.app.persistence.entity.TenantEntity> getTenantById(Long id) {
        return tenantRepository.findById(id)
                .flatMap(tenant -> {
                    if (tenant.getAdminUserId() == null) return Mono.just(tenant);
                    
                    return userRepository.findById(tenant.getAdminUserId())
                            .flatMap(user -> {
                                if (user.getEmail() != null) tenant.setEmail(user.getEmail());
                                if (user.getContactId() == null) return Mono.just(tenant);
                                
                                return contactRepository.findById(user.getContactId())
                                        .map(contact -> {
                                            if (contact.getEmail() != null) tenant.setEmail(contact.getEmail());
                                            if (contact.getPhone() != null) tenant.setPhone(contact.getPhone());
                                            return tenant;
                                        })
                                        .defaultIfEmpty(tenant);
                            })
                            .defaultIfEmpty(tenant);
                });
    }

    public Mono<InvoiceEntity> updateInvoiceStatusByReference(String invoiceNumber, String status) {
        log.info("Updating status for invoice reference {} to {}", invoiceNumber, status);
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .flatMap(invoice -> {
                    invoice.setStatus(status);
                    invoice.setUpdatedAt(LocalDateTime.now());
                    return invoiceRepository.save(invoice)
                            .flatMap(savedInvoice -> {
                                if (("PAGADA".equalsIgnoreCase(status) || "APPROVED".equalsIgnoreCase(status) || "PAID".equalsIgnoreCase(status)) && savedInvoice.getSubscriptionId() != null) {
                                    return subscriptionRepository.findById(savedInvoice.getSubscriptionId())
                                            .flatMap(sub -> planRepository.findBasicActivePlan()
                                                    .flatMap(basicPlan -> {
                                                        log.info("🔄 [RENEWAL] Auto-Charge approved. Upgrading Subscription {} to Basic Plan: {} (ID: {})", sub.getId(), basicPlan.getName(), basicPlan.getId());
                                                        sub.setPlanId(basicPlan.getId());
                                                        sub.setStatus("ACTIVE");
                                                        sub.setStartDate(LocalDateTime.now());
                                                        int duration = basicPlan.getDurationDays() != null ? basicPlan.getDurationDays() : 30;
                                                        sub.setEndDate(LocalDateTime.now().plusDays(duration));
                                                        sub.setNextBillingDate(sub.getEndDate());
                                                        sub.setTrialEndsAt(null);
                                                        
                                                        // Update limits
                                                        if (basicPlan.getAiTokensLimit() != null) {
                                                            sub.setAiTokensLimit(basicPlan.getAiTokensLimit());
                                                        }
                                                        if (basicPlan.getUsersLimit() != null) {
                                                            sub.setUsersLimit(basicPlan.getUsersLimit());
                                                        }
                                                        if (basicPlan.getElectronicDocsLimit() != null) {
                                                            sub.setElectronicDocsLimit(basicPlan.getElectronicDocsLimit());
                                                        }
                                                        
                                                        sub.setUpdatedAt(LocalDateTime.now());
                                                        return subscriptionRepository.save(sub);
                                                    })
                                                    .defaultIfEmpty(sub)
                                            )
                                            .then(Mono.just(savedInvoice));
                                }
                                return Mono.just(savedInvoice);
                            });
                });
    }
}
