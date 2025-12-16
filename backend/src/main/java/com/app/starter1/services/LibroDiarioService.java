package com.app.starter1.services;

import com.app.starter1.dto.accounting.LibroDiarioDTO;
import com.app.starter1.dto.accounting.LibroDiarioRow;
import com.app.starter1.persistence.entity.AccountingEntry;
import com.app.starter1.persistence.entity.AccountingVoucher;
import com.app.starter1.persistence.repository.AccountingVoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para generar el Libro Diario contable
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LibroDiarioService {

    private final AccountingVoucherRepository voucherRepository;

    /**
     * Genera el Libro Diario para un rango de fechas
     *
     * @param fromDate    Fecha inicial
     * @param toDate      Fecha final
     * @param voucherType Tipo de comprobante (opcional)
     * @param tenantId    ID del tenant
     * @return LibroDiarioDTO con todos los movimientos
     */
    public LibroDiarioDTO getLibroDiario(
            LocalDate fromDate,
            LocalDate toDate,
            AccountingVoucher.VoucherType voucherType,
            Integer tenantId) {
        log.info("Generando Libro Diario desde {} hasta {} para tenant {}",
                fromDate, toDate, tenantId);

        // Validar fechas
        if (fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("La fecha inicial no puede ser posterior a la fecha final");
        }

        // Obtener comprobantes
        List<AccountingVoucher> vouchers = getVouchers(fromDate, toDate, voucherType, tenantId);

        // Convertir a filas del libro diario
        List<LibroDiarioRow> rows = new ArrayList<>();
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (AccountingVoucher voucher : vouchers) {
            for (AccountingEntry entry : voucher.getEntries()) {
                LibroDiarioRow row = mapToLibroDiarioRow(voucher, entry);
                rows.add(row);

                totalDebit = totalDebit.add(entry.getDebitAmount());
                totalCredit = totalCredit.add(entry.getCreditAmount());
            }
        }

        log.info("Libro Diario generado: {} movimientos, Débito: {}, Crédito: {}",
                rows.size(), totalDebit, totalCredit);

        return LibroDiarioDTO.builder()
                .fromDate(fromDate)
                .toDate(toDate)
                .entries(rows)
                .totalDebit(totalDebit)
                .totalCredit(totalCredit)
                .totalEntries(rows.size())
                .build();
    }

    /**
     * Obtiene los comprobantes filtrados
     */
    private List<AccountingVoucher> getVouchers(
            LocalDate fromDate,
            LocalDate toDate,
            AccountingVoucher.VoucherType voucherType,
            Integer tenantId) {
        if (voucherType != null) {
            return voucherRepository.findByTenantIdAndDateBetweenAndVoucherTypeAndStatusOrderByDateAscVoucherNumberAsc(
                    tenantId,
                    fromDate,
                    toDate,
                    voucherType,
                    AccountingVoucher.VoucherStatus.POSTED);
        } else {
            return voucherRepository.findByTenantIdAndDateBetweenAndStatusOrderByDateAscVoucherNumberAsc(
                    tenantId,
                    fromDate,
                    toDate,
                    AccountingVoucher.VoucherStatus.POSTED);
        }
    }

    /**
     * Mapea un AccountingEntry a LibroDiarioRow
     */
    private LibroDiarioRow mapToLibroDiarioRow(AccountingVoucher voucher, AccountingEntry entry) {
        return LibroDiarioRow.builder()
                .date(voucher.getDate())
                .voucherType(voucher.getVoucherType())
                .voucherNumber(voucher.getVoucherNumber())
                .voucherId(voucher.getId())
                .accountCode(entry.getAccount().getCode())
                .accountName(entry.getAccount().getName())
                .thirdPartyId(entry.getThirdParty() != null ? entry.getThirdParty().getId() : null)
                .thirdPartyName(entry.getThirdParty() != null ? entry.getThirdParty().getName() : null)
                .description(entry.getDescription())
                .debitAmount(entry.getDebitAmount())
                .creditAmount(entry.getCreditAmount())
                .build();
    }

    /**
     * Genera el Libro Diario sin filtro de tipo de comprobante
     */
    public LibroDiarioDTO getLibroDiario(LocalDate fromDate, LocalDate toDate, Integer tenantId) {
        return getLibroDiario(fromDate, toDate, null, tenantId);
    }
}
