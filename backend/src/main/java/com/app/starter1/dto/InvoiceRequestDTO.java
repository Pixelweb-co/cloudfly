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

    // Campos DIAN requeridos en creación
    private String paymentMeans;
    private String paymentMethod;

    private List<InvoiceItemRequestDTO> items;

    @Data
    public static class InvoiceItemRequestDTO {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;

        // DIAN Item Fields
        private String descriptionDian;
        private String unitMeasure; // UNECE code e.g. NIU, KGM
        private BigDecimal taxRate; // 19.00
        private String standardCode; // e.g. UNSPSC or internal
        private Boolean isFree;
    }
}
