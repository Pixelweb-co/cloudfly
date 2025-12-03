package com.app.starter1.persistence.services;

import com.app.starter1.dto.SubscriptionCreateRequest;
import com.app.starter1.dto.SubscriptionResponse;
import com.app.starter1.persistence.entity.Plan;
import com.app.starter1.persistence.entity.Subscription;
import com.app.starter1.persistence.entity.SubscriptionStatus;
import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.repository.PlanRepository;
import com.app.starter1.persistence.repository.SubscriptionRepository;
import com.app.starter1.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final UserRepository userRepository;

    @Transactional
    public SubscriptionResponse subscribeToPlan(Long userId, SubscriptionCreateRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + userId));

        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new RuntimeException("Plan no encontrado con ID: " + request.planId()));

        // Verificar si el usuario ya tiene una suscripción activa
        subscriptionRepository.findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)
                .ifPresent(sub -> {
                    throw new RuntimeException("El usuario ya tiene una suscripción activa");
                });

        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = startDate.plusDays(plan.getDurationDays());

        Subscription subscription = Subscription.builder()
                .user(user)
                .plan(plan)
                .startDate(startDate)
                .endDate(endDate)
                .status(SubscriptionStatus.ACTIVE)
                .isAutoRenew(request.isAutoRenew() != null ? request.isAutoRenew() : false)
                .build();

        Subscription savedSubscription = subscriptionRepository.save(subscription);
        return mapToResponse(savedSubscription);
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscriptionById(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada con ID: " + id));
        return mapToResponse(subscription);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> getUserSubscriptions(Long userId) {
        return subscriptionRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getActiveSubscription(Long userId) {
        Subscription subscription = subscriptionRepository.findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No hay suscripción activa para el usuario: " + userId));
        return mapToResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse cancelSubscription(Long subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada con ID: " + subscriptionId));

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setIsAutoRenew(false);

        Subscription updatedSubscription = subscriptionRepository.save(subscription);
        return mapToResponse(updatedSubscription);
    }

    @Transactional
    public SubscriptionResponse renewSubscription(Long subscriptionId) {
        Subscription oldSubscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada con ID: " + subscriptionId));

        // Marcar la suscripción anterior como expirada
        oldSubscription.setStatus(SubscriptionStatus.EXPIRED);
        subscriptionRepository.save(oldSubscription);

        // Crear nueva suscripción
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = startDate.plusDays(oldSubscription.getPlan().getDurationDays());

        Subscription newSubscription = Subscription.builder()
                .user(oldSubscription.getUser())
                .plan(oldSubscription.getPlan())
                .startDate(startDate)
                .endDate(endDate)
                .status(SubscriptionStatus.ACTIVE)
                .isAutoRenew(oldSubscription.getIsAutoRenew())
                .build();

        Subscription savedSubscription = subscriptionRepository.save(newSubscription);
        return mapToResponse(savedSubscription);
    }

    @Transactional
    public SubscriptionResponse changePlan(Long subscriptionId, Long newPlanId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada con ID: " + subscriptionId));

        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado con ID: " + newPlanId));

        subscription.setPlan(newPlan);
        subscription.setEndDate(LocalDateTime.now().plusDays(newPlan.getDurationDays()));

        Subscription updatedSubscription = subscriptionRepository.save(subscription);
        return mapToResponse(updatedSubscription);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponse> getSubscriptionsByStatus(SubscriptionStatus status) {
        return subscriptionRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private SubscriptionResponse mapToResponse(Subscription subscription) {
        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getUser().getId(),
                subscription.getUser().getUsername(),
                subscription.getPlan().getId(),
                subscription.getPlan().getName(),
                subscription.getStartDate(),
                subscription.getEndDate(),
                subscription.getStatus(),
                subscription.getIsAutoRenew(),
                subscription.getCreatedAt(),
                subscription.getUpdatedAt()
        );
    }
}
