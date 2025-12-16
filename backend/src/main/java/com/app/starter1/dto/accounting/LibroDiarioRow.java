package com.app.starter1.dto.accounting;

import com.app.starter1.persistence.entity.AccountingVoucher;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO que representa una fila del Libro Diario
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibroDiarioRow {

    /**
     * Fecha del movimiento
     */
    private LocalDate date;

    /**
     * Tipo de comprobante (INGRESO, EGRESO, NOTA_CONTABLE, etc.)
     */
    private AccountingVoucher.VoucherType voucherType;

    /**
     * Número del comprobante
     */
    private String voucherNumber;

    /**
     * ID del comprobante (para referencia)
     */
    private Long voucherId;

    /**
     * Código de la cuenta contable
     */
    private String accountCode;

    /**
     * Nombre de la cuenta contable
     */
    private String accountName;

    /**
     * ID del tercero (si aplica)
     */
    private Long thirdPartyId;

    /**
     * Nombre del tercero (si aplica)
     */
    private String thirdPartyName;

    /**
     * Descripción del movimiento
     */
    private String description;

    /**
     * Monto débito
     */
    private BigDecimal debitAmount;

    /**
     * Monto crédito
     */
    private BigDecimal creditAmount;

    /**
     * Obtiene el tipo de comprobante en español
     */
    public String getVoucherTypeDescription() {
        return voucherType != null ? voucherType.getDescription() : "";
    }

    /**
     * Obtiene el número completo del comprobante (tipo + número)
     */
    public String getFullVoucherNumber() {
        return voucherType != null ? voucherType.name() + "-" + voucherNumber : voucherNumber;
    }
}
