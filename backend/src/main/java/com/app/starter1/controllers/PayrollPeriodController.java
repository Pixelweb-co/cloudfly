package com.app.starter1.controllers;

import com.app.starter1.dto.hr.PayrollPeriodDTO;
import com.app.starter1.services.PayrollPeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

        Pageable pageable = PageRequest.of(page, size);
        Page<PayrollPeriodDTO> periods = periodService.getAllPeriods(customerId, pageable);

        return ResponseEntity.ok(periods);
    }

    @PostMapping
    public ResponseEntity<PayrollPeriodDTO> createPeriod(
            @RequestBody PayrollPeriodDTO dto,
            @RequestParam Long customerId) {
        PayrollPeriodDTO created = periodService.createPeriod(dto, customerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updatePeriodStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam Long customerId) {
        periodService.updatePeriodStatus(id, status, customerId);
        return ResponseEntity.ok().build();
    }
}
