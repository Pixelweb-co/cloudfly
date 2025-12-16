package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO para el Balance General
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceGeneralDTO {

    /**
     * Fecha de corte del balance
     */
    private LocalDate asOfDate;

    /**
     * Activos corrientes
     */
    private BalanceSection activosCorrientes;

    /**
     * Activos no corrientes
     */
    private BalanceSection activosNoCorrientes;

    /**
     * Pasivos corrientes
     */
    private BalanceSection pasivosCorrientes;

    /**
     * Pasivos no corrientes
     */
    private BalanceSection pasivosNoCorrientes;

    /**
     * Patrimonio
     */
    private BalanceSection patrimonio;

    /**
     * Total activos
     */
    private BigDecimal totalActivos;

    /**
     * Total pasivos
     */
    private BigDecimal totalPasivos;

    /**
     * Total patrimonio
     */
    private BigDecimal totalPatrimonio;

    /**
     * Verifica si cumple la ecuación contable: Activo = Pasivo + Patrimonio
     */
    public boolean isBalanced() {
        if (totalActivos == null || totalPasivos == null || totalPatrimonio == null) {
            return false;
        }
        BigDecimal pasivosYPatrimonio = totalPasivos.add(totalPatrimonio);
        return totalActivos.compareTo(pasivosYPatrimonio) == 0;
    }

    /**
     * Calcula la diferencia (si no está balanceado)
     */
    public BigDecimal getDifference() {
        if (totalActivos == null || totalPasivos == null || totalPatrimonio == null) {
            return BigDecimal.ZERO;
        }
        return totalActivos.subtract(totalPasivos.add(totalPatrimonio));
    }
}
