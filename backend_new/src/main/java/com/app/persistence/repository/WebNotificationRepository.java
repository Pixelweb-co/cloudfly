package com.app.persistence.repository;

import com.app.persistence.entity.WebNotificationEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface WebNotificationRepository extends ReactiveCrudRepository<WebNotificationEntity, String> {
    
    @Query("SELECT * FROM web_notifications WHERE tenant_id = :tenantId AND (user_id IS NULL OR user_id = :userId) AND status != 'DELETED' ORDER BY created_at DESC LIMIT 50")
    Flux<WebNotificationEntity> findRecentByTenantAndUser(Long tenantId, Long userId);
}
