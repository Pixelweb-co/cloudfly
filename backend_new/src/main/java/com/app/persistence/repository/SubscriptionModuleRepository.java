package com.app.persistence.repository;

import com.app.persistence.entity.SubscriptionModuleEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface SubscriptionModuleRepository extends ReactiveCrudRepository<SubscriptionModuleEntity, Long> {
    Flux<SubscriptionModuleEntity> findBySubscriptionId(Long subscriptionId);
    Flux<Void> deleteBySubscriptionId(Long subscriptionId);
}
