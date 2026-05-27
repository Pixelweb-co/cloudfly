package com.app.starter1.controllers;

import com.app.starter1.dto.PlanCreateRequest;
import com.app.starter1.dto.PlanResponse;
import com.app.starter1.persistence.services.PlanService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @PostMapping
    public ResponseEntity<PlanResponse> createPlan(@Valid @RequestBody PlanCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planService.createPlan(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanResponse> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(planService.getPlanById(id));
    }

    @GetMapping("/active")
    public ResponseEntity<List<PlanResponse>> getAllActivePlans() {
        return ResponseEntity.ok(planService.getAllActivePlans());
    }

    @GetMapping
    public ResponseEntity<List<PlanResponse>> getAllPlans() {
        return ResponseEntity.ok(planService.getAllPlans());
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanResponse> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody PlanCreateRequest request) {
        return ResponseEntity.ok(planService.updatePlan(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<PlanResponse> togglePlanStatus(@PathVariable Long id) {
        return ResponseEntity.ok(planService.togglePlanStatus(id));
    }
}
