package com.app.starter1.services;

import com.app.starter1.dto.accounting.EstadoResultadosDTO;
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
import java.util.List;

/**
 * Servicio para generar Estado de Resultados (P&L)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EstadoResultadosService {

    private final ChartOfAccountRepository accountRepository;
    private final AccountingEntryRepository entryRepository;

    /**
     * Genera el Estado de Resultados para un período
     */
    public EstadoResultadosDTO getEstadoResultados(LocalDate fromDate, LocalDate toDate, Integer tenantId) {
        log.info("Generando Estado de Resultados desde {} hasta {}", fromDate, toDate);

        // INGRESOS (cuentas 4xxx)
        BigDecimal ingresosOp = sumAccountsByRange("41", "47", fromDate, toDate, true);
        BigDecimal ingresosNoOp = sumAccountsByRange("48", "49", fromDate, toDate, true);
        BigDecimal totalIngresos = ingresosOp.add(ingresosNoOp);

        // COSTOS (cuentas 6xxx)
        BigDecimal costoVentas = sumAccountsByRange("61", "69", fromDate, toDate, false);

        // UTILIDAD BRUTA
        BigDecimal utilidadBruta = totalIngresos.subtract(costoVentas);

        // GASTOS (cuentas 5xxx)
        BigDecimal gastosOp = sumAccountsByRange("51", "54", fromDate, toDate, false);
        BigDecimal gastosNoOp = sumAccountsByRange("55", "59", fromDate, toDate, false);
        BigDecimal totalGastos = gastosOp.add(gastosNoOp);

        // UTILIDAD NETA
        BigDecimal utilidadNeta = utilidadBruta.subtract(totalGastos);

        EstadoResultadosDTO estado = EstadoResultadosDTO.builder()
                .fromDate(fromDate)
                .toDate(toDate)
                .ingresosOperacionales(ingresosOp)
                .ingresosNoOperacionales(ingresosNoOp)
                .totalIngresos(totalIngresos)
                .costoVentas(costoVentas)
                .utilidadBruta(utilidadBruta)
                .gastosOperacionales(gastosOp)
                .gastosNoOperacionales(gastosNoOp)
                .totalGastos(totalGastos)
                .utilidadNeta(utilidadNeta)
                .build();

        log.info("Estado de Resultados: Ingresos: {}, Gastos: {}, Utilidad: {}",
                totalIngresos, totalGastos, utilidadNeta);

        return estado;
    }

    /**
     * Suma movimientos de cuentas en un rango
     */
    private BigDecimal sumAccountsByRange(
            String codeStart,
            String codeEnd,
            LocalDate fromDate,
            LocalDate toDate,
            boolean isCredit) {
        List<ChartOfAccount> accounts = accountRepository.findByIsActiveTrueOrderByCodeAsc();

        BigDecimal total = BigDecimal.ZERO;

        for (ChartOfAccount account : accounts) {
            if (account.getCode().compareTo(codeStart) >= 0 &&
                    account.getCode().compareTo(codeEnd) <= 0 &&
                    account.getLevel() == 4) {

                List<AccountingEntry> entries = entryRepository
                        .findByAccountCodeAndVoucherDateBetweenAndVoucherStatusOrderByVoucherDateAscVoucherIdAsc(
                                account.getCode(),
                                fromDate,
                                toDate,
                                com.app.starter1.persistence.entity.AccountingVoucher.VoucherStatus.POSTED);

                for (AccountingEntry entry : entries) {
                    if (isCredit) {
                        // Para ingresos: crédito - débito
                        total = total.add(entry.getCreditAmount()).subtract(entry.getDebitAmount());
                    } else {
                        // Para gastos/costos: débito - crédito
                        total = total.add(entry.getDebitAmount()).subtract(entry.getCreditAmount());
                    }
                }
            }
        }

        return total;
    }
}
