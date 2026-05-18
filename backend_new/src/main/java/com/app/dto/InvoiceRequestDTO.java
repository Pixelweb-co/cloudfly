package com.app.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InvoiceRequestDTO {
    private Long tenantId;
    private Long companyId;
    private Long customerId;
    private Long subscriptionId;
    private String billingType; // PAGO_UNICO, RECURRENTE
    private String billingPeriod; // MENSUAL, SEMESTRAL, ANUAL
    private LocalDateTime dueDate;
    private List<InvoiceItemRequestDTO> items;

    @Data
    public static class InvoiceItemRequestDTO {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal tax;
        private BigDecimal total;
    }
}
