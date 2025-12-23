package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de respuesta para comprobantes contables
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherResponseDTO {

    private Long id;
    private String voucherType;
    private String voucherNumber;
    private LocalDate date;
    private String description;
    private String reference;
    private String status;
    private Integer tenantId;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private Boolean isBalanced;
    private Integer fiscalYear;
    private Integer fiscalPeriod;
    private LocalDateTime createdAt;
    private LocalDateTime postedAt;
    private List<VoucherEntryDTO> entries;
}
