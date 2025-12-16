package com.app.starter1.controllers;

import com.app.starter1.dto.accounting.BalanceGeneralDTO;
import com.app.starter1.dto.accounting.BalancePruebaDTO;
import com.app.starter1.dto.accounting.EstadoResultadosDTO;
import com.app.starter1.dto.accounting.LibroDiarioDTO;
import com.app.starter1.dto.accounting.LibroMayorDTO;
import com.app.starter1.persistence.entity.AccountingVoucher;
import com.app.starter1.services.BalanceGeneralService;
import com.app.starter1.services.BalancePruebaService;
import com.app.starter1.services.EstadoResultadosService;
import com.app.starter1.services.LibroDiarioService;
import com.app.starter1.services.LibroMayorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller para reportes contables (Libros, Estados Financieros)
 */
@RestController
@RequestMapping("/api/accounting/reports")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONTADOR')")
public class AccountingReportController {

    private final LibroDiarioService libroDiarioService;
    private final LibroMayorService libroMayorService;
    private final BalanceGeneralService balanceGeneralService;
    private final BalancePruebaService balancePruebaService;
    private final EstadoResultadosService estadoResultadosService;

    // ========== LIBROS CONTABLES ==========

    @GetMapping("/libro-diario")
    public ResponseEntity<LibroDiarioDTO> getLibroDiario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) AccountingVoucher.VoucherType voucherType,
            @RequestParam(required = false, defaultValue = "1") Integer tenantId) {
        LibroDiarioDTO reporte = libroDiarioService.getLibroDiario(fromDate, toDate, voucherType, tenantId);
        return ResponseEntity.ok(reporte);
    }

    @GetMapping("/libro-mayor")
    public ResponseEntity<LibroMayorDTO> getLibroMayor(
            @RequestParam String accountCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false, defaultValue = "1") Integer tenantId) {
        LibroMayorDTO reporte = libroMayorService.getLibroMayor(accountCode, fromDate, toDate, tenantId);
        return ResponseEntity.ok(reporte);
    }

    // ========== ESTADOS FINANCIEROS ==========

    /**
     * Balance General
     * GET /api/accounting/reports/balance-general?asOfDate=2025-12-31
     */
    @GetMapping("/balance-general")
    public ResponseEntity<BalanceGeneralDTO> getBalanceGeneral(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            @RequestParam(required = false, defaultValue = "1") Integer tenantId) {
        log.info("GET /balance-general - asOfDate: {}", asOfDate);
        BalanceGeneralDTO balance = balanceGeneralService.getBalanceGeneral(asOfDate, tenantId);
        log.info("Balance General generado: Activos={}, Pasivos={}, Patrimonio={}, Balanceado={}",
                balance.getTotalActivos(), balance.getTotalPasivos(),
                balance.getTotalPatrimonio(), balance.isBalanced());
        return ResponseEntity.ok(balance);
    }

    /**
     * Balance de Prueba (Trial Balance)
     * GET /api/accounting/reports/balance-prueba?asOfDate=2025-12-31
     */
    @GetMapping("/balance-prueba")
    public ResponseEntity<BalancePruebaDTO> getBalancePrueba(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            @RequestParam(required = false, defaultValue = "1") Integer tenantId) {
        log.info("GET /balance-prueba - asOfDate: {}", asOfDate);
        BalancePruebaDTO balance = balancePruebaService.getBalancePrueba(asOfDate, tenantId);
        log.info("Balance de Prueba generado: {} cuentas, Balanceado={}", balance.getTotalAccounts(),
                balance.getIsBalanced());
        return ResponseEntity.ok(balance);
    }

    /**
     * Estado de Resultados (P&L)
     * GET
     * /api/accounting/reports/estado-resultados?fromDate=2025-01-01&toDate=2025-12-31
     */
    @GetMapping("/estado-resultados")
    public ResponseEntity<EstadoResultadosDTO> getEstadoResultados(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false, defaultValue = "1") Integer tenantId) {
        log.info("GET /estado-resultados - fromDate: {}, toDate: {}", fromDate, toDate);
        EstadoResultadosDTO estado = estadoResultadosService.getEstadoResultados(fromDate, toDate, tenantId);
        log.info("Estado de Resultados: Ingresos={}, Gastos={}, Utilidad={}",
                estado.getTotalIngresos(), estado.getTotalGastos(), estado.getUtilidadNeta());
        return ResponseEntity.ok(estado);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}
