package com.app.persistence.repository;

import com.app.persistence.entity.ChannelConfig;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface ChannelConfigRepository extends ReactiveCrudRepository<ChannelConfig, Long> {
    Mono<ChannelConfig> findByTenantId(Long tenantId);
}
