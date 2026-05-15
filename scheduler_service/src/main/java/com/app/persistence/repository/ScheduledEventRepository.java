package com.app.persistence.repository;

import com.app.persistence.entity.ScheduledEventEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;

public interface ScheduledEventRepository extends ReactiveCrudRepository<ScheduledEventEntity, Long> {
    Flux<ScheduledEventEntity> findAllByStatusAndScheduledAtBefore(String status, LocalDateTime scheduledAt);
}
