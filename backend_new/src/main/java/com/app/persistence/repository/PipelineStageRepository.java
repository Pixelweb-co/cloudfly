package com.app.persistence.repository;

import com.app.persistence.entity.PipelineStageEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PipelineStageRepository extends ReactiveCrudRepository<PipelineStageEntity, Long> {
    Flux<PipelineStageEntity> findByPipelineIdOrderByPositionAsc(Long pipelineId);
    Mono<Void> deleteByPipelineId(Long pipelineId);
}
