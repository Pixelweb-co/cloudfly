package com.app.services;

import com.app.persistence.entity.ScheduledEventEntity;
import com.app.persistence.repository.ScheduledEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingProcessorService {

    private final ScheduledEventRepository scheduledEventRepository;
    private final WebClient.Builder webClientBuilder;

    // Run every minute
    @Scheduled(fixedRate = 60000)
    public void processScheduledEvents() {
        log.debug("⏰ [SCHEDULER] Checking for pending billing events...");
        
        scheduledEventRepository.findAllByStatusAndScheduledAtBefore("PENDING", LocalDateTime.now())
                .flatMap(this::executeEvent)
                .subscribe();
    }

    private Mono<Void> executeEvent(ScheduledEventEntity event) {
        log.info("🚀 [SCHEDULER] Executing {} for Subscription {}", event.getEventType(), event.getSubscriptionId());
        
        event.setStatus("PROCESSING");
        return scheduledEventRepository.save(event)
                .flatMap(e -> {
                    switch (e.getEventType()) {
                        case "GENERATE_INVOICE":
                        case "AUTO_CHARGE":
                            return callBillingService(e);
                        case "PRE_DUE_NOTIFICATION":
                        case "PAYMENT_REMINDER_1":
                        case "PAYMENT_REMINDER_2":
                        case "PAYMENT_REMINDER_3":
                            return triggerNotification(e);
                        case "SUSPEND_SUBSCRIPTION":
                            return callBackendApiToSuspend(e);
                        default:
                            log.warn("Unknown event type: {}", e.getEventType());
                            return Mono.empty();
                    }
                })
                .flatMap(success -> {
                    event.setStatus("COMPLETED");
                    event.setExecutedAt(LocalDateTime.now());
                    return scheduledEventRepository.save(event).then();
                })
                .onErrorResume(err -> {
                    log.error("❌ Error executing event {}: {}", event.getId(), err.getMessage());
                    event.setStatus("FAILED");
                    event.setRetryCount(event.getRetryCount() + 1);
                    return scheduledEventRepository.save(event).then();
                });
    }

    private Mono<Boolean> callBillingService(ScheduledEventEntity event) {
        String billingUrl = "http://billing-service:8080/api/billing/execute-event";
        log.info("Calling billing-service for event {}", event.getEventType());
        
        return webClientBuilder.build()
                .post()
                .uri(billingUrl)
                .bodyValue(new BillingEventRequest(
                        event.getId(),
                        event.getEventType(),
                        event.getTenantId(),
                        event.getSubscriptionId(),
                        event.getPayload()
                ))
                .retrieve()
                .toBodilessEntity()
                .map(resp -> true)
                .onErrorReturn(false);
    }

    private static record BillingEventRequest(
            Long eventId,
            String eventType,
            Long tenantId,
            Long subscriptionId,
            String payload
    ) {}

    private Mono<Boolean> triggerNotification(ScheduledEventEntity event) {
        log.info("Triggering notification for event {}", event.getEventType());
        // Logic to publish to Kafka or call notification-service
        return Mono.just(true);
    }

    private Mono<Boolean> callBackendApiToSuspend(ScheduledEventEntity event) {
        log.info("Suspending subscription {} via backend-api", event.getSubscriptionId());
        return Mono.just(true);
    }
}
