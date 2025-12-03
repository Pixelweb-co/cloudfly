package com.app.starter1.dto;

import com.app.starter1.persistence.entity.InvoiceStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InvoiceRequestDTO {
    private Long tenantId;
    private Long customerId;
    private Long orderId;
    private LocalDateTime dueDate;
    private InvoiceStatus status;
    private String notes;
    private BigDecimal discount;
    private BigDecimal tax;
    private List<InvoiceItemRequestDTO> items;

    @Data
    public static class InvoiceItemRequestDTO {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
    }
}
