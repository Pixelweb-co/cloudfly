package com.app.persistence.repository;

import com.app.persistence.entity.PipelineEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PipelineRepository extends ReactiveCrudRepository<PipelineEntity, Long> {
    Flux<PipelineEntity> findByTenantId(Long tenantId);
    Mono<PipelineEntity> findByIdAndTenantId(Long id, Long tenantId);
}
