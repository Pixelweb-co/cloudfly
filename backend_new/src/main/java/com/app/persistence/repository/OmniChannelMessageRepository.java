package com.app.persistence.repository;

import com.app.persistence.entity.OmniChannelMessageEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import org.springframework.data.r2dbc.repository.Query;

public interface OmniChannelMessageRepository extends ReactiveCrudRepository<OmniChannelMessageEntity, Long> {
    @Query("SELECT * FROM omni_channel_messages WHERE tenant_id = :tenantId AND contact_id = :contactId ORDER BY created_at ASC")
    Flux<OmniChannelMessageEntity> findByTenantIdAndContactId(Long tenantId, Long contactId);

    @Query("SELECT * FROM omni_channel_messages WHERE tenant_id = :tenantId AND contact_id = :contactId AND direction = 'INBOUND' AND (status IS NULL OR status != 'READ') ORDER BY created_at DESC")
    Flux<OmniChannelMessageEntity> findUnreadByTenantIdAndContactId(Long tenantId, Long contactId);

    @Query("SELECT contact_id, COUNT(*) as cnt FROM omni_channel_messages WHERE tenant_id = :tenantId AND direction = 'INBOUND' AND (status IS NULL OR status != 'READ') GROUP BY contact_id")
    Flux<java.util.Map<String, Object>> countUnreadGroupedByContact(Long tenantId);

    @org.springframework.data.r2dbc.repository.Modifying
    @Query("UPDATE omni_channel_messages SET status = 'READ' WHERE tenant_id = :tenantId AND contact_id = :contactId AND direction = 'INBOUND' AND (status IS NULL OR status != 'READ')")
    Mono<Integer> markAllReadByContact(Long tenantId, Long contactId);
}
