package com.app.persistence.repository;

import org.springframework.data.r2dbc.repository.Query;
import com.app.persistence.entity.PlanEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PlanRepository extends ReactiveCrudRepository<PlanEntity, Long> {
    @Query("SELECT * FROM plans WHERE name = :name")
    Mono<PlanEntity> findByName(String name);

    @Query("SELECT * FROM plans WHERE is_active = true")
    Flux<PlanEntity> findByIsActiveTrue();

    @Query("SELECT * FROM plans WHERE is_free = true")
    Flux<PlanEntity> findByIsFreeTrue();
}
