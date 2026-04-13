package com.app.persistence.repository;

import org.springframework.data.r2dbc.repository.Query;
import com.app.persistence.entity.SubscriptionEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SubscriptionRepository extends ReactiveCrudRepository<SubscriptionEntity, Long> {
    @Query("SELECT * FROM subscriptions WHERE customer_id = :customerId")
    Flux<SubscriptionEntity> findByCustomerId(Long customerId);

    @Query("SELECT * FROM subscriptions WHERE customer_id = :customerId AND status = :status ORDER BY end_date DESC LIMIT 1")
    Mono<SubscriptionEntity> findFirstByCustomerIdAndStatusOrderByEndDateDesc(Long customerId, String status);
}
