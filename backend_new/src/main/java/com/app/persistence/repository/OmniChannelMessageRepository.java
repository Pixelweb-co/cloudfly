package com.app.persistence.repository;

import com.app.persistence.entity.OmniChannelMessageEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface OmniChannelMessageRepository extends ReactiveCrudRepository<OmniChannelMessageEntity, Long> {
    Flux<OmniChannelMessageEntity> findByTenantIdAndContactId(Long tenantId, Long contactId);
}
