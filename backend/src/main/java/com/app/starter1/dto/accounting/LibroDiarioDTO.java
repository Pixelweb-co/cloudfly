package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO para el reporte de Libro Diario
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibroDiarioDTO {

    /**
     * Fecha inicial del reporte
     */
    private LocalDate fromDate;

    /**
     * Fecha final del reporte
     */
    private LocalDate toDate;

    /**
     * Lista de movimientos del libro diario
     */
    private List<LibroDiarioRow> entries;

    /**
     * Total de débitos
     */
    private BigDecimal totalDebit;

    /**
     * Total de créditos
     */
    private BigDecimal totalCredit;

    /**
     * Cantidad total de movimientos
     */
    private Integer totalEntries;

    /**
     * Indica si el libro está balanceado (débito = crédito)
     */
    public boolean isBalanced() {
        if (totalDebit == null || totalCredit == null) {
            return false;
        }
        return totalDebit.compareTo(totalCredit) == 0;
    }

    /**
     * Calcula la diferencia entre débito y crédito
     */
    public BigDecimal getDifference() {
        if (totalDebit == null || totalCredit == null) {
            return BigDecimal.ZERO;
        }
        return totalDebit.subtract(totalCredit);
    }
}
