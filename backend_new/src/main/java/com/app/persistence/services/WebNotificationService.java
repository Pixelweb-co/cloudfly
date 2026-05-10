package com.app.persistence.services;

import com.app.persistence.entity.WebNotificationEntity;
import com.app.persistence.repository.WebNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class WebNotificationService {
    private final WebNotificationRepository repository;

    public Flux<WebNotificationEntity> getNotifications(Long tenantId, Long userId) {
        return repository.findRecentByTenantAndUser(tenantId, userId);
    }

    public Mono<WebNotificationEntity> markAsRead(String id) {
        return repository.findById(id)
                .flatMap(n -> {
                    n.setStatus("READ");
                    return repository.save(n);
                });
    }

    public Mono<WebNotificationEntity> delete(String id) {
        return repository.findById(id)
                .flatMap(n -> {
                    n.setStatus("DELETED");
                    return repository.save(n);
                });
    }
}
