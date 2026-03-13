package com.app.persistence.repository;

import com.app.persistence.entity.ChatbotConfig;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface ChatbotConfigRepository extends ReactiveCrudRepository<ChatbotConfig, Long> {
    Mono<ChatbotConfig> findByTenantId(Long tenantId);
}
