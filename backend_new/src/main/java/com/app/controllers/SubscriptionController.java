package com.app.controllers;

import com.app.dto.SubscriptionResponse;
import com.app.persistence.entity.SubscriptionEntity;
import com.app.persistence.entity.SubscriptionModuleEntity;
import com.app.persistence.entity.PlanEntity;
import com.app.persistence.entity.TenantEntity;
import com.app.persistence.entity.ModuleEntity;
import com.app.persistence.repository.*;
import lombok.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionModuleRepository subscriptionModuleRepository;
    private final PlanRepository planRepository;
    private final ModuleRepository moduleRepository;
    private final TenantRepository tenantRepository;

    @GetMapping
    public Flux<SubscriptionResponse> getAllSubscriptions() {
        log.info("GET /api/v1/subscriptions - Returning list of subscriptions");
        return subscriptionRepository.findAll()
                .flatMap(this::mapToResponse);
    }

    @GetMapping("/tenant/{tenantId}/active")
    public Mono<ResponseEntity<SubscriptionResponse>> getActiveTenantSubscription(@PathVariable Long tenantId) {
        // En este sistema, tenantId se mapea a customerId en la base de datos
        return subscriptionRepository.findActiveOrTrialSubscription(tenantId)
                .flatMap(this::mapToResponse)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<SubscriptionResponse>> getSubscriptionById(@PathVariable Long id) {
        log.info("GET /api/v1/subscriptions/{} - Fetching subscription", id);
        return subscriptionRepository.findById(id)
                .flatMap(this::mapToResponse)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<SubscriptionResponse>> createSubscription(@RequestBody SubscriptionResponse request) {
        log.info("POST /api/v1/subscriptions - Creating subscription for tenant: {}", request.getTenantId());
        
        return planRepository.findById(request.getPlanId())
                .flatMap(plan -> {
                    SubscriptionEntity entity = SubscriptionEntity.builder()
                            .planId(plan.getId())
                            .customerId(request.getTenantId())
                            .status("ACTIVE")
                            .billingCycle(request.getBillingCycle() != null ? request.getBillingCycle() : "MONTHLY")
                            .startDate(LocalDateTime.now())
                            .endDate(LocalDateTime.now().plusDays(plan.getDurationDays() != null ? plan.getDurationDays() : 30))
                            .aiTokensLimit(request.getEffectiveAiTokensLimit())
                            .usersLimit(request.getEffectiveUsersLimit())
                            .monthlyPrice(request.getMonthlyPrice() != null ? request.getMonthlyPrice() : plan.getPrice())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    
                    return subscriptionRepository.save(entity)
                            .flatMap(savedSub -> {
                                // If no custom modules provided, copy from plan
                                if (request.getModuleIds() == null || request.getModuleIds().isEmpty()) {
                                    return planModuleRepository.findByPlanId(plan.getId())
                                            .map(pm -> SubscriptionModuleEntity.builder()
                                                    .subscriptionId(savedSub.getId())
                                                    .moduleId(pm.getModuleId())
                                                    .build())
                                            .flatMap(pm -> subscriptionModuleRepository.insertModule(savedSub.getId(), pm.getModuleId()))
                                            .then(Mono.just(savedSub));
                                } else {
                                    return Flux.fromIterable(request.getModuleIds())
                                            .flatMap(mid -> subscriptionModuleRepository.insertModule(savedSub.getId(), mid))
                                            .then(Mono.just(savedSub));
                                }
                            });
                })
                .flatMap(this::mapToResponse)
                .map(ResponseEntity::ok);
    }

    private final PlanModuleRepository planModuleRepository;

    @PutMapping("/{id}")
    public Mono<ResponseEntity<SubscriptionResponse>> updateSubscription(@PathVariable Long id,
            @RequestBody SubscriptionResponse request) {
        log.info("PUT /api/v1/subscriptions/{} - Updating subscription", id);
        return subscriptionRepository.findById(id)
                .flatMap(existing -> {
                    existing.setStatus(request.getStatus());
                    existing.setEndDate(request.getEndDate());
                    existing.setAiTokensLimit(request.getEffectiveAiTokensLimit());
                    existing.setUsersLimit(request.getEffectiveUsersLimit());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return subscriptionRepository.save(existing);
                })
                .flatMap(savedSub -> {
                    if (request.getModuleIds() != null) {
                        return subscriptionModuleRepository.deleteBySubscriptionId(id)
                                .thenMany(Flux.fromIterable(request.getModuleIds()))
                                .flatMap(mid -> subscriptionModuleRepository.insertModule(id, mid))
                                .then(Mono.just(savedSub));
                    }
                    return Mono.just(savedSub);
                })
                .flatMap(this::mapToResponse)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteSubscription(@PathVariable Long id) {
        log.info("DELETE /api/v1/subscriptions/{} - Deleting subscription", id);
        return subscriptionRepository.deleteById(id)
                .then(subscriptionModuleRepository.deleteBySubscriptionId(id).then())
                .thenReturn(ResponseEntity.noContent().<Void>build());
    }

    @PatchMapping("/{id}/modules")
    public Mono<ResponseEntity<SubscriptionResponse>> updateModules(@PathVariable Long id, @RequestBody ModulesUpdateRequest request) {
        log.info("PATCH /api/v1/subscriptions/{}/modules - Updating modules", id);
        return subscriptionRepository.findById(id)
                .flatMap(existing -> {
                    existing.setUpdatedAt(LocalDateTime.now());
                    return subscriptionRepository.save(existing);
                })
                .flatMap(savedSub -> {
                    if (request.getModuleIds() != null) {
                        return subscriptionModuleRepository.deleteBySubscriptionId(id)
                                .thenMany(Flux.fromIterable(request.getModuleIds()))
                                .flatMap(mid -> subscriptionModuleRepository.insertModule(id, mid))
                                .then(Mono.just(savedSub));
                    }
                    return Mono.just(savedSub);
                })
                .flatMap(this::mapToResponse)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/limits")
    public Mono<ResponseEntity<SubscriptionResponse>> updateLimits(@PathVariable Long id, @RequestBody LimitsUpdateRequest request) {
        log.info("PATCH /api/v1/subscriptions/{}/limits - Updating limits", id);
        return subscriptionRepository.findById(id)
                .flatMap(existing -> {
                    existing.setAiTokensLimit(request.getAiTokensLimit());
                    existing.setElectronicDocsLimit(request.getElectronicDocsLimit());
                    existing.setUsersLimit(request.getUsersLimit());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return subscriptionRepository.save(existing);
                })
                .flatMap(this::mapToResponse)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/cancel")
    public Mono<ResponseEntity<SubscriptionResponse>> cancelSubscription(@PathVariable Long id) {
        log.info("PATCH /api/v1/subscriptions/{}/cancel - Canceling subscription", id);
        return subscriptionRepository.findById(id)
                .flatMap(existing -> {
                    existing.setStatus("CANCELLED");
                    existing.setIsAutoRenew(false);
                    existing.setUpdatedAt(LocalDateTime.now());
                    return subscriptionRepository.save(existing);
                })
                .flatMap(this::mapToResponse)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-auto-renew")
    public Mono<ResponseEntity<SubscriptionResponse>> toggleAutoRenew(@PathVariable Long id) {
        log.info("PATCH /api/v1/subscriptions/{}/toggle-auto-renew - Toggling auto-renew", id);
        return subscriptionRepository.findById(id)
                .flatMap(existing -> {
                    existing.setIsAutoRenew(existing.getIsAutoRenew() == null ? true : !existing.getIsAutoRenew());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return subscriptionRepository.save(existing);
                })
                .flatMap(this::mapToResponse)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/renew")
    public Mono<ResponseEntity<SubscriptionResponse>> renewSubscription(@PathVariable Long id) {
        log.info("POST /api/v1/subscriptions/{}/renew - Renewing subscription", id);
        return subscriptionRepository.findById(id)
                .flatMap(oldSub -> {
                    SubscriptionEntity entity = SubscriptionEntity.builder()
                            .planId(oldSub.getPlanId())
                            .customerId(oldSub.getCustomerId())
                            .userId(oldSub.getUserId())
                            .status("ACTIVE")
                            .billingCycle(oldSub.getBillingCycle() != null ? oldSub.getBillingCycle() : "MONTHLY")
                            .startDate(LocalDateTime.now())
                            .endDate(LocalDateTime.now().plusDays(30))
                            .isAutoRenew(oldSub.getIsAutoRenew())
                            .aiTokensLimit(oldSub.getAiTokensLimit())
                            .electronicDocsLimit(oldSub.getElectronicDocsLimit())
                            .usersLimit(oldSub.getUsersLimit())
                            .allowOverage(oldSub.getAllowOverage())
                            .aiOveragePricePer1k(oldSub.getAiOveragePricePer1k())
                            .docOveragePriceUnit(oldSub.getDocOveragePriceUnit())
                            .monthlyPrice(oldSub.getMonthlyPrice())
                            .discountPercent(oldSub.getDiscountPercent())
                            .notes("Renovación de suscripción " + id)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return subscriptionRepository.save(entity)
                            .flatMap(savedSub -> {
                                return subscriptionModuleRepository.findBySubscriptionId(oldSub.getId())
                                        .flatMap(sm -> subscriptionModuleRepository.insertModule(savedSub.getId(), sm.getModuleId()))
                                        .then(Mono.just(savedSub));
                            });
                })
                .flatMap(this::mapToResponse)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    private Mono<SubscriptionResponse> mapToResponse(SubscriptionEntity entity) {
        return Mono.zip(
                planRepository.findById(entity.getPlanId()).defaultIfEmpty(new PlanEntity()),
                tenantRepository.findById(entity.getCustomerId()).defaultIfEmpty(new TenantEntity()),
                subscriptionModuleRepository.findBySubscriptionId(entity.getId())
                        .flatMap(sm -> moduleRepository.findById(sm.getModuleId()))
                        .collectList()
        ).map(tuple -> {
            PlanEntity plan = tuple.getT1();
            TenantEntity tenant = tuple.getT2();
            List<ModuleEntity> modules = tuple.getT3();

            return SubscriptionResponse.builder()
                    .id(entity.getId())
                    .tenantId(entity.getCustomerId())
                    .tenantName(tenant.getName())
                    .planId(entity.getPlanId())
                    .planName(plan.getName())
                    .billingCycle(entity.getBillingCycle())
                    .startDate(entity.getStartDate())
                    .endDate(entity.getEndDate())
                    .status(entity.getStatus())
                    .isAutoRenew(entity.getIsAutoRenew())
                    .moduleIds(modules.stream().map(m -> m.getId()).collect(Collectors.toList()))
                    .moduleNames(modules.stream().map(m -> m.getName()).collect(Collectors.toList()))
                    .effectiveAiTokensLimit(entity.getAiTokensLimit() != null ? entity.getAiTokensLimit() : plan.getAiTokensLimit())
                    .effectiveUsersLimit(entity.getUsersLimit() != null ? entity.getUsersLimit() : plan.getUsersLimit())
                    .monthlyPrice(entity.getMonthlyPrice() != null ? entity.getMonthlyPrice() : plan.getPrice())
                    .discountPercent(entity.getDiscountPercent())
                    .notes(entity.getNotes())
                    .createdAt(entity.getCreatedAt())
                    .updatedAt(entity.getUpdatedAt())
                    .build();
        });
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModulesUpdateRequest {
        private List<Long> moduleIds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LimitsUpdateRequest {
        private Long aiTokensLimit;
        private Integer electronicDocsLimit;
        private Integer usersLimit;
    }
}

