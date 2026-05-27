package com.app.persistence.repository;

import com.app.persistence.entity.SubscriptionModuleEntity;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SubscriptionModuleRepository extends ReactiveCrudRepository<SubscriptionModuleEntity, Long> {
    Flux<SubscriptionModuleEntity> findBySubscriptionId(Long subscriptionId);
    
    @Modifying
    @Query("DELETE FROM subscription_modules WHERE subscription_id = :subscriptionId")
    Mono<Void> deleteBySubscriptionId(Long subscriptionId);

    @Modifying
    @Query("INSERT INTO subscription_modules (subscription_id, module_id) VALUES (:subscriptionId, :moduleId)")
    Mono<Void> insertModule(Long subscriptionId, Long moduleId);
}
