package com.app.persistence.repository;

import com.app.persistence.entity.OmniChannelMessageEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import org.springframework.data.r2dbc.repository.Query;

public interface OmniChannelMessageRepository extends ReactiveCrudRepository<OmniChannelMessageEntity, Long> {
    @Query("SELECT * FROM omni_channel_messages WHERE tenant_id = :tenantId AND company_id = :companyId AND contact_id = :contactId ORDER BY created_at ASC")
    Flux<OmniChannelMessageEntity> findByTenantIdAndCompanyIdAndContactId(Long tenantId, Long companyId, Long contactId);

    @Query("SELECT * FROM omni_channel_messages WHERE tenant_id = :tenantId AND company_id = :companyId AND contact_id = :contactId AND direction = 'INBOUND' AND (status IS NULL OR status != 'READ') ORDER BY created_at DESC")
    Flux<OmniChannelMessageEntity> findUnreadByTenantIdAndCompanyIdAndContactId(Long tenantId, Long companyId, Long contactId);

    @Query("SELECT * FROM omni_channel_messages WHERE tenant_id = :tenantId AND company_id = :companyId AND contact_id = :contactId ORDER BY created_at DESC LIMIT 1")
    Mono<OmniChannelMessageEntity> findLastByContactId(Long tenantId, Long companyId, Long contactId);

    @Query("SELECT contact_id as contactId, COUNT(*) as cnt FROM omni_channel_messages WHERE tenant_id = :tenantId AND company_id = :companyId AND direction = 'INBOUND' AND (status IS NULL OR status != 'READ') GROUP BY contact_id")
    Flux<com.app.dto.UnreadChatSummaryDto> countUnreadGroupedByContactAndCompany(Long tenantId, Long companyId);

    @Query("UPDATE omni_channel_messages SET status = 'READ' WHERE tenant_id = :tenantId AND company_id = :companyId AND contact_id = :contactId AND direction = 'INBOUND' AND (status IS NULL OR status != 'READ')")
    Mono<Integer> markAllReadByContactAndCompany(Long tenantId, Long companyId, Long contactId);

    @Query("SELECT COUNT(DISTINCT contact_id) FROM omni_channel_messages WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Mono<Integer> countActiveConversations(Long tenantId, Long companyId);

    @Query("SELECT COUNT(*) FROM omni_channel_messages WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId) AND created_at >= CURDATE()")
    Mono<Integer> countMessagesToday(Long tenantId, Long companyId);
}
