package com.app.starter1.controllers;

import com.app.starter1.services.PayrollLiquidationService;
import com.app.starter1.services.PayrollLiquidationService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador para liquidación y pago de nómina
 */
@RestController
@RequestMapping("/api/hr/payroll")
@RequiredArgsConstructor
public class PayrollLiquidationController {

    private final PayrollLiquidationService liquidationService;

    /**
     * Liquida un período completo, generando todos los recibos
     */
    @PostMapping("/periods/{periodId}/liquidate")
    public ResponseEntity<LiquidationResult> liquidatePeriod(
            @PathVariable Long periodId,
            @RequestParam Long customerId) {

        LiquidationResult result = liquidationService.liquidatePeriod(periodId, customerId);
        return ResponseEntity.ok(result);
    }

    /**
     * Paga un recibo individual de un empleado
     */
    @PostMapping("/receipts/{receiptId}/pay")
    public ResponseEntity<PaymentResult> payReceipt(
            @PathVariable Long receiptId,
            @RequestParam Long customerId,
            @RequestBody PaymentRequest request) {

        PaymentResult result = liquidationService.payReceipt(receiptId, request);
        return ResponseEntity.ok(result);
    }
}
