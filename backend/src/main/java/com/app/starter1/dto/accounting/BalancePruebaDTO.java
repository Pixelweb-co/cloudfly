package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO para el Balance de Prueba (Trial Balance)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalancePruebaDTO {

    /**
     * Fecha de corte del balance
     */
    private LocalDate asOfDate;

    /**
     * Lista de cuentas con saldos
     */
    private List<BalancePruebaRow> accounts;

    /**
     * Total de débitos
     */
    private BigDecimal totalDebit;

    /**
     * Total de créditos
     */
    private BigDecimal totalCredit;

    /**
     * Total de saldos débito
     */
    private BigDecimal totalDebitBalance;

    /**
     * Total de saldos crédito
     */
    private BigDecimal totalCreditBalance;

    /**
     * Indica si el balance está cuadrado
     */
    private Boolean isBalanced;

    /**
     * Número total de cuentas
     */
    private Integer totalAccounts;
}
