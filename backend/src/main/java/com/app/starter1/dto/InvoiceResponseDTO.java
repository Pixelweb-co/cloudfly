package com.app.starter1.dto;

import com.app.starter1.persistence.entity.InvoiceStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InvoiceResponseDTO {
    private Long id;
    private Long tenantId;
    private Long customerId;
    private String customerName;
    private Long orderId;
    private String invoiceNumber;
    private LocalDateTime issueDate;
    private LocalDateTime dueDate;
    private InvoiceStatus status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal total;
    private String notes;
    private Long createdBy;
    private List<InvoiceItemResponseDTO> items;

    @Data
    public static class InvoiceItemResponseDTO {
        private Long id;
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal subtotal;
        private BigDecimal tax;
        private BigDecimal total;
    }
}
