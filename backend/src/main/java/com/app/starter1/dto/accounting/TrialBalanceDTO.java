package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para el Balance de Prueba
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrialBalanceDTO {

    private String accountCode;
    private String accountName;
    private String accountType; // ACTIVO, PASIVO, etc.
    private String nature; // DEBITO, CREDITO

    private BigDecimal initialBalance;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal finalBalance;
}
