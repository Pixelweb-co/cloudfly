package com.app.persistence.repository;

import com.app.persistence.entity.SubscriptionEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SubscriptionRepository extends ReactiveCrudRepository<SubscriptionEntity, Long> {
    Flux<SubscriptionEntity> findByCustomerId(Long customerId);
    Mono<SubscriptionEntity> findFirstByCustomerIdAndStatusOrderByEndDateDesc(Long customerId, String status);
}
