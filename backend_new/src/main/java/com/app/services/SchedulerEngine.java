package com.app.services;

import com.app.persistence.entity.CalendarEventEntity;
import com.app.persistence.entity.JobStatus;
import com.app.persistence.entity.ScheduledJobEntity;
import com.app.persistence.repository.CalendarEventRepository;
import com.app.persistence.repository.ScheduledJobRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.reactive.ReactiveKafkaProducerTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Profile("scheduler")
public class SchedulerEngine {

    private final ScheduledJobRepository scheduledJobRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final ReactiveKafkaProducerTemplate<String, Object> kafkaTemplate;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    private static final String SCHEDULER_TOPIC = "scheduler.events";

    // Run every 5 seconds
    @Scheduled(fixedDelay = 5000)
    public void processScheduledJobs() {
        LocalDateTime now = LocalDateTime.now();
        log.debug("SchedulerEngine tick: Fetching jobs to execute before {}", now);

        scheduledJobRepository.findPendingJobs(now)
                .flatMap(this::processJob)
                .subscribe(
                        success -> {},
                        error -> log.error("Error in SchedulerEngine processing: ", error)
                );
    }

    private Mono<Void> processJob(ScheduledJobEntity job) {
        return scheduledJobRepository.updateStatusIf(job.getId(), JobStatus.PENDING.name(), JobStatus.RUNNING.name())
                .filter(rowsUpdated -> rowsUpdated > 0) // Ensure concurrency safety
                .flatMap(rowsUpdated -> executeJobPublishing(job));
    }

    private Mono<Void> executeJobPublishing(ScheduledJobEntity job) {
        return calendarEventRepository.findById(job.getEventId())
                .flatMap(event -> {
                    if (event.getEventType() == com.app.persistence.entity.EventType.REST_ACTION) {
                        return executeRestAction(event)
                                .then(scheduledJobRepository.updateStatusIf(job.getId(), JobStatus.RUNNING.name(), JobStatus.DONE.name()))
                                .flatMap(rows -> handleRecurrence(event, job));
                    } else {
                        Map<String, Object> message = buildKafkaMessage(event);
                        return kafkaTemplate.send(SCHEDULER_TOPIC, event.getTenantId().toString(), message)
                                .doOnSuccess(result -> log.info("Successfully published job {} to Kafka", job.getId()))
                                .flatMap(result -> scheduledJobRepository.updateStatusIf(job.getId(), JobStatus.RUNNING.name(), JobStatus.DONE.name()))
                                .flatMap(rows -> handleRecurrence(event, job));
                    }
                })
                .switchIfEmpty(
                        // Event deleted? Mark as failed
                        scheduledJobRepository.updateStatusIf(job.getId(), JobStatus.RUNNING.name(), JobStatus.FAILED.name())
                )
                .onErrorResume(e -> handleJobError(job, e))
                .then();
    }

    private Mono<Void> executeRestAction(CalendarEventEntity event) {
        try {
            String payload = event.getPayload();
            if (payload == null || payload.isEmpty()) {
                return Mono.error(new RuntimeException("REST_ACTION event missing payload"));
            }

            Map<String, Object> config = objectMapper.readValue(payload, Map.class);
            String url = (String) config.get("url");
            String method = (String) config.getOrDefault("method", "POST");
            Object body = config.get("body");
            Map<String, String> headers = (Map<String, String>) config.get("headers");

            if (url == null) {
                return Mono.error(new RuntimeException("REST_ACTION missing 'url' in payload"));
            }

            WebClient client = webClientBuilder.build();
            WebClient.RequestBodySpec requestSpec = client.method(org.springframework.http.HttpMethod.valueOf(method.toUpperCase()))
                    .uri(url);

            if (headers != null) {
                headers.forEach(requestSpec::header);
            }

            if (body != null) {
                requestSpec.bodyValue(body);
            }

            return requestSpec.retrieve()
                    .toBodilessEntity()
                    .doOnSuccess(response -> log.info("REST_ACTION for event {} completed with status {}", event.getId(), response.getStatusCode()))
                    .then(Mono.just(1));

        } catch (Exception e) {
            return Mono.error(e);
        }
    }

    private Mono<Void> handleRecurrence(CalendarEventEntity event, ScheduledJobEntity job) {
        if (event.getRecurrence() == null || !job.getExecuteAt().equals(event.getStartTime())) {
            return Mono.empty();
        }

        log.info("Processing recurrence for event {}: {}", event.getId(), event.getRecurrence());
        
        LocalDateTime nextStart;
        switch (event.getRecurrence().toUpperCase()) {
            case "DAILY":
                nextStart = event.getStartTime().plusDays(1);
                break;
            case "WEEKLY":
                nextStart = event.getStartTime().plusWeeks(1);
                break;
            case "MONTHLY":
                nextStart = event.getStartTime().plusMonths(1);
                break;
            default:
                log.warn("Unknown recurrence pattern: {}", event.getRecurrence());
                return Mono.empty();
        }

        LocalDateTime nextEnd = null;
        if (event.getEndTime() != null) {
            long durationMinutes = java.time.Duration.between(event.getStartTime(), event.getEndTime()).toMinutes();
            nextEnd = nextStart.plusMinutes(durationMinutes);
        }

        event.setStartTime(nextStart);
        event.setEndTime(nextEnd);
        event.setUpdatedAt(LocalDateTime.now());

        // Use a circular dependency workaround or just inject JobGeneratorService
        // Actually, I can just call jobGeneratorService if I inject it.
        return calendarEventRepository.save(event)
                .flatMap(savedEvent -> {
                    // I need to inject jobGeneratorService
                    return jobGeneratorService.generateJobsForEvent(savedEvent);
                });
    }

    // Need to add jobGeneratorService to constructor
    private final JobGeneratorService jobGeneratorService;

    private Map<String, Object> buildKafkaMessage(CalendarEventEntity event) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("event", event.getEventSubtype() != null ? event.getEventSubtype() : event.getEventType().name());
        msg.put("tenant_id", event.getTenantId() != null ? event.getTenantId().toString() : null);
        msg.put("company_id", event.getCompanyId() != null ? event.getCompanyId().toString() : null);
        msg.put("calendar_id", event.getCalendarId() != null ? event.getCalendarId().toString() : null);
        msg.put("source", "scheduler-service");
        msg.put("timestamp", LocalDateTime.now().toString());
        msg.put("data", event.getPayload()); // Optional string/JSON data from event
        return msg;
    }

    private Mono<Integer> handleJobError(ScheduledJobEntity job, Throwable e) {
        log.error("Failed to execute job {}: {}", job.getId(), e.getMessage());
        int newRetryCount = (job.getRetryCount() != null ? job.getRetryCount() : 0) + 1;
        int maxRetries = job.getMaxRetries() != null ? job.getMaxRetries() : 3;

        if (newRetryCount >= maxRetries) {
            log.error("Job {} reached max retries. Marking as FAILED.", job.getId());
            return scheduledJobRepository.updateStatusIf(job.getId(), JobStatus.RUNNING.name(), JobStatus.FAILED.name());
        }

        // Exponential backoff
        long backoffMinutes = (long) Math.pow(2, newRetryCount);
        LocalDateTime newExecuteAt = LocalDateTime.now().plusMinutes(backoffMinutes);

        return scheduledJobRepository.markFailedWithRetry(
                job.getId(),
                JobStatus.PENDING.name(),
                newExecuteAt,
                e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 255)) : "Unknown Error"
        );
    }
}
