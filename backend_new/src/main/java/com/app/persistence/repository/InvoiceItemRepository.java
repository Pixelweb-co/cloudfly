package com.app.persistence.repository;

import com.app.persistence.entity.InvoiceItemEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface InvoiceItemRepository extends ReactiveCrudRepository<InvoiceItemEntity, Long> {
    Flux<InvoiceItemEntity> findAllByInvoiceId(Long invoiceId);
}
