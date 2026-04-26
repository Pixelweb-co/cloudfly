package com.app.services;

import com.app.persistence.entity.CalendarEventEntity;
import com.app.persistence.entity.JobStatus;
import com.app.persistence.entity.ScheduledJobEntity;
import com.app.persistence.repository.ScheduledJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobGeneratorService {

    private final ScheduledJobRepository scheduledJobRepository;

    public Mono<Void> generateJobsForEvent(CalendarEventEntity event) {
        List<ScheduledJobEntity> jobsToCreate = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        switch (event.getEventType()) {
            case APPOINTMENT:
                // confirmation now
                jobsToCreate.add(createJob(event.getId(), now));
                // reminder 24h before
                if (event.getStartTime().minusHours(24).isAfter(now)) {
                    jobsToCreate.add(createJob(event.getId(), event.getStartTime().minusHours(24)));
                }
                // reminder 1h before
                if (event.getStartTime().minusHours(1).isAfter(now)) {
                    jobsToCreate.add(createJob(event.getId(), event.getStartTime().minusHours(1)));
                }
                // execution at start_time
                if (event.getStartTime().isAfter(now)) {
                    jobsToCreate.add(createJob(event.getId(), event.getStartTime()));
                }
                break;

            case FINANCIAL:
                // reminder 3 days before due (assuming startTime is due date)
                if (event.getStartTime().minusDays(3).isAfter(now)) {
                    jobsToCreate.add(createJob(event.getId(), event.getStartTime().minusDays(3)));
                }
                // reminder at due
                if (event.getStartTime().isAfter(now)) {
                    jobsToCreate.add(createJob(event.getId(), event.getStartTime()));
                }
                // overdue notification 1 day after
                jobsToCreate.add(createJob(event.getId(), event.getStartTime().plusDays(1)));
                break;

            case SUBSCRIPTION:
                // renewal (at start_time)
                if (event.getStartTime().isAfter(now)) {
                    jobsToCreate.add(createJob(event.getId(), event.getStartTime()));
                }
                // suspension (if failed, after 3 days)
                jobsToCreate.add(createJob(event.getId(), event.getStartTime().plusDays(3)));
                break;
                
            case MARKETING:
            case SYSTEM:
                if (event.getStartTime().isAfter(now) || event.getStartTime().isEqual(now)) {
                    jobsToCreate.add(createJob(event.getId(), event.getStartTime()));
                }
                break;
        }

        return Flux.fromIterable(jobsToCreate)
                .flatMap(scheduledJobRepository::save)
                .then();
    }

    private ScheduledJobEntity createJob(Long eventId, LocalDateTime executeAt) {
        return ScheduledJobEntity.builder()
                .eventId(eventId)
                .executeAt(executeAt)
                .status(JobStatus.PENDING)
                .retryCount(0)
                .maxRetries(3) // Exponential backoff retries limit
                .createdAt(LocalDateTime.now())
                .build();
    }
}
