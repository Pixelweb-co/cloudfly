package com.app.starter1.services;

import com.app.starter1.dto.accounting.LibroMayorDTO;
import com.app.starter1.dto.accounting.LibroMayorRow;
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
import java.util.List;

/**
 * Servicio para generar el Libro Mayor contable
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LibroMayorService {

        private final AccountingEntryRepository entryRepository;
        private final ChartOfAccountRepository accountRepository;

        /**
         * Genera el Libro Mayor para una cuenta específica
         *
         * @param accountCode Código de la cuenta
         * @param fromDate    Fecha inicial
         * @param toDate      Fecha final
         * @param tenantId    ID del tenant
         * @return LibroMayorDTO con movimientos y saldos
         */
        public LibroMayorDTO getLibroMayor(
                        String accountCode,
                        LocalDate fromDate,
                        LocalDate toDate,
                        Integer tenantId) {
                log.info("Generando Libro Mayor para cuenta {} desde {} hasta {}",
                                accountCode, fromDate, toDate);

                // Validar fechas
                if (fromDate.isAfter(toDate)) {
                        throw new IllegalArgumentException("La fecha inicial no puede ser posterior a la fecha final");
                }

                // Obtener cuenta
                ChartOfAccount account = accountRepository.findByCode(accountCode)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Cuenta no encontrada: " + accountCode));

                // Calcular saldo inicial (movimientos antes de fromDate)
                BigDecimal initialBalance = calculateInitialBalance(accountCode, fromDate, account.getNature(),
                                tenantId);

                // Obtener movimientos del período
                List<AccountingEntry> entries = entryRepository
                                .findByAccountCodeAndVoucherDateBetweenAndVoucherStatusOrderByVoucherDateAscVoucherIdAsc(
                                                accountCode,
                                                fromDate,
                                                toDate,
                                                com.app.starter1.persistence.entity.AccountingVoucher.VoucherStatus.POSTED);

                // Convertir a filas con saldo acumulado
                List<LibroMayorRow> rows = new ArrayList<>();
                BigDecimal runningBalance = initialBalance;
                BigDecimal totalDebit = BigDecimal.ZERO;
                BigDecimal totalCredit = BigDecimal.ZERO;

                for (AccountingEntry entry : entries) {
                        // Calcular saldo acumulado según naturaleza de la cuenta
                        runningBalance = calculateRunningBalance(
                                        runningBalance,
                                        entry.getDebitAmount(),
                                        entry.getCreditAmount(),
                                        account.getNature());

                        LibroMayorRow row = mapToLibroMayorRow(entry, runningBalance);
                        rows.add(row);

                        totalDebit = totalDebit.add(entry.getDebitAmount());
                        totalCredit = totalCredit.add(entry.getCreditAmount());
                }

                log.info("Libro Mayor generado: {} movimientos, Saldo inicial: {}, Saldo final: {}",
                                rows.size(), initialBalance, runningBalance);

                return LibroMayorDTO.builder()
                                .accountCode(account.getCode())
                                .accountName(account.getName())
                                .nature(account.getNature())
                                .fromDate(fromDate)
                                .toDate(toDate)
                                .initialBalance(initialBalance)
                                .entries(rows)
                                .totalDebit(totalDebit)
                                .totalCredit(totalCredit)
                                .finalBalance(runningBalance)
                                .totalEntries(rows.size())
                                .build();
        }

        /**
         * Calcula el saldo inicial de una cuenta (movimientos anteriores a fromDate)
         */
        private BigDecimal calculateInitialBalance(
                        String accountCode,
                        LocalDate fromDate,
                        String nature,
                        Integer tenantId) {
                List<AccountingEntry> previousEntries = entryRepository
                                .findByAccountCodeAndVoucherDateBeforeAndVoucherStatusOrderByVoucherDateAsc(
                                                accountCode,
                                                fromDate,
                                                com.app.starter1.persistence.entity.AccountingVoucher.VoucherStatus.POSTED);

                BigDecimal balance = BigDecimal.ZERO;

                for (AccountingEntry entry : previousEntries) {
                        balance = calculateRunningBalance(
                                        balance,
                                        entry.getDebitAmount(),
                                        entry.getCreditAmount(),
                                        nature);
                }

                return balance;
        }

        /**
         * Calcula el saldo acumulado según la naturaleza de la cuenta
         */
        private BigDecimal calculateRunningBalance(
                        BigDecimal currentBalance,
                        BigDecimal debit,
                        BigDecimal credit,
                        String nature) {
                if ("DEBITO".equals(nature)) {
                        // Para cuentas de naturaleza DÉBITO: saldo = saldo + débito - crédito
                        return currentBalance.add(debit).subtract(credit);
                } else {
                        // Para cuentas de naturaleza CRÉDITO: saldo = saldo - débito + crédito
                        return currentBalance.subtract(debit).add(credit);
                }
        }

        /**
         * Mapea un AccountingEntry a LibroMayorRow
         */
        private LibroMayorRow mapToLibroMayorRow(AccountingEntry entry, BigDecimal balance) {
                return LibroMayorRow.builder()
                                .date(entry.getVoucher().getDate())
                                .voucherType(entry.getVoucher().getVoucherType())
                                .voucherNumber(entry.getVoucher().getVoucherNumber())
                                .voucherId(entry.getVoucher().getId())
                                .description(entry.getDescription())
                                .thirdPartyId(entry.getThirdParty() != null ? entry.getThirdParty().getId() : null)
                                .thirdPartyName(entry.getThirdParty() != null ? entry.getThirdParty().getName() : null)
                                .debitAmount(entry.getDebitAmount())
                                .creditAmount(entry.getCreditAmount())
                                .balance(balance)
                                .build();
        }
}
