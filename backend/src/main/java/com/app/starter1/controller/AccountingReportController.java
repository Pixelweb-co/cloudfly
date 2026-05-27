package com.app.starter1.controller;

import com.app.starter1.dto.accounting.TrialBalanceDTO;
import com.app.starter1.persistence.entity.AccountingLedger;
import com.app.starter1.persistence.repository.AccountingLedgerRepository;
import com.app.starter1.persistence.repository.AccountingFiscalPeriodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controlador REST para reportes contables
 */
@RestController
@RequestMapping("/api/accounting")
@RequiredArgsConstructor
@Slf4j
public class AccountingReportController {

    private final AccountingLedgerRepository ledgerRepository;
    private final AccountingFiscalPeriodRepository fiscalPeriodRepository;

    /**
     * Balance de Prueba (Trial Balance)
     * Muestra saldos de todas las cuentas para un período fiscal
     */
    @GetMapping("/trial-balance")
    public ResponseEntity<List<TrialBalanceDTO>> getTrialBalance(
            @RequestParam Integer tenantId,
            @RequestParam Integer year,
            @RequestParam Integer month) {

        log.info("📊 Fetching Trial Balance for tenant: {}, period: {}/{}", tenantId, year, month);

        // 1. Buscar período fiscal
        var period = fiscalPeriodRepository.findByTenantIdAndYearAndMonth(tenantId, year, month)
                .orElseThrow(() -> new IllegalArgumentException("Período fiscal no encontrado"));

        // 2. Obtener ledgers del período
        List<AccountingLedger> ledgers = ledgerRepository.findByTenantIdAndFiscalPeriodId(tenantId, period.getId());

        // 3. Convertir a DTO
        List<TrialBalanceDTO> trialBalance = ledgers.stream()
                .map(ledger -> TrialBalanceDTO.builder()
                        .accountCode(ledger.getAccount().getCode())
                        .accountName(ledger.getAccount().getName())
                        .accountType(ledger.getAccount().getAccountType())
                        .nature(ledger.getAccount().getNature() != null ? ledger.getAccount().getNature().name()
                                : "DEBITO")
                        .initialBalance(ledger.getInitialBalance())
                        .debitAmount(ledger.getDebitAmount())
                        .creditAmount(ledger.getCreditAmount())
                        .finalBalance(ledger.getFinalBalance())
                        .build())
                .collect(Collectors.toList());

        log.info("✅ Trial Balance generated: {} accounts", trialBalance.size());
        return ResponseEntity.ok(trialBalance);
    }

    /**
     * Libro Mayor (Ledger) detallado para una cuenta específica
     */
    @GetMapping("/ledger/{accountCode}")
    public ResponseEntity<AccountingLedger> getLedgerByAccount(
            @RequestParam Integer tenantId,
            @RequestParam Integer year,
            @RequestParam Integer month,
            @PathVariable String accountCode) {

        log.info("📗 Fetching Ledger for account: {}, period: {}/{}", accountCode, year, month);

        var period = fiscalPeriodRepository.findByTenantIdAndYearAndMonth(tenantId, year, month)
                .orElseThrow(() -> new IllegalArgumentException("Período fiscal no encontrado"));

        var ledger = ledgerRepository.findByTenantIdAndFiscalPeriodIdAndAccountCode(
                tenantId, period.getId(), accountCode)
                .orElseThrow(() -> new IllegalArgumentException("Cuenta no encontrada en el período"));

        return ResponseEntity.ok(ledger);
    }

    /**
     * Resumen de saldos totales del Balance de Prueba
     */
    @GetMapping("/trial-balance/summary")
    public ResponseEntity<TrialBalanceSummary> getTrialBalanceSummary(
            @RequestParam Integer tenantId,
            @RequestParam Integer year,
            @RequestParam Integer month) {

        var period = fiscalPeriodRepository.findByTenantIdAndYearAndMonth(tenantId, year, month)
                .orElseThrow(() -> new IllegalArgumentException("Período fiscal no encontrado"));

        List<AccountingLedger> ledgers = ledgerRepository.findByTenantIdAndFiscalPeriodId(tenantId, period.getId());

        BigDecimal totalDebits = ledgers.stream()
                .map(AccountingLedger::getDebitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredits = ledgers.stream()
                .map(AccountingLedger::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean isBalanced = totalDebits.compareTo(totalCredits) == 0;

        TrialBalanceSummary summary = new TrialBalanceSummary(
                totalDebits,
                totalCredits,
                totalDebits.subtract(totalCredits),
                isBalanced,
                ledgers.size());

        return ResponseEntity.ok(summary);
    }

    /**
     * DTO interno para resumen del balance
     */
    public record TrialBalanceSummary(
            BigDecimal totalDebits,
            BigDecimal totalCredits,
            BigDecimal difference,
            boolean isBalanced,
            int accountCount) {
    }
}
