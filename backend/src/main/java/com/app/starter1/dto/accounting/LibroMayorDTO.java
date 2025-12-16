package com.app.starter1.dto.accounting;

import com.app.starter1.persistence.entity.ChartOfAccount;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO para el reporte de Libro Mayor
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibroMayorDTO {

    /**
     * Código de la cuenta
     */
    private String accountCode;

    /**
     * Nombre de la cuenta
     */
    private String accountName;

    /**
     * Naturaleza de la cuenta (DEBITO, CREDITO)
     */
    private String nature;

    /**
     * Fecha inicial del reporte
     */
    private LocalDate fromDate;

    /**
     * Fecha final del reporte
     */
    private LocalDate toDate;

    /**
     * Saldo inicial
     */
    private BigDecimal initialBalance;

    /**
     * Lista de movimientos
     */
    private List<LibroMayorRow> entries;

    /**
     * Total débitos del período
     */
    private BigDecimal totalDebit;

    /**
     * Total créditos del período
     */
    private BigDecimal totalCredit;

    /**
     * Saldo final
     */
    private BigDecimal finalBalance;

    /**
     * Cantidad de movimientos
     */
    private Integer totalEntries;

    /**
     * Calcula el movimiento neto del período
     */
    public BigDecimal getNetMovement() {
        if (totalDebit == null || totalCredit == null) {
            return BigDecimal.ZERO;
        }
        return totalDebit.subtract(totalCredit);
    }
}
