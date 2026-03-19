package com.app.persistence.repository;

import com.app.persistence.entity.ChannelTypeConfig;
import org.springframework.data.repository.reactive.ReactiveSortingRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ChannelTypeConfigRepository extends ReactiveSortingRepository<ChannelTypeConfig, Long> {

    Flux<ChannelTypeConfig> findByStatus(Boolean status);

    Mono<ChannelTypeConfig> findByTypeName(String typeName);

    Mono<ChannelTypeConfig> save(ChannelTypeConfig entity);

    Mono<ChannelTypeConfig> findById(Long id);

    Mono<Void> deleteById(Long id);
}
