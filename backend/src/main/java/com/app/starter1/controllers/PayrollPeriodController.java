package com.app.starter1.controllers;

import com.app.starter1.dto.hr.PayrollPeriodDTO;
import com.app.starter1.services.PayrollPeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hr/periods")
@RequiredArgsConstructor
public class PayrollPeriodController {

    private final PayrollPeriodService periodService;

    @GetMapping
    public ResponseEntity<Page<PayrollPeriodDTO>> getAllPeriods(
            @RequestParam Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "year", "periodNumber"));
        Page<PayrollPeriodDTO> periods = periodService.getAllPeriods(customerId, pageable);

        return ResponseEntity.ok(periods);
    }

    @GetMapping("/current")
    public ResponseEntity<PayrollPeriodDTO> getCurrentPeriod(@RequestParam Long customerId) {
        PayrollPeriodDTO current = periodService.getCurrentPeriod(customerId);
        if (current == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(current);
    }

    @GetMapping("/has-open")
    public ResponseEntity<Map<String, Boolean>> hasOpenPeriod(@RequestParam Long customerId) {
        boolean hasOpen = periodService.hasOpenPeriod(customerId);
        return ResponseEntity.ok(Map.of("hasOpen", hasOpen));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PayrollPeriodDTO> getPeriodById(
            @PathVariable Long id,
            @RequestParam Long customerId) {
        PayrollPeriodDTO period = periodService.getPeriodById(id, customerId);
        return ResponseEntity.ok(period);
    }

    @PostMapping
    public ResponseEntity<?> createPeriod(
            @RequestBody PayrollPeriodDTO dto,
            @RequestParam Long customerId) {
        try {
            PayrollPeriodDTO created = periodService.createPeriod(dto, customerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePeriod(
            @PathVariable Long id,
            @RequestBody PayrollPeriodDTO dto,
            @RequestParam Long customerId) {
        try {
            PayrollPeriodDTO updated = periodService.updatePeriod(id, dto, customerId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updatePeriodStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam Long customerId) {
        periodService.updatePeriodStatus(id, status, customerId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePeriod(
            @PathVariable Long id,
            @RequestParam Long customerId) {
        try {
            periodService.deletePeriod(id, customerId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
