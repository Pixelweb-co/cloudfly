package com.app.controllers;

import lombok.extern.slf4j.Slf4j;

import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/plans")
@Slf4j
public class PlanController {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanDto {
        private Long id;
        private String name;
        private String description;
        private BigDecimal price;
        private String cycle;
        private List<String> features;
    }

    @GetMapping
    public Flux<PlanDto> getAllPlans() {
        return Flux.just(
                PlanDto.builder().id(1L).name("Básico").description("Para pequeñas empresas")
                        .price(new BigDecimal("29.99")).cycle("MONTHLY").features(List.of("1 usuario", "100 facturas"))
                        .build(),
                PlanDto.builder().id(2L).name("Premium").description("Para empresas en crecimiento")
                        .price(new BigDecimal("99.99")).cycle("MONTHLY")
                        .features(List.of("10 usuarios", "1000 facturas", "AI Token 1M")).build());
    }

    @PostMapping
    public Mono<ResponseEntity<PlanDto>> createPlan(@RequestBody PlanDto plan) {
        log.info("Creando plan: {}", plan.getName());
        plan.setId(System.currentTimeMillis());
        return Mono.just(ResponseEntity.ok(plan));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<PlanDto>> updatePlan(@PathVariable Long id, @RequestBody PlanDto plan) {
        log.info("Actualizando plan {}: {}", id, plan.getName());
        plan.setId(id);
        return Mono.just(ResponseEntity.ok(plan));
    }

    @GetMapping("/active")
    public Flux<PlanDto> getAllActivePlans() {
        return Flux.just(
                PlanDto.builder().id(1L).name("Básico").description("Para pequeñas empresas")
                        .price(new BigDecimal("29.99")).cycle("MONTHLY").features(List.of("1 usuario", "100 facturas"))
                        .build());
    }

    @PatchMapping("/{id}/toggle-status")
    public Mono<ResponseEntity<PlanDto>> togglePlanStatus(@PathVariable Long id) {
        log.info("Cambiando estado del plan: {}", id);
        return Mono.just(ResponseEntity.ok(PlanDto.builder().id(id).name("Plan " + id).active(true).build()));
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanDto {
        private Long id;
        private String name;
        private String description;
        private BigDecimal price;
        private String cycle;
        private List<String> features;
        private boolean active;
    }
}
