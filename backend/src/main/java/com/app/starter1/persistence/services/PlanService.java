package com.app.starter1.persistence.services;

import com.app.starter1.dto.PlanCreateRequest;
import com.app.starter1.dto.PlanResponse;
import com.app.starter1.persistence.entity.Plan;
import com.app.starter1.persistence.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {

        private final PlanRepository planRepository;
        private final com.app.starter1.persistence.repository.rbac.RbacModuleRepository moduleRepository;

        @Transactional
        public PlanResponse createPlan(PlanCreateRequest request) {
                // Validar que solo exista un plan gratuito activo
                if (request.isFree() != null && request.isFree()) {
                        Optional<Plan> existingFreePlan = planRepository.findByIsFreeAndIsActive(true, true);
                        if (existingFreePlan.isPresent()) {
                                throw new RuntimeException(
                                                "Ya existe un plan gratuito activo: " + existingFreePlan.get().getName()
                                                                +
                                                                ". Desactívalo antes de crear uno nuevo.");
                        }
                }

                Plan plan = Plan.builder()
                                .name(request.name())
                                .description(request.description())
                                .price(request.price())
                                .durationDays(request.durationDays())
                                .isActive(true)
                                .isFree(request.isFree() != null ? request.isFree() : false)
                                .aiTokensLimit(request.aiTokensLimit())
                                .electronicDocsLimit(request.electronicDocsLimit())
                                .usersLimit(request.usersLimit())
                                .allowOverage(request.allowOverage() != null ? request.allowOverage() : false)
                                .aiOveragePricePer1k(request.aiOveragePricePer1k())
                                .docOveragePriceUnit(request.docOveragePriceUnit())
                                .build();

                if (request.moduleIds() != null && !request.moduleIds().isEmpty()) {
                        java.util.Set<com.app.starter1.persistence.entity.rbac.RbacModule> modules = new java.util.HashSet<>(
                                        moduleRepository.findAllById(request.moduleIds()));
                        plan.setModules(modules);
                }

                Plan savedPlan = planRepository.save(plan);
                return mapToResponse(savedPlan);
        }

        @Transactional(readOnly = true)
        public PlanResponse getPlanById(Long id) {
                Plan plan = planRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Plan no encontrado con ID: " + id));
                return mapToResponse(plan);
        }

        @Transactional(readOnly = true)
        public List<PlanResponse> getAllActivePlans() {
                return planRepository.findByIsActiveTrue().stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<PlanResponse> getAllPlans() {
                return planRepository.findAll().stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        @Transactional
        public PlanResponse updatePlan(Long id, PlanCreateRequest request) {
                Plan plan = planRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Plan no encontrado con ID: " + id));

                // Validar que solo exista un plan gratuito activo
                if (request.isFree() != null && request.isFree() && plan.getIsActive()) {
                        Optional<Plan> existingFreePlan = planRepository.findByIsFreeAndIsActive(true, true);
                        if (existingFreePlan.isPresent() && !existingFreePlan.get().getId().equals(id)) {
                                throw new RuntimeException(
                                                "Ya existe un plan gratuito activo: " + existingFreePlan.get().getName()
                                                                +
                                                                ". Desactívalo antes de activar este como gratuito.");
                        }
                }

                plan.setName(request.name());
                plan.setDescription(request.description());
                plan.setPrice(request.price());
                plan.setDurationDays(request.durationDays());
                plan.setIsFree(request.isFree() != null ? request.isFree() : false);
                plan.setAiTokensLimit(request.aiTokensLimit());
                plan.setElectronicDocsLimit(request.electronicDocsLimit());
                plan.setUsersLimit(request.usersLimit());
                plan.setAllowOverage(request.allowOverage() != null ? request.allowOverage() : false);
                plan.setAiOveragePricePer1k(request.aiOveragePricePer1k());
                plan.setDocOveragePriceUnit(request.docOveragePriceUnit());

                if (request.moduleIds() != null) {
                        java.util.Set<com.app.starter1.persistence.entity.rbac.RbacModule> modules = new java.util.HashSet<>(
                                        moduleRepository.findAllById(request.moduleIds()));
                        plan.setModules(modules);
                }

                Plan updatedPlan = planRepository.save(plan);
                return mapToResponse(updatedPlan);
        }

        @Transactional
        public void deletePlan(Long id) {
                if (!planRepository.existsById(id)) {
                        throw new RuntimeException("Plan no encontrado con ID: " + id);
                }
                planRepository.deleteById(id);
        }

        @Transactional
        public PlanResponse togglePlanStatus(Long id) {
                Plan plan = planRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Plan no encontrado con ID: " + id));

                plan.setIsActive(!plan.getIsActive());
                Plan updatedPlan = planRepository.save(plan);
                return mapToResponse(updatedPlan);
        }

        private PlanResponse mapToResponse(Plan plan) {
                return new PlanResponse(
                                plan.getId(),
                                plan.getName(),
                                plan.getDescription(),
                                plan.getPrice(),
                                plan.getDurationDays(),
                                plan.getIsActive(),
                                plan.getIsFree(),
                                plan.getCreatedAt(),
                                plan.getUpdatedAt(),
                                plan.getAiTokensLimit(),
                                plan.getElectronicDocsLimit(),
                                plan.getUsersLimit(),
                                plan.getAllowOverage(),
                                plan.getAiOveragePricePer1k(),
                                plan.getDocOveragePriceUnit(),
                                plan.getModules() != null ? plan.getModules().stream()
                                                .map(com.app.starter1.persistence.entity.rbac.RbacModule::getId)
                                                .collect(Collectors.toSet())
                                                : java.util.Collections.emptySet(),
                                plan.getModules() != null ? plan.getModules().stream()
                                                .map(com.app.starter1.persistence.entity.rbac.RbacModule::getName)
                                                .collect(Collectors.toList())
                                                : java.util.Collections.emptyList());
        }
}
