package com.app.starter1.controllers;

import com.app.starter1.dto.SubscriptionCreateRequest;
import com.app.starter1.dto.SubscriptionResponse;
import com.app.starter1.persistence.entity.SubscriptionStatus;

import com.app.starter1.persistence.services.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/users/{userId}/subscribe")
    public ResponseEntity<SubscriptionResponse> subscribeToPlan(
            @PathVariable Long userId,
            @Valid @RequestBody SubscriptionCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subscriptionService.subscribeToPlan(userId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubscriptionResponse> getSubscriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<SubscriptionResponse>> getUserSubscriptions(@PathVariable Long userId) {
        return ResponseEntity.ok(subscriptionService.getUserSubscriptions(userId));
    }

    @GetMapping("/users/{userId}/active")
    public ResponseEntity<SubscriptionResponse> getActiveSubscription(@PathVariable Long userId) {
        return ResponseEntity.ok(subscriptionService.getActiveSubscription(userId));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<SubscriptionResponse> cancelSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(id));
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<SubscriptionResponse> renewSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.renewSubscription(id));
    }

    @PatchMapping("/{id}/change-plan/{planId}")
    public ResponseEntity<SubscriptionResponse> changePlan(
            @PathVariable Long id,
            @PathVariable Long planId) {
        return ResponseEntity.ok(subscriptionService.changePlan(id, planId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<SubscriptionResponse>> getSubscriptionsByStatus(
            @PathVariable SubscriptionStatus status) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionsByStatus(status));
    }
}
