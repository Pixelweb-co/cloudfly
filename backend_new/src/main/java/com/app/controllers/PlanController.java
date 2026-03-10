package com.app.controllers;

import com.app.persistence.entity.PlanEntity;
import com.app.persistence.entity.PlanModuleEntity;
import com.app.persistence.repository.ModuleRepository;
import com.app.persistence.repository.PlanModuleRepository;
import com.app.persistence.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/plans")
@Slf4j
@RequiredArgsConstructor
public class PlanController {

    private final PlanRepository planRepository;
    private final PlanModuleRepository planModuleRepository;
    private final ModuleRepository moduleRepository;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanDto {
        private Long id;
        private String name;
        private String description;
        private BigDecimal price;
        private Integer durationDays;
        private List<Long> moduleIds;
        private List<String> moduleNames;
        private boolean active;
        private boolean isFree;
        private Integer usersLimit;
        private Long aiTokensLimit;
    }

    @GetMapping
    public Flux<PlanDto> getAllPlans() {
        log.info("Obteniendo todos los planes");
        return planRepository.findAll()
                .flatMap(plan -> {
                    log.info("Mapeando plan: {}", plan.getName());
                    return mapToDto(plan);
                });
    }

    @GetMapping("/active")
    public Flux<PlanDto> getAllActivePlans() {
        return planRepository.findByIsActiveTrue()
                .flatMap(this::mapToDto);
    }

    @PostMapping
    public Mono<ResponseEntity<PlanDto>> createPlan(@RequestBody PlanDto planDto) {
        log.info("Creando plan: {}", planDto.getName());
        PlanEntity entity = mapToEntity(planDto);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        
        return planRepository.save(entity)
                .flatMap(savedPlan -> {
                    if (planDto.getModuleIds() != null && !planDto.getModuleIds().isEmpty()) {
                        List<PlanModuleEntity> relations = planDto.getModuleIds().stream()
                                .map(mid -> PlanModuleEntity.builder()
                                        .planId(savedPlan.getId())
                                        .moduleId(mid)
                                        .build())
                                .collect(Collectors.toList());
                        return planModuleRepository.saveAll(relations).then(Mono.just(savedPlan));
                    }
                    return Mono.just(savedPlan);
                })
                .flatMap(this::mapToDto)
                .map(ResponseEntity::ok);
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<PlanDto>> updatePlan(@PathVariable Long id, @RequestBody PlanDto planDto) {
        log.info("Actualizando plan {}: {}", id, planDto.getName());
        return planRepository.findById(id)
                .flatMap(existing -> {
                    PlanEntity updated = mapToEntity(planDto);
                    updated.setId(id);
                    updated.setUpdatedAt(LocalDateTime.now());
                    updated.setCreatedAt(existing.getCreatedAt());
                    return planRepository.save(updated);
                })
                .flatMap(savedPlan -> {
                    return planModuleRepository.deleteByPlanId(id)
                            .thenMany(Flux.fromIterable(planDto.getModuleIds() != null ? planDto.getModuleIds() : List.of()))
                            .flatMap(mid -> planModuleRepository.save(PlanModuleEntity.builder()
                                    .planId(id)
                                    .moduleId(mid)
                                    .build()))
                            .then(Mono.just(savedPlan));
                })
                .flatMap(this::mapToDto)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-status")
    public Mono<ResponseEntity<PlanDto>> togglePlanStatus(@PathVariable Long id) {
        log.info("Cambiando estado del plan: {}", id);
        return planRepository.findById(id)
                .flatMap(plan -> {
                    plan.setIsActive(!plan.getIsActive());
                    plan.setUpdatedAt(LocalDateTime.now());
                    return planRepository.save(plan);
                })
                .flatMap(this::mapToDto)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    private Mono<PlanDto> mapToDto(PlanEntity entity) {
        log.debug("Mapeando DTO para plan ID: {}", entity.getId());
        return planModuleRepository.findByPlanId(entity.getId())
                .flatMap(pm -> moduleRepository.findById(pm.getModuleId())
                        .defaultIfEmpty(null))
                .filter(m -> m != null)
                .collectList()
                .flatMap(modules -> {
                    log.debug("Plan {} tiene {} módulos", entity.getId(), modules.size());
                    return Mono.just(PlanDto.builder()
                        .id(entity.getId())
                        .name(entity.getName())
                        .description(entity.getDescription())
                        .price(entity.getPrice() != null ? entity.getPrice() : BigDecimal.ZERO)
                        .durationDays(entity.getDurationDays())
                        .active(entity.getIsActive() != null && entity.getIsActive())
                        .isFree(entity.getIsFree() != null && entity.getIsFree())
                        .usersLimit(entity.getUsersLimit())
                        .aiTokensLimit(entity.getAiTokensLimit())
                        .moduleIds(modules.stream().map(m -> m.getId()).collect(Collectors.toList()))
                        .moduleNames(modules.stream().map(m -> m.getName()).collect(Collectors.toList()))
                        .build());
                });
    }

    private PlanEntity mapToEntity(PlanDto dto) {
        return PlanEntity.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .durationDays(dto.getDurationDays())
                .isActive(dto.isActive())
                .isFree(dto.isFree())
                .usersLimit(dto.getUsersLimit())
                .aiTokensLimit(dto.getAiTokensLimit())
                .build();
    }
}

