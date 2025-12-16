package com.app.starter1.services;

import com.app.starter1.dto.accounting.BalanceAccount;
import com.app.starter1.dto.accounting.BalanceGeneralDTO;
import com.app.starter1.dto.accounting.BalanceSection;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio para generar el Balance General
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BalanceGeneralService {

        private final ChartOfAccountRepository accountRepository;
        private final AccountingEntryRepository entryRepository;

        /**
         * Genera el Balance General a una fecha específica
         */
        public BalanceGeneralDTO getBalanceGeneral(LocalDate asOfDate, Integer tenantId) {
                log.info("Generando Balance General al {} para tenant {}", asOfDate, tenantId);

                // Obtener todas las cuentas de nivel 4 (movibles)
                List<ChartOfAccount> accounts = accountRepository.findByLevelAndIsActiveTrueOrderByCodeAsc(4);

                // Calcular saldo de cada cuenta hasta la fecha
                Map<String, BigDecimal> balances = calculateBalances(accounts, asOfDate);

                // Clasificar cuentas por tipo
                BalanceSection activosCorrientes = buildSection("ACTIVOS CORRIENTES", accounts, balances,
                                "ACTIVO", "11", "139999");

                BalanceSection activosNoCorrientes = buildSection("ACTIVOS NO CORRIENTES", accounts, balances,
                                "ACTIVO", "14", "199999");

                BalanceSection pasivosCorrientes = buildSection("PASIVOS CORRIENTES", accounts, balances,
                                "PASIVO", "21", "259999");

                BalanceSection pasivosNoCorrientes = buildSection("PASIVOS NO CORRIENTES", accounts, balances,
                                "PASIVO", "26", "299999");

                BalanceSection patrimonio = buildSection("PATRIMONIO", accounts, balances,
                                "PATRIMONIO", "31", "399999");

                // Calcular totales
                BigDecimal totalActivos = activosCorrientes.getTotal()
                                .add(activosNoCorrientes.getTotal());

                BigDecimal totalPasivos = pasivosCorrientes.getTotal()
                                .add(pasivosNoCorrientes.getTotal());

                BigDecimal totalPatrimonio = patrimonio.getTotal();

                BalanceGeneralDTO balance = BalanceGeneralDTO.builder()
                                .asOfDate(asOfDate)
                                .activosCorrientes(activosCorrientes)
                                .activosNoCorrientes(activosNoCorrientes)
                                .pasivosCorrientes(pasivosCorrientes)
                                .pasivosNoCorrientes(pasivosNoCorrientes)
                                .patrimonio(patrimonio)
                                .totalActivos(totalActivos)
                                .totalPasivos(totalPasivos)
                                .totalPatrimonio(totalPatrimonio)
                                .build();

                log.info("Balance generado: {} cuentas, Activos: {}, Pasivos: {}, Patrimonio: {}, Balanceado: {}",
                                accounts.size(), totalActivos, totalPasivos, totalPatrimonio, balance.isBalanced());

                return balance;
        }

        /**
         * Calcula saldo de todas las cuentas hasta una fecha
         */
        private Map<String, BigDecimal> calculateBalances(List<ChartOfAccount> accounts, LocalDate asOfDate) {
                Map<String, BigDecimal> balances = new HashMap<>();

                for (ChartOfAccount account : accounts) {
                        BigDecimal balance = calculateAccountBalance(account, asOfDate);
                        balances.put(account.getCode(), balance);
                }

                return balances;
        }

        /**
         * Calcula el saldo de una cuenta específica
         */
        private BigDecimal calculateAccountBalance(ChartOfAccount account, LocalDate asOfDate) {
                List<AccountingEntry> entries = entryRepository
                                .findByAccountCodeAndVoucherDateBeforeAndVoucherStatusOrderByVoucherDateAsc(
                                                account.getCode(),
                                                asOfDate.plusDays(1), // Incluir movimientos del día
                                                com.app.starter1.persistence.entity.AccountingVoucher.VoucherStatus.POSTED);

                BigDecimal balance = BigDecimal.ZERO;

                for (AccountingEntry entry : entries) {
                        if ("DEBITO".equals(account.getNature())) {
                                balance = balance.add(entry.getDebitAmount()).subtract(entry.getCreditAmount());
                        } else {
                                balance = balance.subtract(entry.getDebitAmount()).add(entry.getCreditAmount());
                        }
                }

                return balance;
        }

        /**
         * Construye una sección del balance
         */
        private BalanceSection buildSection(
                        String name,
                        List<ChartOfAccount> allAccounts,
                        Map<String, BigDecimal> balances,
                        String type,
                        String codeStart,
                        String codeEnd) {
                List<BalanceAccount> sectionAccounts = allAccounts.stream()
                                .filter(acc -> type.equals(acc.getAccountType()))
                                .filter(acc -> acc.getCode().compareTo(codeStart) >= 0 &&
                                                acc.getCode().compareTo(codeEnd) <= 0)
                                .filter(acc -> balances.get(acc.getCode()).compareTo(BigDecimal.ZERO) != 0)
                                .map(acc -> BalanceAccount.builder()
                                                .code(acc.getCode())
                                                .name(acc.getName())
                                                .balance(balances.get(acc.getCode()))
                                                .level(acc.getLevel())
                                                .build())
                                .collect(Collectors.toList());

                BigDecimal total = sectionAccounts.stream()
                                .map(BalanceAccount::getBalance)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                return BalanceSection.builder()
                                .name(name)
                                .accounts(sectionAccounts)
                                .total(total)
                                .build();
        }
}
