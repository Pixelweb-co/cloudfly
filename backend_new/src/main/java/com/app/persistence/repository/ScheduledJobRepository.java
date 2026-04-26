package com.app.persistence.repository;

import com.app.persistence.entity.JobStatus;
import com.app.persistence.entity.ScheduledJobEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface ScheduledJobRepository extends ReactiveCrudRepository<ScheduledJobEntity, Long> {

    @Query("SELECT * FROM scheduled_jobs WHERE status = 'PENDING' AND execute_at <= :now")
    Flux<ScheduledJobEntity> findPendingJobs(LocalDateTime now);

    @Query("UPDATE scheduled_jobs SET status = :newStatus WHERE id = :id AND status = :expectedStatus")
    Mono<Integer> updateStatusIf(Long id, String expectedStatus, String newStatus);
    
    @Query("UPDATE scheduled_jobs SET status = :newStatus, retry_count = retry_count + 1, execute_at = :newExecuteAt, last_error = :error WHERE id = :id")
    Mono<Integer> markFailedWithRetry(Long id, String newStatus, LocalDateTime newExecuteAt, String error);
}
