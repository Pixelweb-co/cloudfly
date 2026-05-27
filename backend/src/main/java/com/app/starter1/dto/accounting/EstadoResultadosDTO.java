package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO para Estado de Resultados (P&L)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstadoResultadosDTO {

    private LocalDate fromDate;
    private LocalDate toDate;

    // INGRESOS
    private BigDecimal ingresosOperacionales;
    private BigDecimal ingresosNoOperacionales;
    private BigDecimal totalIngresos;

    // COSTOS
    private BigDecimal costoVentas;

    // UTILIDAD BRUTA
    private BigDecimal utilidadBruta;

    // GASTOS
    private BigDecimal gastosOperacionales;
    private BigDecimal gastosNoOperacionales;
    private BigDecimal totalGastos;

    // UTILIDAD/PÉRDIDA NETA
    private BigDecimal utilidadNeta;

    /**
     * Indica si hay utilidad (positivo) o pérdida (negativo)
     */
    public boolean hasProfit() {
        return utilidadNeta != null && utilidadNeta.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Calcula margen de utilidad %
     */
    public BigDecimal getMarginPercentage() {
        if (totalIngresos == null || totalIngresos.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return utilidadNeta.divide(totalIngresos, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
}
