package com.app.controllers;

import com.app.dto.SubscriptionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    @GetMapping
    public Flux<SubscriptionResponse> getAllSubscriptions() {
        log.info("GET /api/v1/subscriptions - Returning list of subscriptions");
        return Flux.just(
                createMockSubscription(1L, 100L, "Tenant A", "ACTIVE"),
                createMockSubscription(2L, 101L, "Tenant B", "PENDING"));
    }

    @PostMapping
    public Mono<ResponseEntity<SubscriptionResponse>> createSubscription(@RequestBody SubscriptionResponse request) {
        log.info("POST /api/v1/subscriptions - Creating subscription for tenant: {}", request.getTenantId());
        request.setId(System.currentTimeMillis());
        request.setStatus("ACTIVE");
        return Mono.just(ResponseEntity.ok(request));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<SubscriptionResponse>> updateSubscription(@PathVariable Long id,
            @RequestBody SubscriptionResponse request) {
        log.info("PUT /api/v1/subscriptions/{} - Updating subscription", id);
        request.setId(id);
        return Mono.just(ResponseEntity.ok(request));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteSubscription(@PathVariable Long id) {
        log.info("DELETE /api/v1/subscriptions/{} - Deleting subscription", id);
        return Mono.just(ResponseEntity.noContent().build());
    }

    private SubscriptionResponse createMockSubscription(Long id, Long tenantId, String tenantName, String status) {
        return SubscriptionResponse.builder()
                .id(id)
                .tenantId(tenantId)
                .tenantName(tenantName)
                .planId(1L)
                .planName("Premium Plan")
                .billingCycle("MONTHLY")
                .startDate(LocalDateTime.now().minusMonths(1))
                .endDate(LocalDateTime.now().plusMonths(11))
                .status(status)
                .moduleIds(List.of(1L, 2L, 3L))
                .moduleNames(List.of("DASHBOARD", "SALES", "ACCOUNTING"))
                .effectiveUsersLimit(10)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
