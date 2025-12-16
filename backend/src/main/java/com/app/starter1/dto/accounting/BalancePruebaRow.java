package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Fila del Balance de Prueba
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalancePruebaRow {

    /**
     * Código de la cuenta
     */
    private String accountCode;

    /**
     * Nombre de la cuenta
     */
    private String accountName;

    /**
     * Tipo de cuenta
     */
    private String accountType;

    /**
     * Naturaleza de la cuenta
     */
    private String nature;

    /**
     * Nivel de la cuenta
     */
    private Integer level;

    /**
     * Movimientos débito del período
     */
    private BigDecimal debitMovement;

    /**
     * Movimientos crédito del período
     */
    private BigDecimal creditMovement;

    /**
     * Saldo débito
     */
    private BigDecimal debitBalance;

    /**
     * Saldo crédito
     */
    private BigDecimal creditBalance;
}
