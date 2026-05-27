package com.app.starter1.dto.accounting;

import com.app.starter1.persistence.entity.AccountingVoucher;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO que representa una fila del Libro Mayor
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibroMayorRow {

    /**
     * Fecha del movimiento
     */
    private LocalDate date;

    /**
     * Tipo de comprobante
     */
    private AccountingVoucher.VoucherType voucherType;

    /**
     * Número del comprobante
     */
    private String voucherNumber;

    /**
     * ID del comprobante
     */
    private Long voucherId;

    /**
     * Descripción del movimiento
     */
    private String description;

    /**
     * ID del tercero (si aplica)
     */
    private Long thirdPartyId;

    /**
     * Nombre del tercero (si aplica)
     */
    private String thirdPartyName;

    /**
     * Monto débito
     */
    private BigDecimal debitAmount;

    /**
     * Monto crédito
     */
    private BigDecimal creditAmount;

    /**
     * Saldo acumulado después de este movimiento
     */
    private BigDecimal balance;

    /**
     * Obtiene el comprobante completo (tipo + número)
     */
    public String getFullVoucherNumber() {
        return voucherType != null ? voucherType.name() + "-" + voucherNumber : voucherNumber;
    }
}
