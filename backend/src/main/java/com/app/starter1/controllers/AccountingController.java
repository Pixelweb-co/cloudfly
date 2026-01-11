package com.app.starter1.controllers;

import com.app.starter1.persistence.entity.AccountingFiscalPeriod;
import com.app.starter1.persistence.entity.AccountingLedger;
import com.app.starter1.persistence.repository.AccountingFiscalPeriodRepository;
import com.app.starter1.persistence.repository.AccountingLedgerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounting")
@RequiredArgsConstructor
@Slf4j
public class AccountingController {

    private final AccountingLedgerRepository ledgerRepository;
    private final AccountingFiscalPeriodRepository periodRepository;

    @GetMapping("/periods")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<List<AccountingFiscalPeriod>> getPeriods(@RequestParam Integer tenantId) {
        // TODO: Filtrar por tenant
        // En un sistema real tenantId vendría del token
        return ResponseEntity.ok(periodRepository.findAll());
    }

    @GetMapping("/ledger")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<List<AccountingLedger>> getLedgerBalances(
            @RequestParam Integer tenantId,
            @RequestParam Long periodId) {

        return ResponseEntity.ok(ledgerRepository.findByTenantIdAndFiscalPeriodId(tenantId, periodId));
    }

    @PostMapping("/periods/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> closePeriod(@RequestParam Long periodId) {
        AccountingFiscalPeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Período no encontrado"));

        period.setStatus(AccountingFiscalPeriod.PeriodStatus.CLOSED);
        periodRepository.save(period);

        return ResponseEntity.ok().build();
    }
}
