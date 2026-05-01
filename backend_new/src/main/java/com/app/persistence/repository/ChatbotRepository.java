package com.app.persistence.repository;

import com.app.persistence.entity.ChatbotEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface ChatbotRepository extends ReactiveCrudRepository<ChatbotEntity, Integer> {
    
    @Query("SELECT * FROM chatbots WHERE tenant_id = :tenantId")
    Mono<ChatbotEntity> findByTenantId(Integer tenantId);
}
