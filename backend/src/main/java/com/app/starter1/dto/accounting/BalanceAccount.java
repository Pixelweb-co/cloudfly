package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Cuenta dentro del Balance General
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceAccount {

    /**
     * Código de la cuenta
     */
    private String code;

    /**
     * Nombre de la cuenta
     */
    private String name;

    /**
     * Saldo de la cuenta
     */
    private BigDecimal balance;

    /**
     * Nivel de la cuenta (para jerarquía visual)
     */
    private Integer level;

    /**
     * Obtiene nombre completo
     */
    public String getFullName() {
        return code + " - " + name;
    }
}
