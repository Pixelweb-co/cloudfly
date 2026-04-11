package com.app.persistence.repository;

import com.app.persistence.entity.OmniChannelMessageEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import org.springframework.data.r2dbc.repository.Query;

public interface OmniChannelMessageRepository extends ReactiveCrudRepository<OmniChannelMessageEntity, Long> {
    @Query("SELECT * FROM omni_channel_messages WHERE tenant_id = :tenantId AND contact_id = :contactId ORDER BY created_at ASC")
    Flux<OmniChannelMessageEntity> findByTenantIdAndContactId(Long tenantId, Long contactId);
}
