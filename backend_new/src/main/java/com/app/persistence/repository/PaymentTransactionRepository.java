package com.app.persistence.repository;

import com.app.persistence.entity.PaymentTransactionEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface PaymentTransactionRepository extends ReactiveCrudRepository<PaymentTransactionEntity, Long> {
    Flux<PaymentTransactionEntity> findAllByTenantId(Long tenantId);
    Flux<PaymentTransactionEntity> findAllByInvoiceId(Long invoiceId);
}
