package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para una línea de asiento contable
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherEntryDTO {

    private Long id;
    private Integer lineNumber;
    private String accountCode;
    private String accountName; // Solo para respuesta
    private Long thirdPartyId;
    private String thirdPartyName; // Solo para respuesta
    private Long costCenterId;
    private String costCenterName; // Solo para respuesta
    private String description;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal baseValue;
    private BigDecimal taxValue;
}
