package com.app.starter1.controllers;

import com.app.starter1.dto.*;
import com.app.starter1.persistence.services.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    /**
     * Create a new subscription for a tenant from a plan
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SubscriptionResponse> createSubscription(
            @Valid @RequestBody SubscriptionCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subscriptionService.createSubscriptionFromPlan(request));
    }

    /**
     * Get subscription by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SubscriptionResponse> getSubscriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
    }

    /**
     * Get active subscription for a tenant
     */
    @GetMapping("/tenant/{tenantId}/active")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<SubscriptionResponse> getActiveTenantSubscription(@PathVariable Long tenantId) {
        return ResponseEntity.ok(subscriptionService.getActiveTenantSubscription(tenantId));
    }

    /**
     * Get all subscriptions for a tenant
     */
    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<List<SubscriptionResponse>> getTenantSubscriptions(@PathVariable Long tenantId) {
        return ResponseEntity.ok(subscriptionService.getTenantSubscriptions(tenantId));
    }

    /**
     * Update subscription modules
     */
    @PatchMapping("/{id}/modules")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SubscriptionResponse> updateModules(
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionModulesUpdateRequest request) {
        return ResponseEntity.ok(subscriptionService.updateSubscriptionModules(id, request));
    }

    /**
     * Update subscription limits
     */
    @PatchMapping("/{id}/limits")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SubscriptionResponse> updateLimits(
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionLimitsUpdateRequest request) {
        return ResponseEntity.ok(subscriptionService.updateSubscriptionLimits(id, request));
    }

    /**
     * Add a module to subscription
     */
    @PostMapping("/{id}/modules/{moduleId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SubscriptionResponse> addModule(
            @PathVariable Long id,
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(subscriptionService.addModuleToSubscription(id, moduleId));
    }

    /**
     * Remove a module from subscription
     */
    @DeleteMapping("/{id}/modules/{moduleId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SubscriptionResponse> removeModule(
            @PathVariable Long id,
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(subscriptionService.removeModuleFromSubscription(id, moduleId));
    }

    /**
     * Cancel a subscription
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SubscriptionResponse> cancelSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(id));
    }

    /**
     * Renew a subscription
     */
    @PostMapping("/{id}/renew")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SubscriptionResponse> renewSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.renewSubscription(id));
    }

    /**
     * Change subscription plan
     */
    @PatchMapping("/{id}/change-plan/{planId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<SubscriptionResponse> changePlan(
            @PathVariable Long id,
            @PathVariable Long planId) {
        return ResponseEntity.ok(subscriptionService.changePlan(id, planId));
    }

    /**
     * Get all active subscriptions
     */
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<List<SubscriptionResponse>> getActiveSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getActiveSubscriptions());
    }
}
