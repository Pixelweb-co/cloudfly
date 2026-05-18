package com.app.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InvoiceResponseDTO {
    private Long id;
    private Long tenantId;
    private Long companyId;
    private Long customerId;
    private String customerName;
    private Long subscriptionId;
    private String invoiceNumber;
    private LocalDateTime issueDate;
    private LocalDateTime dueDate;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
    private String currency;
    private String pdfUrl;
    private String publicUrlToken;
    private String billingType;
    private String billingPeriod;
    private LocalDateTime billingPeriodStart;
    private LocalDateTime billingPeriodEnd;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InvoiceItemResponseDTO> items;

    @Data
    public static class InvoiceItemResponseDTO {
        private Long id;
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal tax;
        private BigDecimal total;
    }
}
