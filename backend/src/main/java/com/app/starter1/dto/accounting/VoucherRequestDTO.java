package com.app.starter1.dto.accounting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO para crear/actualizar comprobantes contables
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherRequestDTO {

    private String voucherType; // INGRESO, EGRESO, NOTA_CONTABLE
    private LocalDate date;
    private String description;
    private String reference;
    private Integer tenantId;
    private List<VoucherEntryDTO> entries;
}
