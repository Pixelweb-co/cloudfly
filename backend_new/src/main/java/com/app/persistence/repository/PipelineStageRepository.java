package com.app.persistence.repository;

import com.app.persistence.entity.PipelineStageEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PipelineStageRepository extends ReactiveCrudRepository<PipelineStageEntity, Long> {
    @Query("SELECT * FROM pipeline_stages WHERE pipeline_id = :pipelineId ORDER BY position ASC")
    Flux<PipelineStageEntity> findByPipelineIdOrderByPositionAsc(Long pipelineId);

    @Query("DELETE FROM pipeline_stages WHERE pipeline_id = :pipelineId")
    Mono<Void> deleteByPipelineId(Long pipelineId);
}
