package com.app.persistence.repository;

import com.app.persistence.entity.TenantEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface TenantRepository extends ReactiveCrudRepository<TenantEntity, Long> {
    Mono<TenantEntity> findByName(String name);
}
