package com.app.persistence.repository;

import com.app.persistence.entity.PlanModuleEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface PlanModuleRepository extends ReactiveCrudRepository<PlanModuleEntity, Long> {
    Flux<PlanModuleEntity> findByPlanId(Long planId);
    Flux<Void> deleteByPlanId(Long planId);
}
