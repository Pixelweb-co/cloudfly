package com.app.persistence.repository;

import com.app.persistence.entity.PaymentMethodEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PaymentMethodRepository extends ReactiveCrudRepository<PaymentMethodEntity, Long> {
    Flux<PaymentMethodEntity> findAllByTenantId(Long tenantId);
    Mono<PaymentMethodEntity> findByTenantIdAndIsDefaultTrue(Long tenantId);
}
