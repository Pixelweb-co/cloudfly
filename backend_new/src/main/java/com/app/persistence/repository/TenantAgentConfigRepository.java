package com.app.persistence.repository;

import com.app.persistence.entity.TenantAgentConfig;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface TenantAgentConfigRepository extends ReactiveCrudRepository<TenantAgentConfig, Long> {
    Flux<TenantAgentConfig> findByTenantId(Long tenantId);
    Mono<TenantAgentConfig> findByTenantIdAndGlobalAgentId(Long tenantId, Long globalAgentId);
}
