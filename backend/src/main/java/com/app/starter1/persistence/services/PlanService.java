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

    @Transactional
    public PlanResponse createPlan(PlanCreateRequest request) {
        Plan plan = Plan.builder()
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .durationDays(request.durationDays())
                .isActive(true)
                .build();

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

        plan.setName(request.name());
        plan.setDescription(request.description());
        plan.setPrice(request.price());
        plan.setDurationDays(request.durationDays());

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
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }
}
