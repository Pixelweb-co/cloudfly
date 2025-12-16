package com.app.starter1.controllers;

import com.app.starter1.dto.accounting.VoucherRequestDTO;
import com.app.starter1.dto.accounting.VoucherResponseDTO;
import com.app.starter1.services.AccountingVoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador para Comprobantes Contables
 */
@RestController
@RequestMapping("/accounting/vouchers")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONTADOR')")
public class AccountingVoucherController {

    private final AccountingVoucherService service;

    @GetMapping
    public ResponseEntity<List<VoucherResponseDTO>> getAllVouchers(
            @RequestParam(required = false, defaultValue = "1") Integer tenantId) {
        log.info("GET /accounting/vouchers - tenant: {}", tenantId);
        return ResponseEntity.ok(service.getAllVouchers(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VoucherResponseDTO> getVoucherById(@PathVariable Long id) {
        log.info("GET /accounting/vouchers/{}", id);
        return ResponseEntity.ok(service.getVoucherById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<VoucherResponseDTO> createVoucher(@RequestBody VoucherRequestDTO request) {
        log.info("POST /accounting/vouchers - type: {}", request.getVoucherType());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createVoucher(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<VoucherResponseDTO> updateVoucher(
            @PathVariable Long id,
            @RequestBody VoucherRequestDTO request) {
        log.info("PUT /accounting/vouchers/{}", id);
        return ResponseEntity.ok(service.updateVoucher(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteVoucher(@PathVariable Long id) {
        log.info("DELETE /accounting/vouchers/{}", id);
        service.deleteVoucher(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/post")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<VoucherResponseDTO> postVoucher(@PathVariable Long id) {
        log.info("POST /accounting/vouchers/{}/post", id);
        return ResponseEntity.ok(service.postVoucher(id));
    }

    @PostMapping("/{id}/void")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<VoucherResponseDTO> voidVoucher(@PathVariable Long id) {
        log.info("POST /accounting/vouchers/{}/void", id);
        return ResponseEntity.ok(service.voidVoucher(id));
    }
}
