package com.app.starter1.controllers;

import com.app.starter1.dto.hr.PayrollCostByCostCenterDTO;
import com.app.starter1.services.PayrollCostCenterReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador para reportes de nómina
 */
@RestController
@RequestMapping("/api/hr/reports")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONTADOR', 'RRHH')")
public class PayrollReportController {

    private final PayrollCostCenterReportService costCenterReportService;

    /**
     * Obtiene el reporte de costos de nómina por centro de costo para un período
     * específico
     */
    @GetMapping("/cost-by-center/{periodId}")
    public ResponseEntity<PayrollCostByCostCenterDTO> getPayrollCostsByCostCenter(
            @PathVariable Long periodId,
            @RequestParam Long customerId) {
        log.info("GET /api/hr/reports/cost-by-center/{} for customer {}", periodId, customerId);

        PayrollCostByCostCenterDTO report = costCenterReportService.getPayrollCostsByCostCenter(periodId, customerId);

        return ResponseEntity.ok(report);
    }

    /**
     * Obtiene el reporte de costos de nómina por centro de costo para todo un año
     */
    @GetMapping("/cost-by-center/year/{year}")
    public ResponseEntity<List<PayrollCostByCostCenterDTO>> getPayrollCostsByCostCenterForYear(
            @PathVariable Integer year,
            @RequestParam Long customerId) {
        log.info("GET /api/hr/reports/cost-by-center/year/{} for customer {}", year, customerId);

        List<PayrollCostByCostCenterDTO> reports = costCenterReportService.getPayrollCostsByCostCenterForYear(year,
                customerId);

        return ResponseEntity.ok(reports);
    }
}
