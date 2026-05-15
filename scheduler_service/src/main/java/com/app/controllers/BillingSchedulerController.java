package com.app.controllers;

import com.app.persistence.entity.ScheduledEventEntity;
import com.app.persistence.repository.ScheduledEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/scheduler/billing")
@RequiredArgsConstructor
public class BillingSchedulerController {

    private final ScheduledEventRepository scheduledEventRepository;

    @PostMapping("/init")
    public Mono<Void> initBillingCalendar(@RequestBody BillingInitRequest request) {
        log.info("📅 Initializing billing calendar for Subscription {}", request.subscriptionId);
        
        List<ScheduledEventEntity> events = new ArrayList<>();
        
        // 1. PRE_DUE_NOTIFICATION (5 days before)
        events.add(createEvent(request, "PRE_DUE_NOTIFICATION", request.trialEndsAt.minusDays(5)));
        
        // 2. GENERATE_INVOICE (day of expiry)
        events.add(createEvent(request, "GENERATE_INVOICE", request.trialEndsAt));
        
        // 3. AUTO_CHARGE (day of expiry)
        events.add(createEvent(request, "AUTO_CHARGE", request.trialEndsAt));
        
        // 4. RETRIES & REMINDERS
        events.add(createEvent(request, "PAYMENT_REMINDER_1", request.trialEndsAt.plusDays(1)));
        events.add(createEvent(request, "PAYMENT_REMINDER_2", request.trialEndsAt.plusDays(3)));
        events.add(createEvent(request, "PAYMENT_REMINDER_3", request.trialEndsAt.plusDays(5)));
        
        // 5. SUSPENSION
        events.add(createEvent(request, "SUSPEND_SUBSCRIPTION", request.trialEndsAt.plusDays(7)));
        
        return Flux.fromIterable(events)
                .flatMap(scheduledEventRepository::save)
                .then();
    }

    private ScheduledEventEntity createEvent(BillingInitRequest req, String type, LocalDateTime scheduledAt) {
        return ScheduledEventEntity.builder()
                .tenantId(req.tenantId)
                .subscriptionId(req.subscriptionId)
                .eventType(type)
                .scheduledAt(scheduledAt)
                .status("PENDING")
                .retryCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public static class BillingInitRequest {
        public Long tenantId;
        public Long subscriptionId;
        public LocalDateTime trialEndsAt;
    }
}
