package com.app.persistence.repository;

import com.app.persistence.entity.PlanEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PlanRepository extends ReactiveCrudRepository<PlanEntity, Long> {
    Mono<PlanEntity> findByName(String name);
    Flux<PlanEntity> findByIsActiveTrue();
    Flux<PlanEntity> findByIsFreeTrue();
}
