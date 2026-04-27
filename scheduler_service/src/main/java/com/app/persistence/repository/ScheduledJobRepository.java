package com.app.persistence.repository;

import com.app.persistence.entity.ScheduledJobEntity;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

public interface ScheduledJobRepository extends ReactiveCrudRepository<ScheduledJobEntity, Long> {

    @Query("SELECT * FROM scheduled_jobs WHERE status = 'PENDING' AND execute_at <= :now")
    Flux<ScheduledJobEntity> findPendingJobs(LocalDateTime now);

    @Modifying
    @Query("UPDATE scheduled_jobs SET status = :newStatus WHERE id = :id AND status = :expectedStatus")
    Mono<Integer> updateStatusIf(Long id, String expectedStatus, String newStatus);

    @Modifying
    @Query("UPDATE scheduled_jobs SET status = :status, execute_at = :nextRun, retry_count = retry_count + 1, last_error = :error WHERE id = :id")
    Mono<Integer> markFailedWithRetry(Long id, String status, LocalDateTime nextRun, String error);
}
