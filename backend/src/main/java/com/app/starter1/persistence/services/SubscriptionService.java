package com.app.starter1.persistence.services;

import com.app.starter1.dto.*;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.entity.rbac.RbacModule;
import com.app.starter1.persistence.repository.*;
import com.app.starter1.persistence.repository.rbac.RbacModuleRepository;
import com.app.starter1.utils.UserMethods;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

        private final SubscriptionRepository subscriptionRepository;
        private final PlanRepository planRepository;
        private final CustomerRepository customerRepository;
        private final RbacModuleRepository rbacModuleRepository;
        private final UserMethods userMethods;

        /**
         * Crea una suscripción para un tenant basada en un plan
         * Copia los módulos y límites del plan, pero permite customización
         */
        @Transactional
        public SubscriptionResponse createSubscriptionFromPlan(SubscriptionCreateRequest request) {
                // Obtener usuario autenticado (opcional para auditoría)
                UserEntity currentUser = null;
                try {
                        currentUser = userMethods.getCurrentUser();
                } catch (IllegalStateException e) {
                        // No hay usuario autenticado, continuar sin usuario
                }

                // Validar Plan
                Plan plan = planRepository.findById(request.planId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Plan no encontrado con ID: " + request.planId()));

                // Validar Customer
                Customer customer = customerRepository.findById(request.tenantId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Customer no encontrado con ID: " + request.tenantId()));

                // Verificar si el customer ya tiene una suscripción activa
                subscriptionRepository.findByCustomerIdAndStatus(request.tenantId(), SubscriptionStatus.ACTIVE)
                                .ifPresent(sub -> {
                                        throw new RuntimeException("El customer ya tiene una suscripción activa. ID: "
                                                        + sub.getId());
                                });

                // Determinar billing cycle
                BillingCycle billingCycle = request.billingCycle() != null ? request.billingCycle()
                                : BillingCycle.MONTHLY;

                // Calcular fechas
                LocalDateTime startDate = LocalDateTime.now();
                LocalDateTime endDate = calculateEndDate(startDate, billingCycle, plan.getDurationDays());

                // Obtener módulos (custom o del plan)
                Set<RbacModule> modules = new HashSet<>();
                if (request.customModuleIds() != null && !request.customModuleIds().isEmpty()) {
                        modules = new HashSet<>(rbacModuleRepository.findAllById(request.customModuleIds()));
                } else if (!plan.getModules().isEmpty()) {
                        modules = new HashSet<>(plan.getModules());
                }

                // Crear suscripción
                Subscription subscription = Subscription.builder()
                                .plan(plan)
                                .customer(customer)
                                .user(currentUser) // Opcional: puede ser null
                                .billingCycle(billingCycle)
                                .startDate(startDate)
                                .endDate(endDate)
                                .status(SubscriptionStatus.ACTIVE)
                                .isAutoRenew(request.isAutoRenew() != null ? request.isAutoRenew() : false)
                                .modules(modules)
                                // Límites customizados
                                .aiTokensLimit(request.customAiTokensLimit())
                                .electronicDocsLimit(request.customElectronicDocsLimit())
                                .usersLimit(request.customUsersLimit())
                                // Precio custom
                                .monthlyPrice(request.customMonthlyPrice())
                                .discountPercent(request.discountPercent())
                                .notes(request.notes())
                                .build();

                Subscription savedSubscription = subscriptionRepository.save(subscription);
                return mapToResponse(savedSubscription);
        }

        /**
         * Obtiene la suscripción activa de un tenant con módulos cargados
         */
        @Transactional(readOnly = true)
        public SubscriptionResponse getActiveTenantSubscription(Long tenantId) {
                Subscription subscription = subscriptionRepository
                                .findActiveTenantSubscriptionWithModules(tenantId)
                                .orElseThrow(() -> new RuntimeException(
                                                "No hay suscripción activa para el tenant: " + tenantId));
                return mapToResponse(subscription);
        }

        /**
         * Obtiene todas las suscripciones de un tenant
         */
        @Transactional(readOnly = true)
        public List<SubscriptionResponse> getTenantSubscriptions(Long tenantId) {
                return subscriptionRepository.findByCustomerId(tenantId).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Actualiza los módulos de una suscripción
         */
        @Transactional
        public SubscriptionResponse updateSubscriptionModules(Long subscriptionId,
                        SubscriptionModulesUpdateRequest request) {
                Subscription subscription = subscriptionRepository.findById(subscriptionId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Suscripción no encontrada: " + subscriptionId));

                Set<RbacModule> newModules = new HashSet<>(
                                rbacModuleRepository.findAllById(request.moduleIds()));

                subscription.setModules(newModules);
                Subscription updated = subscriptionRepository.save(subscription);
                return mapToResponse(updated);
        }

        /**
         * Actualiza los límites de una suscripción
         */
        @Transactional
        public SubscriptionResponse updateSubscriptionLimits(Long subscriptionId,
                        SubscriptionLimitsUpdateRequest request) {
                Subscription subscription = subscriptionRepository.findById(subscriptionId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Suscripción no encontrada: " + subscriptionId));

                subscription.setAiTokensLimit(request.aiTokensLimit());
                subscription.setElectronicDocsLimit(request.electronicDocsLimit());
                subscription.setUsersLimit(request.usersLimit());

                Subscription updated = subscriptionRepository.save(subscription);
                return mapToResponse(updated);
        }

        /**
         * Agrega un módulo adicional a la suscripción
         */
        @Transactional
        public SubscriptionResponse addModuleToSubscription(Long subscriptionId, Long moduleId) {
                Subscription subscription = subscriptionRepository.findById(subscriptionId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Suscripción no encontrada: " + subscriptionId));

                RbacModule module = rbacModuleRepository.findById(moduleId)
                                .orElseThrow(() -> new RuntimeException("Módulo no encontrado: " + moduleId));

                subscription.getModules().add(module);
                Subscription updated = subscriptionRepository.save(subscription);
                return mapToResponse(updated);
        }

        /**
         * Remueve un módulo de la suscripción
         */
        @Transactional
        public SubscriptionResponse removeModuleFromSubscription(Long subscriptionId, Long moduleId) {
                Subscription subscription = subscriptionRepository.findById(subscriptionId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Suscripción no encontrada: " + subscriptionId));

                subscription.getModules().removeIf(m -> m.getId().equals(moduleId));
                Subscription updated = subscriptionRepository.save(subscription);
                return mapToResponse(updated);
        }

        /**
         * Cancela una suscripción
         */
        @Transactional
        public SubscriptionResponse cancelSubscription(Long subscriptionId) {
                Subscription subscription = subscriptionRepository.findById(subscriptionId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Suscripción no encontrada: " + subscriptionId));

                subscription.setStatus(SubscriptionStatus.CANCELLED);
                subscription.setIsAutoRenew(false);

                Subscription updated = subscriptionRepository.save(subscription);
                return mapToResponse(updated);
        }

        /**
         * Renueva una suscripción (crea una nueva basada en la anterior)
         */
        @Transactional
        public SubscriptionResponse renewSubscription(Long subscriptionId) {
                Subscription oldSubscription = subscriptionRepository.findById(subscriptionId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Suscripción no encontrada: " + subscriptionId));

                // Marcar la anterior como expirada
                oldSubscription.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(oldSubscription);

                // Calcular nuevas fechas
                LocalDateTime startDate = LocalDateTime.now();
                LocalDateTime endDate = calculateEndDate(startDate, oldSubscription.getBillingCycle(),
                                oldSubscription.getPlan().getDurationDays());

                // Crear nueva suscripción con los mismos parámetros
                Subscription newSubscription = Subscription.builder()
                                .plan(oldSubscription.getPlan())
                                .customer(oldSubscription.getCustomer())
                                .user(oldSubscription.getUser())
                                .billingCycle(oldSubscription.getBillingCycle())
                                .startDate(startDate)
                                .endDate(endDate)
                                .status(SubscriptionStatus.ACTIVE)
                                .isAutoRenew(oldSubscription.getIsAutoRenew())
                                .modules(new HashSet<>(oldSubscription.getModules()))
                                .aiTokensLimit(oldSubscription.getAiTokensLimit())
                                .electronicDocsLimit(oldSubscription.getElectronicDocsLimit())
                                .usersLimit(oldSubscription.getUsersLimit())
                                .allowOverage(oldSubscription.getAllowOverage())
                                .aiOveragePricePer1k(oldSubscription.getAiOveragePricePer1k())
                                .docOveragePriceUnit(oldSubscription.getDocOveragePriceUnit())
                                .monthlyPrice(oldSubscription.getMonthlyPrice())
                                .discountPercent(oldSubscription.getDiscountPercent())
                                .notes(oldSubscription.getNotes())
                                .build();

                Subscription saved = subscriptionRepository.save(newSubscription);
                return mapToResponse(saved);
        }

        /**
         * Cambia el plan de una suscripción
         */
        @Transactional
        public SubscriptionResponse changePlan(Long subscriptionId, Long newPlanId) {
                Subscription subscription = subscriptionRepository.findById(subscriptionId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Suscripción no encontrada: " + subscriptionId));

                Plan newPlan = planRepository.findById(newPlanId)
                                .orElseThrow(() -> new RuntimeException("Plan no encontrado: " + newPlanId));

                // Actualizar plan y módulos del nuevo plan (si no hay custom)
                subscription.setPlan(newPlan);
                if (subscription.getModules().isEmpty()) {
                        subscription.setModules(new HashSet<>(newPlan.getModules()));
                }

                // Recalcular fecha de fin
                LocalDateTime endDate = calculateEndDate(subscription.getStartDate(),
                                subscription.getBillingCycle(), newPlan.getDurationDays());
                subscription.setEndDate(endDate);

                Subscription updated = subscriptionRepository.save(subscription);
                return mapToResponse(updated);
        }

        /**
         * Obtiene suscripción por ID
         */
        @Transactional(readOnly = true)
        public SubscriptionResponse getSubscriptionById(Long id) {
                Subscription subscription = subscriptionRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada: " + id));
                return mapToResponse(subscription);
        }

        /**
         * Obtiene todas las suscripciones activas
         */
        @Transactional(readOnly = true)
        public List<SubscriptionResponse> getActiveSubscriptions() {
                return subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        // ==================== MÉTODOS PRIVADOS ====================

        private LocalDateTime calculateEndDate(LocalDateTime startDate, BillingCycle cycle, Integer planDurationDays) {
                switch (cycle) {
                        case MONTHLY:
                                return startDate.plusMonths(1);
                        case QUARTERLY:
                                return startDate.plusMonths(3);
                        case SEMI_ANNUAL:
                                return startDate.plusMonths(6);
                        case ANNUAL:
                                return startDate.plusYears(1);
                        case CUSTOM:
                                return startDate.plusDays(planDurationDays != null ? planDurationDays : 30);
                        default:
                                return startDate.plusMonths(1);
                }
        }

        private SubscriptionResponse mapToResponse(Subscription subscription) {
                List<Long> moduleIds = subscription.getModules().stream()
                                .map(RbacModule::getId)
                                .collect(Collectors.toList());

                List<String> moduleNames = subscription.getModules().stream()
                                .map(RbacModule::getName)
                                .collect(Collectors.toList());

                return new SubscriptionResponse(
                                subscription.getId(),
                                subscription.getCustomer().getId(),
                                subscription.getCustomer().getName(),
                                subscription.getPlan().getId(),
                                subscription.getPlan().getName(),
                                subscription.getBillingCycle(),
                                subscription.getStartDate(),
                                subscription.getEndDate(),
                                subscription.getStatus(),
                                subscription.getIsAutoRenew(),
                                moduleIds,
                                moduleNames,
                                subscription.getEffectiveAiTokensLimit(),
                                subscription.getEffectiveElectronicDocsLimit(),
                                subscription.getEffectiveUsersLimit(),
                                subscription.getEffectiveAllowOverage(),
                                subscription.getEffectiveAiOveragePricePer1k(),
                                subscription.getEffectiveDocOveragePriceUnit(),
                                subscription.getMonthlyPrice(),
                                subscription.getDiscountPercent(),
                                subscription.getNotes(),
                                subscription.getCreatedAt(),
                                subscription.getUpdatedAt());
        }
}
