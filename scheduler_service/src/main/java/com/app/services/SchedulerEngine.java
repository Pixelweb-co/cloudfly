package com.app.services;

import com.app.persistence.entity.CalendarEventEntity;
import com.app.persistence.entity.JobStatus;
import com.app.persistence.entity.ScheduledJobEntity;
import com.app.persistence.repository.CalendarEventRepository;
import com.app.persistence.repository.ScheduledJobRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class SchedulerEngine {

    private final ScheduledJobRepository scheduledJobRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final ReactiveKafkaProducerTemplate<String, Object> kafkaTemplate;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final JobGeneratorService jobGeneratorService;

    private static final String SCHEDULER_TOPIC = "scheduler.events";

    @Scheduled(fixedDelay = 5000)
    public void processScheduledJobs() {
        LocalDateTime now = LocalDateTime.now();
        scheduledJobRepository.findPendingJobs(now)
                .flatMap(this::processJob)
                .subscribe(
                    null,
                    error -> log.error("Error in scheduler loop: ", error)
                );
    }

    private Mono<Void> processJob(ScheduledJobEntity job) {
        return scheduledJobRepository.updateStatusIf(job.getId(), JobStatus.PENDING.name(), JobStatus.RUNNING.name())
                .filter(rowsUpdated -> rowsUpdated > 0)
                .flatMap(rowsUpdated -> executeJobPublishing(job));
    }

    private Mono<Void> executeJobPublishing(ScheduledJobEntity job) {
        return calendarEventRepository.findById(job.getEventId())
                .flatMap(event -> {
                    Mono<Void> executionMono;
                    if (event.getEventType() == com.app.persistence.entity.EventType.REST_ACTION) {
                        executionMono = executeRestAction(event);
                    } else if (event.getEventType() == com.app.persistence.entity.EventType.NOTIFICATION) {
                        executionMono = publishToNotificationService(event);
                    } else {
                        executionMono = publishToKafka(event);
                    }

                    return executionMono
                            .then(scheduledJobRepository.updateStatusIf(job.getId(), JobStatus.RUNNING.name(), JobStatus.DONE.name()))
                            .flatMap(rows -> handleRecurrence(event, job));
                })
                .onErrorResume(e -> handleJobError(job, e).then())
                .then();
    }

    private Mono<Void> publishToKafka(CalendarEventEntity event) {
        Map<String, Object> message = buildKafkaMessage(event);
        return kafkaTemplate.send(SCHEDULER_TOPIC, event.getTenantId().toString(), message)
                .doOnSuccess(result -> log.info("Published to Kafka for event {}", event.getId()))
                .then();
    }

    private Mono<Void> executeRestAction(CalendarEventEntity event) {
        try {
            String payload = event.getPayload();
            Map<String, Object> config = objectMapper.readValue(payload, Map.class);
            String url = (String) config.get("url");
            String method = (String) config.getOrDefault("method", "POST");
            Object body = config.get("body");
            Map<String, String> headers = (Map<String, String>) config.get("headers");

            WebClient client = webClientBuilder.build();
            WebClient.RequestBodySpec requestSpec = client.method(org.springframework.http.HttpMethod.valueOf(method.toUpperCase())).uri(url);
            if (headers != null) headers.forEach(requestSpec::header);
            if (body != null) requestSpec.bodyValue(body);

            return requestSpec.retrieve()
                    .toBodilessEntity()
                    .doOnSuccess(response -> log.info("REST_ACTION for event {} completed: {}", event.getId(), response.getStatusCode()))
                    .then();
        } catch (Exception e) {
            return Mono.error(e);
        }
    }

    private Mono<Void> publishToNotificationService(CalendarEventEntity event) {
        try {
            java.util.Map<String, Object> notification = objectMapper.readValue(event.getPayload(), java.util.Map.class);
            notification.put("tenantId", event.getTenantId());
            notification.put("companyId", event.getCompanyId());
            notification.put("eventId", event.getId());
            
            String notifyVia = (String) notification.getOrDefault("notifyVia", "email");
            String topic = "whatsapp".equalsIgnoreCase(notifyVia) ? "whatsapp-notifications" : "email-notifications";
            
            String toKey = "system";
            Object toObj = notification.get("to");
            if (toObj instanceof String) {
                toKey = (String) toObj;
            } else if (toObj instanceof java.util.List && !((java.util.List<?>) toObj).isEmpty()) {
                toKey = ((java.util.List<?>) toObj).get(0).toString();
            }
            
            return kafkaTemplate.send(topic, toKey, notification)
                    .doOnSuccess(result -> log.info("Notification sent to Kafka topic {} for event {}", topic, event.getId()))
                    .then();
        } catch (Exception e) {
            return Mono.error(e);
        }
    }

    private Mono<Void> handleRecurrence(CalendarEventEntity event, ScheduledJobEntity job) {
        if (event.getRecurrence() == null || !job.getExecuteAt().equals(event.getStartTime())) {
            return Mono.empty();
        }

        LocalDateTime nextStart;
        switch (event.getRecurrence().toUpperCase()) {
            case "DAILY": nextStart = event.getStartTime().plusDays(1); break;
            case "WEEKLY": nextStart = event.getStartTime().plusWeeks(1); break;
            case "MONTHLY": nextStart = event.getStartTime().plusMonths(1); break;
            default: return Mono.empty();
        }

        LocalDateTime nextEnd = event.getEndTime() != null ? nextStart.plusMinutes(java.time.Duration.between(event.getStartTime(), event.getEndTime()).toMinutes()) : null;
        event.setStartTime(nextStart);
        event.setEndTime(nextEnd);

        return calendarEventRepository.save(event)
                .flatMap(jobGeneratorService::generateJobsForEvent);
    }

    private Mono<Integer> handleJobError(ScheduledJobEntity job, Throwable e) {
        int newRetryCount = (job.getRetryCount() != null ? job.getRetryCount() : 0) + 1;
        if (newRetryCount >= (job.getMaxRetries() != null ? job.getMaxRetries() : 3)) {
            return scheduledJobRepository.updateStatusIf(job.getId(), JobStatus.RUNNING.name(), JobStatus.FAILED.name());
        }
        long backoffMinutes = (long) Math.pow(2, newRetryCount);
        return scheduledJobRepository.markFailedWithRetry(job.getId(), JobStatus.PENDING.name(), LocalDateTime.now().plusMinutes(backoffMinutes), e.getMessage());
    }

    private Map<String, Object> buildKafkaMessage(CalendarEventEntity event) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("event", event.getEventSubtype() != null ? event.getEventSubtype() : event.getEventType().name());
        msg.put("tenant_id", event.getTenantId());
        msg.put("company_id", event.getCompanyId());
        msg.put("source", "scheduler-service");
        msg.put("timestamp", LocalDateTime.now().toString());
        msg.put("data", event.getPayload());
        return msg;
    }
}
