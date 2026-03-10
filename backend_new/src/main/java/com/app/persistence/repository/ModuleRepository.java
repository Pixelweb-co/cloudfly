package com.app.persistence.repository;

import com.app.persistence.entity.ModuleEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface ModuleRepository extends ReactiveCrudRepository<ModuleEntity, Long> {
    Mono<Boolean> existsByCode(String code);
}
