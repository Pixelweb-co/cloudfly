package com.app.controllers;

import com.app.dto.SubscriptionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    @GetMapping("/tenant/{tenantId}/active")
    public Mono<ResponseEntity<SubscriptionResponse>> getActiveTenantSubscription(@PathVariable Long tenantId) {
        log.info("GET /api/v1/subscriptions/tenant/{}/active - Returning mock active subscription", tenantId);

        SubscriptionResponse mockResponse = SubscriptionResponse.builder()
                .id(1L)
                .tenantId(tenantId)
                .tenantName("Cloudfly Master")
                .planId(1L)
                .planName("Premium Plan")
                .billingCycle("MONTHLY")
                .startDate(LocalDateTime.now().minusMonths(1))
                .endDate(LocalDateTime.now().plusMonths(11))
                .status("ACTIVE")
                .isAutoRenew(true)
                .moduleIds(List.of(1L, 2L, 3L, 4L, 5L))
                .moduleNames(List.of("DASHBOARD", "SALES", "ACCOUNTING", "HR", "REPORTS"))
                .effectiveAiTokensLimit(1000000L)
                .effectiveElectronicDocsLimit(1000)
                .effectiveUsersLimit(10)
                .effectiveAllowOverage(true)
                .monthlyPrice(new BigDecimal("99.99"))
                .discountPercent(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .build();

        return Mono.just(ResponseEntity.ok(mockResponse));
    }
}
