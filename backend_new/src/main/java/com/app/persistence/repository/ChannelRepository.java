package com.app.persistence.repository;

import com.app.persistence.entity.ChannelEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ChannelRepository extends ReactiveCrudRepository<ChannelEntity, Long> {
    Flux<ChannelEntity> findByCompanyIdAndTenantId(Long companyId, Long tenantId);
    Mono<ChannelEntity> findByInstanceName(String instanceName);
    Flux<ChannelEntity> findByTenantId(Long tenantId);
}
