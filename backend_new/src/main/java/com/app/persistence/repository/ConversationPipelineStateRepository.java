package com.app.persistence.repository;

import com.app.persistence.entity.ConversationPipelineStateEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface ConversationPipelineStateRepository extends ReactiveCrudRepository<ConversationPipelineStateEntity, Long> {
    Mono<ConversationPipelineStateEntity> findByTenantIdAndConversationId(Long tenantId, String conversationId);
    reactor.core.publisher.Flux<ConversationPipelineStateEntity> findByTenantIdAndPipelineIdAndIsActiveTrue(Long tenantId, Long pipelineId);
    Mono<ConversationPipelineStateEntity> findByTenantIdAndPipelineIdAndContactId(Long tenantId, Long pipelineId, Long contactId);
}
