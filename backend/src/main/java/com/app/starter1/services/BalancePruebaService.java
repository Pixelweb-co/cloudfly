package com.app.starter1.services;

import com.app.starter1.dto.accounting.BalancePruebaDTO;
import com.app.starter1.dto.accounting.BalancePruebaRow;
import com.app.starter1.persistence.entity.AccountingEntry;
import com.app.starter1.persistence.entity.ChartOfAccount;
import com.app.starter1.persistence.repository.AccountingEntryRepository;
import com.app.starter1.persistence.repository.ChartOfAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio para generar el Balance de Prueba
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BalancePruebaService {

    private final ChartOfAccountRepository accountRepository;
    private final AccountingEntryRepository entryRepository;

    /**
     * Genera el Balance de Prueba a una fecha determinada
     */
    public BalancePruebaDTO getBalancePrueba(LocalDate asOfDate, Integer tenantId) {
        log.info("Generando Balance de Prueba al {} para tenant {}", asOfDate, tenantId);

        // Obtener todas las cuentas activas
        List<ChartOfAccount> accounts = accountRepository.findByIsActiveTrueOrderByCodeAsc();

        // Calcular saldos y movimientos para cada cuenta
        List<BalancePruebaRow> rows = new ArrayList<>();
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        BigDecimal totalDebitBalance = BigDecimal.ZERO;
        BigDecimal totalCreditBalance = BigDecimal.ZERO;

        for (ChartOfAccount account : accounts) {
            // Obtener movimientos de la cuenta hasta la fecha
            List<AccountingEntry> entries = entryRepository
                    .findByAccountCodeAndVoucherDateBeforeAndVoucherStatusOrderByVoucherDateAsc(
                            account.getCode(),
                            asOfDate.plusDays(1), // Incluir movimientos del día
                            com.app.starter1.persistence.entity.AccountingVoucher.VoucherStatus.POSTED);

            BigDecimal debitMovement = BigDecimal.ZERO;
            BigDecimal creditMovement = BigDecimal.ZERO;

            for (AccountingEntry entry : entries) {
                debitMovement = debitMovement.add(entry.getDebitAmount());
                creditMovement = creditMovement.add(entry.getCreditAmount());
            }

            // Solo incluir cuentas con movimientos
            if (debitMovement.compareTo(BigDecimal.ZERO) > 0 || creditMovement.compareTo(BigDecimal.ZERO) > 0) {
                // Calcular saldo según naturaleza
                BigDecimal balance;
                if ("DEBITO".equals(account.getNature())) {
                    balance = debitMovement.subtract(creditMovement);
                } else {
                    balance = creditMovement.subtract(debitMovement);
                }

                BigDecimal debitBalance = BigDecimal.ZERO;
                BigDecimal creditBalance = BigDecimal.ZERO;

                if (balance.compareTo(BigDecimal.ZERO) > 0) {
                    if ("DEBITO".equals(account.getNature())) {
                        debitBalance = balance;
                    } else {
                        creditBalance = balance;
                    }
                } else if (balance.compareTo(BigDecimal.ZERO) < 0) {
                    if ("DEBITO".equals(account.getNature())) {
                        creditBalance = balance.abs();
                    } else {
                        debitBalance = balance.abs();
                    }
                }

                BalancePruebaRow row = BalancePruebaRow.builder()
                        .accountCode(account.getCode())
                        .accountName(account.getName())
                        .accountType(account.getAccountType())
                        .nature(account.getNature() != null ? account.getNature().name() : null)
                        .level(account.getLevel())
                        .debitMovement(debitMovement)
                        .creditMovement(creditMovement)
                        .debitBalance(debitBalance)
                        .creditBalance(creditBalance)
                        .build();

                rows.add(row);

                totalDebit = totalDebit.add(debitMovement);
                totalCredit = totalCredit.add(creditMovement);
                totalDebitBalance = totalDebitBalance.add(debitBalance);
                totalCreditBalance = totalCreditBalance.add(creditBalance);
            }
        }

        boolean isBalanced = totalDebitBalance.compareTo(totalCreditBalance) == 0;

        log.info("Balance de Prueba generado: {} cuentas, Débitos={}, Créditos={}, Balanceado={}",
                rows.size(), totalDebit, totalCredit, isBalanced);

        return BalancePruebaDTO.builder()
                .asOfDate(asOfDate)
                .accounts(rows)
                .totalDebit(totalDebit)
                .totalCredit(totalCredit)
                .totalDebitBalance(totalDebitBalance)
                .totalCreditBalance(totalCreditBalance)
                .isBalanced(isBalanced)
                .totalAccounts(rows.size())
                .build();
    }
}
