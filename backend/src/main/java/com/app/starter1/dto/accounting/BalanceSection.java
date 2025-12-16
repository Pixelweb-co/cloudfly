package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Sección del Balance General (Activos, Pasivos, Patrimonio)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceSection {

    /**
     * Nombre de la sección
     */
    private String name;

    /**
     * Cuentas de esta sección
     */
    @Builder.Default
    private List<BalanceAccount> accounts = new ArrayList<>();

    /**
     * Total de la sección
     */
    private BigDecimal total;

    /**
     * Calcula el total sumando las cuentas
     */
    public BigDecimal calculateTotal() {
        if (accounts == null || accounts.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return accounts.stream()
                .map(BalanceAccount::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
