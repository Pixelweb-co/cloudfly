package com.app.persistence.repository;

import com.app.persistence.entity.InvoiceEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface InvoiceRepository extends ReactiveCrudRepository<InvoiceEntity, Long> {
    Flux<InvoiceEntity> findAllByTenantId(Long tenantId);
    Mono<InvoiceEntity> findByInvoiceNumber(String invoiceNumber);
    Flux<InvoiceEntity> findAllBySubscriptionId(Long subscriptionId);
    Mono<InvoiceEntity> findByPublicUrlToken(String publicUrlToken);
}
